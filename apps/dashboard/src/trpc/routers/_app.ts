import type { inferRouterOutputs } from "@trpc/server";
import { createTRPCRouter } from "../init";
import { bankAccountsRouter } from "./bank-accounts";
import { tagsRouter } from "./tags";
import { teamRouter } from "./team";
import { transactionCategoriesRouter } from "./transaction-categories";
import { transactionsRouter } from "./transactions";

export const appRouter = createTRPCRouter({
  transactions: transactionsRouter,
  transactionCategories: transactionCategoriesRouter,
  team: teamRouter,
  bankAccounts: bankAccountsRouter,
  tags: tagsRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
export type RouterOutputs = inferRouterOutputs<AppRouter>;
