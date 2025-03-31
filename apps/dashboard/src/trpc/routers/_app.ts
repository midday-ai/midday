import type { inferRouterOutputs } from "@trpc/server";
import { createTRPCRouter } from "../init";
import { bankAccountsRouter } from "./bank-accounts";
import { inboxRouter } from "./inbox";
import { tagsRouter } from "./tags";
import { teamRouter } from "./team";
import { transactionAttachmentsRouter } from "./transaction-attachments";
import { transactionCategoriesRouter } from "./transaction-categories";
import { transactionTagsRouter } from "./transaction-tags";
import { transactionsRouter } from "./transactions";

export const appRouter = createTRPCRouter({
  transactions: transactionsRouter,
  transactionCategories: transactionCategoriesRouter,
  transactionTags: transactionTagsRouter,
  transactionAttachments: transactionAttachmentsRouter,
  team: teamRouter,
  bankAccounts: bankAccountsRouter,
  tags: tagsRouter,
  inbox: inboxRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
export type RouterOutputs = inferRouterOutputs<AppRouter>;
