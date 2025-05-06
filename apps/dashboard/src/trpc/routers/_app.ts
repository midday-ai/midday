import type { inferRouterInputs, inferRouterOutputs } from "@trpc/server";
import { createTRPCRouter } from "../init";
import { appsRouter } from "./apps";
import { bankAccountsRouter } from "./bank-accounts";
import { bankConnectionsRouter } from "./bank-connections";
import { customersRouter } from "./customers";
import { documentTagAssignmentsRouter } from "./document-tag-assignments";
import { documentTagsRouter } from "./document-tags";
import { documentsRouter } from "./documents";
import { inboxRouter } from "./inbox";
import { inboxAccountsRouter } from "./inbox-accounts";
import { institutionsRouter } from "./institutions";
import { invoiceTemplateRouter } from "./invoice-template";
import { invoiceRouter } from "./invoice/route";
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
});

// export type definition of API
export type AppRouter = typeof appRouter;
export type RouterOutputs = inferRouterOutputs<AppRouter>;
export type RouterInputs = inferRouterInputs<AppRouter>;
