import { createTRPCRouter } from "./trpc";
import { recoveryRouter } from "./routers/recovery";

export const appRouter = createTRPCRouter({
  recovery: recoveryRouter,
});

export type AppRouter = typeof appRouter;
