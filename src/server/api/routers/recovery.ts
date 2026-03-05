import { createTRPCRouter, protectedProcedure } from "../trpc";
import {
  paymentEvents,
  retryAttempts,
  recoveryResults,
  dunningMessages,
  subscriptions,
} from "@/server/db/schema";
import { desc, eq, sql, and, gte } from "drizzle-orm";
import { z } from "zod";

export const recoveryRouter = createTRPCRouter({
  getMetrics: protectedProcedure.query(async ({ ctx }) => {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [totals] = await ctx.db
      .select({
        totalEvents: sql<number>`count(*)::int`,
        totalRecovered: sql<number>`count(*) filter (where ${recoveryResults.recovered} = true)::int`,
        totalRecoveredCents: sql<number>`coalesce(sum(${recoveryResults.recoveredAmountCents}) filter (where ${recoveryResults.recovered} = true), 0)::int`,
        avgRecoveryHours: sql<number>`coalesce(avg(${recoveryResults.timeToRecoveryHours}) filter (where ${recoveryResults.recovered} = true), 0)`,
      })
      .from(recoveryResults);

    const [activeRetries] = await ctx.db
      .select({ count: sql<number>`count(*)::int` })
      .from(retryAttempts)
      .where(eq(retryAttempts.result, "pending"));

    const [pendingEvents] = await ctx.db
      .select({
        count: sql<number>`count(*)::int`,
        totalAtRiskCents: sql<number>`coalesce(sum(${paymentEvents.amountCents}), 0)::int`,
      })
      .from(paymentEvents)
      .where(
        and(
          gte(paymentEvents.createdAt, thirtyDaysAgo),
          sql`${paymentEvents.id} not in (select ${recoveryResults.paymentEventId} from ${recoveryResults})`
        )
      );

    const recoveryRate =
      totals.totalEvents > 0
        ? totals.totalRecovered / totals.totalEvents
        : 0;

    return {
      mrrSavedCents: totals.totalRecoveredCents,
      recoveryRate,
      totalRecovered: totals.totalRecovered,
      totalEvents: totals.totalEvents,
      avgRecoveryHours: Math.round(totals.avgRecoveryHours * 10) / 10,
      activeRetries: activeRetries.count,
      atRiskCents: pendingEvents.totalAtRiskCents,
      pendingEvents: pendingEvents.count,
    };
  }),

  getRecentPaymentEvents: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const events = await ctx.db
        .select({
          id: paymentEvents.id,
          stripeInvoiceId: paymentEvents.stripeInvoiceId,
          eventType: paymentEvents.eventType,
          declineCode: paymentEvents.declineCode,
          declineType: paymentEvents.declineType,
          amountCents: paymentEvents.amountCents,
          currency: paymentEvents.currency,
          attemptCount: paymentEvents.attemptCount,
          createdAt: paymentEvents.createdAt,
          customerEmail: subscriptions.customerEmail,
          customerName: subscriptions.customerName,
        })
        .from(paymentEvents)
        .leftJoin(
          subscriptions,
          eq(paymentEvents.subscriptionId, subscriptions.id)
        )
        .orderBy(desc(paymentEvents.createdAt))
        .limit(input.limit)
        .offset(input.offset);

      const eventIds = events.map((e) => e.id);
      const recoveries =
        eventIds.length > 0
          ? await ctx.db
              .select()
              .from(recoveryResults)
              .where(sql`${recoveryResults.paymentEventId} in ${eventIds}`)
          : [];

      const recoveryMap = new Map(
        recoveries.map((r) => [r.paymentEventId, r])
      );

      return events.map((event) => {
        const recovery = recoveryMap.get(event.id);
        return {
          ...event,
          status: recovery?.recovered
            ? ("recovered" as const)
            : recovery
              ? ("failed" as const)
              : ("active" as const),
          recoveredAt: recovery?.recoveredAt ?? null,
          recoveryMethod: recovery?.recoveryMethod ?? null,
        };
      });
    }),

  getRetryAttempts: protectedProcedure
    .input(z.object({ paymentEventId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      return ctx.db
        .select()
        .from(retryAttempts)
        .where(eq(retryAttempts.paymentEventId, input.paymentEventId))
        .orderBy(desc(retryAttempts.createdAt));
    }),

  getDunningMessages: protectedProcedure
    .input(z.object({ paymentEventId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      return ctx.db
        .select()
        .from(dunningMessages)
        .where(eq(dunningMessages.paymentEventId, input.paymentEventId))
        .orderBy(desc(dunningMessages.createdAt));
    }),

  getRecoveryTimeline: protectedProcedure
    .input(z.object({ days: z.number().min(7).max(90).default(30) }))
    .query(async ({ ctx, input }) => {
      const since = new Date(Date.now() - input.days * 24 * 60 * 60 * 1000);

      return ctx.db
        .select({
          date: sql<string>`date_trunc('day', ${recoveryResults.createdAt})::date::text`,
          recovered: sql<number>`count(*) filter (where ${recoveryResults.recovered} = true)::int`,
          failed: sql<number>`count(*) filter (where ${recoveryResults.recovered} = false)::int`,
          amountCents: sql<number>`coalesce(sum(${recoveryResults.recoveredAmountCents}) filter (where ${recoveryResults.recovered} = true), 0)::int`,
        })
        .from(recoveryResults)
        .where(gte(recoveryResults.createdAt, since))
        .groupBy(sql`date_trunc('day', ${recoveryResults.createdAt})::date`)
        .orderBy(sql`date_trunc('day', ${recoveryResults.createdAt})::date`);
    }),
});
