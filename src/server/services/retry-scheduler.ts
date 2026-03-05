import { db } from "@/server/db";
import {
  paymentEvents,
  retryAttempts,
  recoveryResults,
  accounts,
} from "@/server/db/schema";
import { eq, and } from "drizzle-orm";
import { stripe } from "@/lib/stripe";

const DEFAULT_RETRY_SCHEDULE_HOURS = [4, 24, 72, 120, 168];

interface RetryConfig {
  maxAttempts: number;
  scheduleHours: number[];
  skipHardDeclines: boolean;
}

const DEFAULT_CONFIG: RetryConfig = {
  maxAttempts: 5,
  scheduleHours: DEFAULT_RETRY_SCHEDULE_HOURS,
  skipHardDeclines: true,
};

function getOptimalRetryHour(): number {
  // Heuristic: retry between 6-10 AM local time (highest card success rates)
  const now = new Date();
  const hour = now.getUTCHours();
  if (hour >= 6 && hour <= 10) return 0; // retry now
  if (hour < 6) return 6 - hour;
  return 24 - hour + 6; // next day 6 AM
}

export async function scheduleRetries(paymentEventId: string) {
  const [event] = await db
    .select()
    .from(paymentEvents)
    .where(eq(paymentEvents.id, paymentEventId))
    .limit(1);

  if (!event) return;

  // Skip retries for hard declines
  if (event.declineType === "hard") {
    return;
  }

  // Load account settings for custom retry config
  const [account] = await db
    .select()
    .from(accounts)
    .where(eq(accounts.id, event.accountId))
    .limit(1);

  const config: RetryConfig = {
    ...DEFAULT_CONFIG,
    ...((account?.settings as Partial<RetryConfig>) ?? {}),
  };

  const existingAttempts = await db
    .select()
    .from(retryAttempts)
    .where(eq(retryAttempts.paymentEventId, paymentEventId));

  const attemptsMade = existingAttempts.length;
  const remainingAttempts = config.maxAttempts - attemptsMade;

  if (remainingAttempts <= 0) return;

  const now = new Date();
  const newAttempts = [];

  for (let i = 0; i < remainingAttempts; i++) {
    const scheduleIndex = attemptsMade + i;
    if (scheduleIndex >= config.scheduleHours.length) break;

    const delayHours = config.scheduleHours[scheduleIndex];
    const optimalOffset = i === 0 ? getOptimalRetryHour() : 0;
    const scheduledAt = new Date(
      now.getTime() + (delayHours + optimalOffset) * 60 * 60 * 1000
    );

    newAttempts.push({
      paymentEventId,
      accountId: event.accountId,
      scheduledAt,
      result: "pending" as const,
      strategy: "heuristic" as const,
    });
  }

  if (newAttempts.length > 0) {
    await db.insert(retryAttempts).values(newAttempts);
  }
}

export async function executeRetry(retryAttemptId: string) {
  const [attempt] = await db
    .select()
    .from(retryAttempts)
    .where(eq(retryAttempts.id, retryAttemptId))
    .limit(1);

  if (!attempt || attempt.result !== "pending") return;

  const [event] = await db
    .select()
    .from(paymentEvents)
    .where(eq(paymentEvents.id, attempt.paymentEventId))
    .limit(1);

  if (!event) return;

  const [account] = await db
    .select()
    .from(accounts)
    .where(eq(accounts.id, attempt.accountId))
    .limit(1);

  if (!account) return;

  try {
    const invoice = await stripe.invoices.pay(event.stripeInvoiceId, {
      stripeAccount: account.stripeAccountId,
    });

    const success = invoice.status === "paid";

    await db
      .update(retryAttempts)
      .set({
        executedAt: new Date(),
        result: success ? "success" : "failed",
        stripeChargeId: invoice.charge as string | null,
      })
      .where(eq(retryAttempts.id, retryAttemptId));

    if (success) {
      await db.insert(recoveryResults).values({
        paymentEventId: attempt.paymentEventId,
        accountId: attempt.accountId,
        recovered: true,
        recoveredAt: new Date(),
        recoveredAmountCents: event.amountCents,
        recoveryMethod: "retry",
        totalRetryAttempts: attempt.paymentEventId
          ? (
              await db
                .select()
                .from(retryAttempts)
                .where(
                  eq(retryAttempts.paymentEventId, attempt.paymentEventId)
                )
            ).length
          : 1,
        totalDunningMessages: 0,
        timeToRecoveryHours:
          (new Date().getTime() - new Date(event.createdAt!).getTime()) /
          (1000 * 60 * 60),
      });

      // Cancel remaining pending retries for this payment event
      await db
        .update(retryAttempts)
        .set({ result: "skipped" })
        .where(
          and(
            eq(retryAttempts.paymentEventId, attempt.paymentEventId),
            eq(retryAttempts.result, "pending")
          )
        );
    }
  } catch (err) {
    const stripeErr = err as { code?: string };
    await db
      .update(retryAttempts)
      .set({
        executedAt: new Date(),
        result: "failed",
        declineCode: stripeErr.code ?? "unknown",
      })
      .where(eq(retryAttempts.id, retryAttemptId));
  }
}
