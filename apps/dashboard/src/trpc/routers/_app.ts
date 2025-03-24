import type { inferRouterOutputs } from "@trpc/server";
import { createTRPCRouter } from "../init";
import { transactionsRouter } from "./transactions";

export const appRouter = createTRPCRouter({
  transactions: transactionsRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
export type RouterOutputs = inferRouterOutputs<AppRouter>;
