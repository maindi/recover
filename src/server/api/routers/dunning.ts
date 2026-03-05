import { createTRPCRouter, protectedProcedure } from "../trpc";
import { dunningTemplates, dunningMessages } from "@/server/db/schema";
import { eq, desc } from "drizzle-orm";
import { z } from "zod";

export const dunningRouter = createTRPCRouter({
  getTemplates: protectedProcedure
    .input(z.object({ accountId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      return ctx.db
        .select()
        .from(dunningTemplates)
        .where(eq(dunningTemplates.accountId, input.accountId))
        .orderBy(dunningTemplates.stepNumber);
    }),

  createTemplate: protectedProcedure
    .input(
      z.object({
        accountId: z.string().uuid(),
        name: z.string().min(1),
        channel: z.enum(["email", "sms"]),
        subject: z.string().optional(),
        body: z.string().min(1),
        stepNumber: z.number().int().min(1),
        delayHours: z.number().int().min(0),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [template] = await ctx.db
        .insert(dunningTemplates)
        .values(input)
        .returning();
      return template;
    }),

  updateTemplate: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().min(1).optional(),
        subject: z.string().optional(),
        body: z.string().min(1).optional(),
        delayHours: z.number().int().min(0).optional(),
        active: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      await ctx.db
        .update(dunningTemplates)
        .set(data)
        .where(eq(dunningTemplates.id, id));
      return { success: true };
    }),

  getMessages: protectedProcedure
    .input(
      z.object({
        accountId: z.string().uuid(),
        limit: z.number().min(1).max(100).default(50),
      })
    )
    .query(async ({ ctx, input }) => {
      return ctx.db
        .select()
        .from(dunningMessages)
        .where(eq(dunningMessages.accountId, input.accountId))
        .orderBy(desc(dunningMessages.createdAt))
        .limit(input.limit);
    }),
});
