import { createTRPCRouter, protectedProcedure } from "../trpc";
import { paymentEvents, retryAttempts, recoveryResults } from "@/server/db/schema";
import { desc, eq, sql } from "drizzle-orm";
import { z } from "zod";

export const recoveryRouter = createTRPCRouter({
  getMetrics: protectedProcedure.query(async ({ ctx }) => {
    // TODO: filter by account linked to current user
    const metrics = await ctx.db
      .select({
        totalEvents: sql<number>`count(*)`,
        totalRecovered: sql<number>`count(*) filter (where ${recoveryResults.recovered} = true)`,
        totalRecoveredCents: sql<number>`coalesce(sum(${recoveryResults.recoveredAmountCents}) filter (where ${recoveryResults.recovered} = true), 0)`,
      })
      .from(recoveryResults);

    return metrics[0];
  }),

  getRecentPaymentEvents: protectedProcedure
    .input(z.object({ limit: z.number().min(1).max(100).default(20) }))
    .query(async ({ ctx, input }) => {
      return ctx.db
        .select()
        .from(paymentEvents)
        .orderBy(desc(paymentEvents.createdAt))
        .limit(input.limit);
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
});
