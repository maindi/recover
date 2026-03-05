import { db } from "@/server/db";
import {
  paymentEvents,
  dunningMessages,
  dunningTemplates,
  accounts,
  subscriptions,
} from "@/server/db/schema";
import { eq, and } from "drizzle-orm";
import { resend } from "@/lib/resend";
import { stripe } from "@/lib/stripe";

const DEFAULT_TEMPLATES = [
  {
    stepNumber: 1,
    delayHours: 1,
    subject: "Action needed: your payment failed",
    body: `Hi {{customer_name}},

We were unable to process your payment of {{amount}} for your subscription.

This is usually caused by an expired card or insufficient funds. Please update your payment method to continue your service:

{{update_link}}

If you have any questions, just reply to this email.

Thanks,
The {{company_name}} team`,
  },
  {
    stepNumber: 2,
    delayHours: 72,
    subject: "Reminder: please update your payment method",
    body: `Hi {{customer_name}},

We're still unable to charge your card for {{amount}}. Your service may be interrupted if we can't process payment soon.

Update your payment method here:
{{update_link}}

Need help? Just reply to this email.

Thanks,
The {{company_name}} team`,
  },
  {
    stepNumber: 3,
    delayHours: 168,
    subject: "Final notice: your subscription will be cancelled",
    body: `Hi {{customer_name}},

This is our final attempt to reach you about your unpaid balance of {{amount}}. Your subscription will be cancelled if payment is not resolved within 48 hours.

Update your payment method now:
{{update_link}}

We'd hate to see you go. If there's anything we can help with, please don't hesitate to reach out.

Thanks,
The {{company_name}} team`,
  },
];

function fillTemplate(
  template: string,
  vars: Record<string, string>
): string {
  return template.replace(
    /\{\{(\w+)\}\}/g,
    (_, key) => vars[key] ?? `{{${key}}}`
  );
}

export async function sendDunningMessage(paymentEventId: string, step: number) {
  const [event] = await db
    .select()
    .from(paymentEvents)
    .where(eq(paymentEvents.id, paymentEventId))
    .limit(1);

  if (!event) return;

  const [account] = await db
    .select()
    .from(accounts)
    .where(eq(accounts.id, event.accountId))
    .limit(1);

  if (!account) return;

  // Try to find custom template, fall back to defaults
  const customTemplates = await db
    .select()
    .from(dunningTemplates)
    .where(
      and(
        eq(dunningTemplates.accountId, event.accountId),
        eq(dunningTemplates.stepNumber, step),
        eq(dunningTemplates.active, true),
        eq(dunningTemplates.channel, "email")
      )
    )
    .limit(1);

  const template = customTemplates[0] ?? DEFAULT_TEMPLATES[step - 1];
  if (!template) return;

  // Get subscription/customer info
  const sub = event.subscriptionId
    ? (
        await db
          .select()
          .from(subscriptions)
          .where(eq(subscriptions.id, event.subscriptionId))
          .limit(1)
      )[0]
    : null;

  // Generate card update link via Stripe Billing Portal
  let updateLink = "";
  try {
    const session = await stripe.billingPortal.sessions.create(
      {
        customer: sub?.stripeCustomerId ?? "",
        return_url: process.env.NEXT_PUBLIC_APP_URL ?? "https://app.recover.dev",
      },
      { stripeAccount: account.stripeAccountId }
    );
    updateLink = session.url;
  } catch {
    updateLink = `${process.env.NEXT_PUBLIC_APP_URL ?? "https://app.recover.dev"}/update-payment`;
  }

  const amount = event.amountCents
    ? `$${(event.amountCents / 100).toFixed(2)}`
    : "your subscription";

  const vars: Record<string, string> = {
    customer_name: sub?.customerName ?? "there",
    amount,
    company_name: account.companyName ?? "Your service",
    update_link: updateLink,
  };

  const subject = fillTemplate(
    "subject" in template ? (template.subject ?? "") : "",
    vars
  );
  const body = fillTemplate(template.body, vars);

  const recipientEmail = sub?.customerEmail;
  if (!recipientEmail) return;

  try {
    await resend.emails.send({
      from: `${account.companyName ?? "Recover"} <noreply@recover.dev>`,
      to: recipientEmail,
      subject,
      text: body,
    });

    await db.insert(dunningMessages).values({
      paymentEventId,
      accountId: event.accountId,
      channel: "email",
      templateId: "id" in template ? template.id : `default-${step}`,
      sentAt: new Date(),
      status: "sent",
    });
  } catch {
    await db.insert(dunningMessages).values({
      paymentEventId,
      accountId: event.accountId,
      channel: "email",
      templateId: "id" in template ? template.id : `default-${step}`,
      status: "pending",
    });
  }
}

export async function scheduleDunningSequence(paymentEventId: string) {
  const [event] = await db
    .select()
    .from(paymentEvents)
    .where(eq(paymentEvents.id, paymentEventId))
    .limit(1);

  if (!event) return;

  // Skip dunning for hard declines — go straight to card update
  if (event.declineType === "hard") {
    await sendDunningMessage(paymentEventId, 1);
    return;
  }

  // For soft declines, schedule the full sequence
  // Step 1 is sent immediately
  await sendDunningMessage(paymentEventId, 1);
}
