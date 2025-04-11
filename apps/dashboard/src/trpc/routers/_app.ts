import type { inferRouterOutputs } from "@trpc/server";
import { createTRPCRouter } from "../init";
import { appsRouter } from "./apps";
import { assistantRouter } from "./assistant";
import { bankAccountsRouter } from "./bank-accounts";
import { customersRouter } from "./customers";
import { inboxRouter } from "./inbox";
import { invoiceRouter } from "./invoice";
import { metricsRouter } from "./metrics";
import { tagsRouter } from "./tags";
import { teamRouter } from "./team";
import { trackerEntriesRouter } from "./tracker-entries";
import { trackerProjectsRouter } from "./tracker-projects";
import { transactionAttachmentsRouter } from "./transaction-attachments";
import { transactionCategoriesRouter } from "./transaction-categories";
import { transactionTagsRouter } from "./transaction-tags";
import { transactionsRouter } from "./transactions";
import { userRouter } from "./user";
import { vaultRouter } from "./vault";

export const appRouter = createTRPCRouter({
  transactions: transactionsRouter,
  transactionCategories: transactionCategoriesRouter,
  transactionAttachments: transactionAttachmentsRouter,
  team: teamRouter,
  bankAccounts: bankAccountsRouter,
  tags: tagsRouter,
  inbox: inboxRouter,
  user: userRouter,
  apps: appsRouter,
  metrics: metricsRouter,
  assistant: assistantRouter,
  invoice: invoiceRouter,
  vault: vaultRouter,
  customers: customersRouter,
  trackerProjects: trackerProjectsRouter,
  transactionTags: transactionTagsRouter,
  trackerEntries: trackerEntriesRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
export type RouterOutputs = inferRouterOutputs<AppRouter>;
