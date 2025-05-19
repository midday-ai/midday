import type { inferRouterInputs, inferRouterOutputs } from "@trpc/server";
import { createTRPCRouter } from "../init";
import { appsRouter } from "./apps/route";
import { bankAccountsRouter } from "./bank-accounts/route";
import { bankConnectionsRouter } from "./bank-connections/route";
import { customersRouter } from "./customers/route";
import { documentTagAssignmentsRouter } from "./document-tag-assignments/route";
import { documentTagsRouter } from "./document-tags/route";
import { documentsRouter } from "./documents/route";
import { inboxAccountsRouter } from "./inbox-accounts/route";
import { inboxRouter } from "./inbox/route";
import { institutionsRouter } from "./institutions/route";
import { invoiceTemplateRouter } from "./invoice-template/route";
import { invoiceRouter } from "./invoice/route";
import { metricsRouter } from "./metrics/route";
import { searchRouter } from "./search/route";
import { tagsRouter } from "./tags/route";
import { teamRouter } from "./team/route";
import { trackerEntriesRouter } from "./tracker-entries/route";
import { trackerProjectsRouter } from "./tracker-projects/route";
import { transactionAttachmentsRouter } from "./transaction-attachments/route";
import { transactionCategoriesRouter } from "./transaction-categories/route";
import { transactionTagsRouter } from "./transaction-tags/route";
import { transactionsRouter } from "./transactions/route";
import { userRouter } from "./user/route";

export const appRouter = createTRPCRouter({
  apps: appsRouter,
  bankAccounts: bankAccountsRouter,
  bankConnections: bankConnectionsRouter,
  customers: customersRouter,
  documents: documentsRouter,
  documentTagAssignments: documentTagAssignmentsRouter,
  documentTags: documentTagsRouter,
  inbox: inboxRouter,
  inboxAccounts: inboxAccountsRouter,
  institutions: institutionsRouter,
  invoice: invoiceRouter,
  invoiceTemplate: invoiceTemplateRouter,
  metrics: metricsRouter,
  tags: tagsRouter,
  team: teamRouter,
  trackerEntries: trackerEntriesRouter,
  trackerProjects: trackerProjectsRouter,
  transactionAttachments: transactionAttachmentsRouter,
  transactionCategories: transactionCategoriesRouter,
  transactions: transactionsRouter,
  transactionTags: transactionTagsRouter,
  user: userRouter,
  search: searchRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
export type RouterOutputs = inferRouterOutputs<AppRouter>;
export type RouterInputs = inferRouterInputs<AppRouter>;
