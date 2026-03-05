import { createTRPCRouter } from "./trpc";
import { recoveryRouter } from "./routers/recovery";
import { accountsRouter } from "./routers/accounts";
import { dunningRouter } from "./routers/dunning";

export const appRouter = createTRPCRouter({
  recovery: recoveryRouter,
  accounts: accountsRouter,
  dunning: dunningRouter,
});

export type AppRouter = typeof appRouter;
