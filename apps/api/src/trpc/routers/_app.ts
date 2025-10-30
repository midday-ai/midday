import type { inferRouterInputs, inferRouterOutputs } from "@trpc/server";
import { createTRPCRouter } from "../init";
import { apiKeysRouter } from "./api-keys";
import { appsRouter } from "./apps";
import { bankAccountsRouter } from "./bank-accounts";
import { bankConnectionsRouter } from "./bank-connections";
import { billingRouter } from "./billing";
import { chatsRouter } from "./chats";
import { customersRouter } from "./customers";
import { documentTagAssignmentsRouter } from "./document-tag-assignments";
import { documentTagsRouter } from "./document-tags";
import { documentsRouter } from "./documents";
import { chatFeedbackRouter } from "./feedback";
import { inboxRouter } from "./inbox";
import { inboxAccountsRouter } from "./inbox-accounts";
import { institutionsRouter } from "./institutions";
import { invoiceRouter } from "./invoice";
import { invoiceProductsRouter } from "./invoice-products";
import { invoiceTemplateRouter } from "./invoice-template";
import { notificationSettingsRouter } from "./notification-settings";
import { notificationsRouter } from "./notifications";
import { oauthApplicationsRouter } from "./oauth-applications";
import { reportsRouter } from "./reports";
import { searchRouter } from "./search";
import { shortLinksRouter } from "./short-links";
import { suggestedActionsRouter } from "./suggested-actions";
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
  notifications: notificationsRouter,
  notificationSettings: notificationSettingsRouter,
  apps: appsRouter,
  bankAccounts: bankAccountsRouter,
  bankConnections: bankConnectionsRouter,
  chats: chatsRouter,
  customers: customersRouter,
  documents: documentsRouter,
  documentTagAssignments: documentTagAssignmentsRouter,
  documentTags: documentTagsRouter,
  chatFeedback: chatFeedbackRouter,
  inbox: inboxRouter,
  inboxAccounts: inboxAccountsRouter,
  institutions: institutionsRouter,
  invoice: invoiceRouter,
  invoiceProducts: invoiceProductsRouter,
  invoiceTemplate: invoiceTemplateRouter,
  reports: reportsRouter,
  oauthApplications: oauthApplicationsRouter,
  billing: billingRouter,
  suggestedActions: suggestedActionsRouter,
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
  shortLinks: shortLinksRouter,
  apiKeys: apiKeysRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
export type RouterOutputs = inferRouterOutputs<AppRouter>;
export type RouterInputs = inferRouterInputs<AppRouter>;
