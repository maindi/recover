import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { db } from "@/server/db";
import { paymentEvents, subscriptions, accounts } from "@/server/db/schema";
import { eq, and } from "drizzle-orm";
import { scheduleRetries } from "@/server/services/retry-scheduler";
import { scheduleDunningSequence } from "@/server/services/dunning";
import { markRecoveredFromPayment } from "@/server/services/recovery-tracker";
import type Stripe from "stripe";

const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET!;

function classifyDecline(declineCode: string | null): string {
  const hardDeclines = [
    "stolen_card",
    "lost_card",
    "card_declined",
    "expired_card",
    "incorrect_number",
    "pickup_card",
    "fraudulent",
  ];

  if (!declineCode) return "soft";
  if (declineCode === "authentication_required") return "auth_required";
  if (hardDeclines.includes(declineCode)) return "hard";
  return "soft";
}

async function resolveAccountId(
  stripeAccountId: string
): Promise<string | null> {
  const [account] = await db
    .select({ id: accounts.id })
    .from(accounts)
    .where(eq(accounts.stripeAccountId, stripeAccountId))
    .limit(1);
  return account?.id ?? null;
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, WEBHOOK_SECRET);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const stripeAccountId = event.account;
  if (!stripeAccountId) {
    return NextResponse.json({ received: true });
  }

  const accountId = await resolveAccountId(stripeAccountId);
  if (!accountId) {
    return NextResponse.json({ received: true });
  }

  // Idempotency: check if we've already processed this event
  const existing = await db
    .select({ id: paymentEvents.id })
    .from(paymentEvents)
    .where(eq(paymentEvents.stripeEventId, event.id))
    .limit(1);

  switch (event.type) {
    case "invoice.payment_failed": {
      if (existing.length > 0) break;

      const invoice = event.data.object as Stripe.Invoice;
      const charge = invoice.charge
        ? await stripe.charges.retrieve(invoice.charge as string, {
            stripeAccount: stripeAccountId,
          })
        : null;

      const declineCode = charge?.failure_code ?? null;
      const declineType = classifyDecline(declineCode);

      // Find or create subscription record
      let subscriptionId: string | null = null;
      if (invoice.subscription) {
        const stripeSubId =
          typeof invoice.subscription === "string"
            ? invoice.subscription
            : invoice.subscription.id;

        const [existingSub] = await db
          .select()
          .from(subscriptions)
          .where(
            and(
              eq(subscriptions.accountId, accountId),
              eq(subscriptions.stripeSubscriptionId, stripeSubId)
            )
          )
          .limit(1);

        if (existingSub) {
          subscriptionId = existingSub.id;
        } else {
          const stripeSub = await stripe.subscriptions.retrieve(stripeSubId, {
            stripeAccount: stripeAccountId,
          });
          const customer = await stripe.customers.retrieve(
            typeof stripeSub.customer === "string"
              ? stripeSub.customer
              : stripeSub.customer.id,
            { stripeAccount: stripeAccountId }
          );

          const customerObj = customer as Stripe.Customer;
          const [newSub] = await db
            .insert(subscriptions)
            .values({
              accountId,
              stripeSubscriptionId: stripeSubId,
              stripeCustomerId: customerObj.id,
              customerEmail: customerObj.email,
              customerName: customerObj.name,
              status: stripeSub.status,
              currentPeriodEnd: new Date(
                stripeSub.current_period_end * 1000
              ),
            })
            .returning({ id: subscriptions.id });

          subscriptionId = newSub.id;
        }
      }

      const [inserted] = await db
        .insert(paymentEvents)
        .values({
          accountId,
          subscriptionId,
          stripeInvoiceId: invoice.id,
          stripeEventId: event.id,
          eventType: event.type,
          declineCode,
          declineType,
          amountCents: invoice.amount_due,
          currency: invoice.currency,
          attemptCount: invoice.attempt_count ?? 1,
          nextPaymentAttempt: invoice.next_payment_attempt
            ? new Date(invoice.next_payment_attempt * 1000)
            : null,
          rawPayload: event.data.object as Record<string, unknown>,
        })
        .returning({ id: paymentEvents.id });

      // Schedule retries and dunning
      await scheduleRetries(inserted.id);
      await scheduleDunningSequence(inserted.id);
      break;
    }

    case "invoice.paid": {
      const invoice = event.data.object as Stripe.Invoice;
      await markRecoveredFromPayment(invoice.id, accountId);
      break;
    }

    case "invoice.payment_action_required": {
      if (existing.length > 0) break;
      const invoice = event.data.object as Stripe.Invoice;

      await db.insert(paymentEvents).values({
        accountId,
        stripeInvoiceId: invoice.id,
        stripeEventId: event.id,
        eventType: event.type,
        declineType: "auth_required",
        amountCents: invoice.amount_due,
        currency: invoice.currency,
        rawPayload: event.data.object as Record<string, unknown>,
      });
      break;
    }

    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      const stripeSubId = subscription.id;

      await db
        .update(subscriptions)
        .set({
          status: subscription.status,
          currentPeriodEnd: new Date(
            subscription.current_period_end * 1000
          ),
        })
        .where(
          and(
            eq(subscriptions.accountId, accountId),
            eq(subscriptions.stripeSubscriptionId, stripeSubId)
          )
        );
      break;
    }
  }

  return NextResponse.json({ received: true });
}
