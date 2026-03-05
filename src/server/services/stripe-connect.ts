import { db } from "@/server/db";
import { accounts } from "@/server/db/schema";
import { stripe } from "@/lib/stripe";
import { eq } from "drizzle-orm";

export async function handleStripeOAuthCallback(code: string) {
  const response = await stripe.oauth.token({
    grant_type: "authorization_code",
    code,
  });

  const stripeAccountId = response.stripe_user_id;
  if (!stripeAccountId) {
    throw new Error("No stripe_user_id in OAuth response");
  }

  // Get account details from Stripe
  const stripeAccount = await stripe.accounts.retrieve(stripeAccountId);

  // Upsert account
  const existing = await db
    .select()
    .from(accounts)
    .where(eq(accounts.stripeAccountId, stripeAccountId))
    .limit(1);

  if (existing.length > 0) {
    await db
      .update(accounts)
      .set({
        stripeRefreshToken: response.refresh_token,
        companyName:
          stripeAccount.business_profile?.name ??
          stripeAccount.settings?.dashboard?.display_name ??
          existing[0].companyName,
        onboardedAt: new Date(),
      })
      .where(eq(accounts.stripeAccountId, stripeAccountId));

    return existing[0].id;
  }

  const [newAccount] = await db
    .insert(accounts)
    .values({
      stripeAccountId,
      stripeRefreshToken: response.refresh_token,
      companyName:
        stripeAccount.business_profile?.name ??
        stripeAccount.settings?.dashboard?.display_name ??
        null,
      onboardedAt: new Date(),
    })
    .returning({ id: accounts.id });

  // Register webhooks for this connected account
  await registerWebhooks();

  return newAccount.id;
}

async function registerWebhooks() {
  const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "https://app.recover.dev"}/api/webhooks/stripe`;

  await stripe.webhookEndpoints.create({
    url: webhookUrl,
    enabled_events: [
      "invoice.payment_failed",
      "invoice.paid",
      "invoice.payment_action_required",
      "invoice.finalization_failed",
      "customer.subscription.updated",
      "customer.subscription.trial_will_end",
    ],
    connect: true,
  });
}

export function getStripeConnectUrl() {
  const clientId = process.env.STRIPE_CLIENT_ID;
  if (!clientId) throw new Error("STRIPE_CLIENT_ID not configured");

  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL ?? "https://app.recover.dev"}/api/stripe/callback`;

  return `https://connect.stripe.com/oauth/authorize?response_type=code&client_id=${clientId}&scope=read_write&redirect_uri=${encodeURIComponent(redirectUri)}`;
}
