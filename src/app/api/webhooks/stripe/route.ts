import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { db } from "@/server/db";
import { paymentEvents } from "@/server/db/schema";
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

  switch (event.type) {
    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      const charge = invoice.charge
        ? await stripe.charges.retrieve(invoice.charge as string)
        : null;

      await db.insert(paymentEvents).values({
        accountId: invoice.account as string,
        stripeInvoiceId: invoice.id,
        stripeEventId: event.id,
        eventType: event.type,
        declineCode: charge?.failure_code ?? null,
        declineType: classifyDecline(charge?.failure_code ?? null),
        amountCents: invoice.amount_due,
        currency: invoice.currency,
        attemptCount: invoice.attempt_count ?? 1,
        nextPaymentAttempt: invoice.next_payment_attempt
          ? new Date(invoice.next_payment_attempt * 1000)
          : null,
        rawPayload: event.data.object as Record<string, unknown>,
      });

      // TODO: enqueue retry scheduling job
      // TODO: enqueue dunning message job
      break;
    }

    case "invoice.paid": {
      // TODO: mark recovery as successful if this was a previously failed invoice
      break;
    }

    case "invoice.payment_action_required": {
      // TODO: trigger 3DS / authentication flow notification
      break;
    }

    case "customer.subscription.updated": {
      // TODO: sync subscription status
      break;
    }
  }

  return NextResponse.json({ received: true });
}
