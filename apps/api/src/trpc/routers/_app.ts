import type { inferRouterInputs, inferRouterOutputs } from "@trpc/server";
import { createTRPCRouter } from "../init";
import { accountingRouter } from "./accounting";
import { apiKeysRouter } from "./api-keys";
import { appsRouter } from "./apps";
import { bankAccountsRouter } from "./bank-accounts";
import { bankConnectionsRouter } from "./bank-connections";
import { billingRouter } from "./billing";
import { chatsRouter } from "./chats";
import { merchantsRouter } from "./merchants";
import { documentTagAssignmentsRouter } from "./document-tag-assignments";
import { documentTagsRouter } from "./document-tags";
import { documentsRouter } from "./documents";
import { chatFeedbackRouter } from "./feedback";
import { inboxRouter } from "./inbox";
import { inboxAccountsRouter } from "./inbox-accounts";
import { institutionsRouter } from "./institutions";
import { dealRouter } from "./deal";
import { dealPaymentsRouter } from "./deal-payments";
import { dealProductsRouter } from "./deal-products";
import { dealRecurringRouter } from "./deal-recurring";
import { dealTemplateRouter } from "./deal-template";
import { jobsRouter } from "./jobs";
import { notificationSettingsRouter } from "./notification-settings";
import { notificationsRouter } from "./notifications";
import { oauthApplicationsRouter } from "./oauth-applications";
import { reportsRouter } from "./reports";
import { searchRouter } from "./search";
import { shortLinksRouter } from "./short-links";
import { suggestedActionsRouter } from "./suggested-actions";
import { tagsRouter } from "./tags";
import { teamRouter } from "./team";
import { transactionAttachmentsRouter } from "./transaction-attachments";
import { transactionCategoriesRouter } from "./transaction-categories";
import { transactionRulesRouter } from "./transaction-rules";
import { transactionTagsRouter } from "./transaction-tags";
import { transactionsRouter } from "./transactions";
import { userRouter } from "./user";
import { widgetsRouter } from "./widgets";
import { mcaDealsRouter } from "./mca-deals";
import { merchantPortalRouter } from "./merchant-portal";
import { underwritingRouter } from "./underwriting";
import { brokersRouter } from "./brokers";
import { syndicationRouter } from "./syndication";
import { disclosuresRouter } from "./disclosures";
import { dealFeesRouter } from "./deal-fees";
import { reconciliationRouter } from "./reconciliation";
import { achBatchesRouter } from "./ach-batches";
import { exportTemplatesRouter } from "./export-templates";
import { riskRouter } from "./risk";
import { collectionsRouter } from "./collections";
import { collectionConfigRouter } from "./collection-config";

export const appRouter = createTRPCRouter({
  accounting: accountingRouter,
  notifications: notificationsRouter,
  notificationSettings: notificationSettingsRouter,
  apps: appsRouter,
  bankAccounts: bankAccountsRouter,
  bankConnections: bankConnectionsRouter,
  chats: chatsRouter,
  merchants: merchantsRouter,
  documents: documentsRouter,
  documentTagAssignments: documentTagAssignmentsRouter,
  documentTags: documentTagsRouter,
  chatFeedback: chatFeedbackRouter,
  inbox: inboxRouter,
  inboxAccounts: inboxAccountsRouter,
  institutions: institutionsRouter,
  deal: dealRouter,
  dealPayments: dealPaymentsRouter,
  dealProducts: dealProductsRouter,
  dealRecurring: dealRecurringRouter,
  dealTemplate: dealTemplateRouter,
  jobs: jobsRouter,
  reports: reportsRouter,
  oauthApplications: oauthApplicationsRouter,
  billing: billingRouter,
  suggestedActions: suggestedActionsRouter,
  tags: tagsRouter,
  team: teamRouter,
  transactionAttachments: transactionAttachmentsRouter,
  transactionCategories: transactionCategoriesRouter,
  transactionRules: transactionRulesRouter,
  transactions: transactionsRouter,
  transactionTags: transactionTagsRouter,
  user: userRouter,
  search: searchRouter,
  shortLinks: shortLinksRouter,
  apiKeys: apiKeysRouter,
  widgets: widgetsRouter,
  mcaDeals: mcaDealsRouter,
  merchantPortal: merchantPortalRouter,
  underwriting: underwritingRouter,
  brokers: brokersRouter,
  syndication: syndicationRouter,
  disclosures: disclosuresRouter,
  dealFees: dealFeesRouter,
  reconciliation: reconciliationRouter,
  achBatches: achBatchesRouter,
  exportTemplates: exportTemplatesRouter,
  risk: riskRouter,
  collections: collectionsRouter,
  collectionConfig: collectionConfigRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
export type RouterOutputs = inferRouterOutputs<AppRouter>;
export type RouterInputs = inferRouterInputs<AppRouter>;
