import type { inferRouterInputs, inferRouterOutputs } from "@trpc/server";
import { createTRPCRouter } from "../init";
import { appsRouter } from "./apps/route";
import { bankAccountsRouter } from "./bank-accounts/route";
import { bankConnectionsRouter } from "./bank-connections/route";
import { customersRouter } from "./customers/route";
import { documentTagAssignmentsRouter } from "./document-tag-assignments/route";
import { documentTagsRouter } from "./document-tags/route";
import { documentsRouter } from "./documents/route";
import { inboxRouter } from "./inbox";
import { inboxAccountsRouter } from "./inbox-accounts/route";
import { institutionsRouter } from "./institutions";
import { invoiceTemplateRouter } from "./invoice-template";
import { invoiceRouter } from "./invoice/route";
import { metricsRouter } from "./metrics";
import { searchRouter } from "./search/route";
import { tagsRouter } from "./tags/route";
import { teamRouter } from "./team";
import { trackerEntriesRouter } from "./tracker-entries";
import { trackerProjectsRouter } from "./tracker-projects";
import { transactionAttachmentsRouter } from "./transaction-attachments";
import { transactionCategoriesRouter } from "./transaction-categories";
import { transactionTagsRouter } from "./transaction-tags";
import { transactionsRouter } from "./transactions";
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
