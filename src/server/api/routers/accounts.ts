import { createTRPCRouter, protectedProcedure } from "../trpc";
import { accounts } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getStripeConnectUrl } from "@/server/services/stripe-connect";

export const accountsRouter = createTRPCRouter({
  getCurrent: protectedProcedure.query(async ({ ctx }) => {
    // TODO: link Clerk userId to account
    const result = await ctx.db.select().from(accounts).limit(1);
    return result[0] ?? null;
  }),

  getConnectUrl: protectedProcedure.query(() => {
    return { url: getStripeConnectUrl() };
  }),

  updateSettings: protectedProcedure
    .input(
      z.object({
        accountId: z.string().uuid(),
        settings: z.record(z.unknown()),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .update(accounts)
        .set({ settings: input.settings })
        .where(eq(accounts.id, input.accountId));
      return { success: true };
    }),
});
