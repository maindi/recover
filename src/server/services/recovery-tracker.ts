import { db } from "@/server/db";
import {
  paymentEvents,
  retryAttempts,
  recoveryResults,
  dunningMessages,
} from "@/server/db/schema";
import { eq, and } from "drizzle-orm";

export async function markRecoveredFromPayment(
  stripeInvoiceId: string,
  accountId: string
) {
  // Find the original payment event
  const events = await db
    .select()
    .from(paymentEvents)
    .where(
      and(
        eq(paymentEvents.stripeInvoiceId, stripeInvoiceId),
        eq(paymentEvents.accountId, accountId)
      )
    );

  if (events.length === 0) return;

  const event = events[0];

  // Check if already tracked
  const existing = await db
    .select()
    .from(recoveryResults)
    .where(eq(recoveryResults.paymentEventId, event.id))
    .limit(1);

  if (existing.length > 0) return;

  // Count retry attempts and dunning messages
  const attempts = await db
    .select()
    .from(retryAttempts)
    .where(eq(retryAttempts.paymentEventId, event.id));

  const messages = await db
    .select()
    .from(dunningMessages)
    .where(eq(dunningMessages.paymentEventId, event.id));

  // Determine recovery method
  const successfulRetry = attempts.find((a) => a.result === "success");
  const recoveryMethod = successfulRetry
    ? "retry"
    : messages.length > 0
      ? "card_update"
      : "manual";

  const timeToRecoveryHours = event.createdAt
    ? (new Date().getTime() - new Date(event.createdAt).getTime()) /
      (1000 * 60 * 60)
    : null;

  await db.insert(recoveryResults).values({
    paymentEventId: event.id,
    accountId: event.accountId,
    recovered: true,
    recoveredAt: new Date(),
    recoveredAmountCents: event.amountCents,
    recoveryMethod,
    totalRetryAttempts: attempts.length,
    totalDunningMessages: messages.length,
    timeToRecoveryHours,
  });

  // Cancel any pending retries
  await db
    .update(retryAttempts)
    .set({ result: "skipped" })
    .where(
      and(
        eq(retryAttempts.paymentEventId, event.id),
        eq(retryAttempts.result, "pending")
      )
    );
}
