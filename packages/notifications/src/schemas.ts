import { z } from "zod";

export const createActivitySchema = z.object({
  teamId: z.string().uuid(),
  userId: z.string().uuid().optional(),
  type: z.enum([
    "transactions_created",
    "transactions_enriched",
    "inbox_new",
    "inbox_auto_matched",
    "inbox_needs_review",
    "inbox_cross_currency_matched",
    "inbox_match_confirmed",
    "deal_paid",
    "deal_overdue",
    "deal_scheduled",
    "deal_sent",
    "deal_reminder_sent",
    "deal_cancelled",
    "deal_created",
    "deal_refunded",
    "draft_deal_created",
    "document_uploaded",
    "document_processed",
    "deal_duplicated",
    "transactions_categorized",
    "transactions_assigned",
    "transaction_attachment_created",
    "transaction_category_created",
    "transactions_exported",
    "merchant_created",
    "recurring_series_completed",
    "recurring_series_started",
    "recurring_series_paused",
    "recurring_deal_upcoming",
  ]),
  source: z.enum(["system", "user"]).default("system"),
  priority: z.number().int().min(1).max(10).default(5),
  groupId: z.string().uuid().optional(), // Links related activities together
  metadata: z.record(z.any(), z.any()), // Flexible - any JSON object
});

export type CreateActivityInput = z.infer<typeof createActivitySchema>;

export const userSchema = z.object({
  id: z.string().uuid(),
  full_name: z.string(),
  email: z.string().email(),
  locale: z.string().optional(),
  avatar_url: z.string().optional(),
  team_id: z.string().uuid(),
  role: z.enum(["owner", "member"]).optional(),
});

export const transactionSchema = z.object({
  id: z.string(),
  name: z.string(),
  amount: z.number(),
  currency: z.string(),
  date: z.string(),
  category: z.string().optional(),
  status: z.string().optional(),
});

export const dealSchema = z.object({
  id: z.string(),
  number: z.string(),
  amount: z.number(),
  currency: z.string(),
  due_date: z.string(),
  status: z.string(),
});

export const transactionsCreatedSchema = z.object({
  users: z.array(userSchema),
  transactions: z.array(transactionSchema),
});

export const transactionsExportedSchema = z.object({
  users: z.array(userSchema),
  transactionCount: z.number(),
  locale: z.string(),
  dateFormat: z.string(),
  downloadLink: z.string().optional(),
  accountantEmail: z.string().optional(),
  sendEmail: z.boolean().optional(),
});

export const documentUploadedSchema = z.object({
  users: z.array(userSchema),
  fileName: z.string(),
  filePath: z.array(z.string()),
  mimeType: z.string(),
});

export const documentProcessedSchema = z.object({
  users: z.array(userSchema),
  fileName: z.string(),
  filePath: z.array(z.string()),
  mimeType: z.string(),
  contentLength: z.number().optional(),
  sampleLength: z.number().optional(),
  isImage: z.boolean().optional(),
});

export const inboxItemSchema = z.object({
  totalCount: z.number(),
  source: z.enum(["user", "system"]).default("system"),
  provider: z.string(),
});

export const inboxNewSchema = z.object({
  users: z.array(userSchema),
  totalCount: z.number(),
  inboxType: z.enum(["email", "sync", "upload"]),
  source: z.enum(["user", "system"]).default("system"),
  provider: z.string().optional(),
});

export const inboxAutoMatchedSchema = z.object({
  users: z.array(userSchema),
  inboxId: z.string().uuid(),
  transactionId: z.string().uuid(),
  documentName: z.string(),
  documentAmount: z.number(),
  documentCurrency: z.string(),
  transactionAmount: z.number(),
  transactionCurrency: z.string(),
  transactionName: z.string(),
  confidenceScore: z.number(),
  matchType: z.enum(["auto_matched"]),
  isCrossCurrency: z.boolean().optional(),
});

export const inboxNeedsReviewSchema = z.object({
  users: z.array(userSchema),
  inboxId: z.string().uuid(),
  transactionId: z.string().uuid(),
  documentName: z.string(),
  documentAmount: z.number(),
  documentCurrency: z.string(),
  transactionAmount: z.number(),
  transactionCurrency: z.string(),
  transactionName: z.string(),
  confidenceScore: z.number(),
  matchType: z.enum(["high_confidence", "suggested"]),
  isCrossCurrency: z.boolean().optional(),
});

export const inboxCrossCurrencyMatchedSchema = z.object({
  users: z.array(userSchema),
  inboxId: z.string().uuid(),
  transactionId: z.string().uuid(),
  documentName: z.string(),
  documentAmount: z.number(),
  documentCurrency: z.string(),
  transactionAmount: z.number(),
  transactionCurrency: z.string(),
  transactionName: z.string(),
  confidenceScore: z.number(),
  matchType: z.enum(["auto_matched", "high_confidence", "suggested"]),
});

export const dealPaidSchema = z.object({
  users: z.array(userSchema),
  dealId: z.string().uuid(),
  dealNumber: z.string(),
  merchantName: z.string().optional(),
  paidAt: z.string().optional(),
  source: z.enum(["user", "system"]).default("system"),
});

export const dealOverdueSchema = z.object({
  users: z.array(userSchema),
  dealId: z.string().uuid(),
  dealNumber: z.string(),
  merchantName: z.string(),
  source: z.enum(["user", "system"]).default("system"),
});

export const dealScheduledSchema = z.object({
  users: z.array(userSchema),
  dealId: z.string().uuid(),
  dealNumber: z.string(),
  scheduledAt: z.string(),
  merchantName: z.string().optional(),
});

export const dealSentSchema = z.object({
  users: z.array(userSchema),
  dealId: z.string().uuid(),
  token: z.string(),
  dealNumber: z.string(),
  merchantName: z.string(),
  merchantEmail: z.string().email().optional(),
});

export const dealReminderSentSchema = z.object({
  users: z.array(userSchema),
  dealId: z.string().uuid(),
  token: z.string(),
  dealNumber: z.string(),
  merchantName: z.string(),
  merchantEmail: z.string().email().optional(),
});

export const dealCancelledSchema = z.object({
  users: z.array(userSchema),
  dealId: z.string().uuid(),
  dealNumber: z.string(),
  merchantName: z.string().optional(),
});

export const dealCreatedSchema = z.object({
  users: z.array(userSchema),
  dealId: z.string().uuid(),
  dealNumber: z.string(),
  merchantName: z.string().optional(),
  amount: z.number().optional(),
  currency: z.string().optional(),
});

export const dealRefundedSchema = z.object({
  users: z.array(userSchema),
  dealId: z.string().uuid(),
  dealNumber: z.string(),
  merchantName: z.string().optional(),
  refundedAt: z.string().optional(),
});

export const recurringSeriesCompletedSchema = z.object({
  users: z.array(userSchema),
  dealId: z.string().uuid(),
  dealNumber: z.string(),
  merchantName: z.string().optional(),
  recurringId: z.string().uuid(),
  totalGenerated: z.number(),
});

export const recurringSeriesStartedSchema = z.object({
  users: z.array(userSchema),
  recurringId: z.string().uuid(),
  dealId: z.string().uuid().optional(), // First deal ID if linked
  dealNumber: z.string().optional(),
  merchantName: z.string().optional(),
  frequency: z.string(),
  endType: z.enum(["never", "on_date", "after_count"]),
  endDate: z.string().optional(),
  endCount: z.number().optional(),
});

export const recurringSeriesPausedSchema = z.object({
  users: z.array(userSchema),
  recurringId: z.string().uuid(),
  merchantName: z.string().optional(),
  reason: z.enum(["manual", "auto_failure"]).default("manual"),
  failureCount: z.number().optional(),
});

// Schema for individual deal in the batch
export const upcomingDealItemSchema = z.object({
  recurringId: z.string().uuid(),
  merchantName: z.string().optional(),
  amount: z.number().optional(),
  currency: z.string().optional(),
  scheduledAt: z.string(), // ISO date when deal will be generated
  frequency: z.string(), // e.g., "weekly", "monthly_date"
});

export const recurringDealUpcomingSchema = z.object({
  users: z.array(userSchema),
  deals: z.array(upcomingDealItemSchema),
  count: z.number(),
});

export const transactionsCategorizedSchema = z.object({
  users: z.array(userSchema),
  categorySlug: z.string(),
  transactionIds: z.array(z.string()),
});

export const transactionsAssignedSchema = z.object({
  users: z.array(userSchema),
  assignedUserId: z.string(),
  transactionIds: z.array(z.string()),
});

export type UserData = z.infer<typeof userSchema>;
export type TransactionData = z.infer<typeof transactionSchema>;
export type DealData = z.infer<typeof dealSchema>;
export type TransactionsCreatedInput = z.infer<
  typeof transactionsCreatedSchema
>;
export type TransactionsExportedInput = z.infer<
  typeof transactionsExportedSchema
>;
export type DocumentUploadedInput = z.infer<typeof documentUploadedSchema>;
export type DocumentProcessedInput = z.infer<typeof documentProcessedSchema>;

export type InboxItemData = z.infer<typeof inboxItemSchema>;
export type InboxNewInput = z.infer<typeof inboxNewSchema>;
export type InboxAutoMatchedInput = z.infer<typeof inboxAutoMatchedSchema>;

export type InboxNeedsReviewInput = z.infer<typeof inboxNeedsReviewSchema>;
export type InboxCrossCurrencyMatchedInput = z.infer<
  typeof inboxCrossCurrencyMatchedSchema
>;

export type DealPaidInput = z.infer<typeof dealPaidSchema>;
export type DealOverdueInput = z.infer<typeof dealOverdueSchema>;
export type DealScheduledInput = z.infer<typeof dealScheduledSchema>;
export type DealSentInput = z.infer<typeof dealSentSchema>;
export type DealReminderSentInput = z.infer<
  typeof dealReminderSentSchema
>;
export type DealCancelledInput = z.infer<typeof dealCancelledSchema>;
export type DealCreatedInput = z.infer<typeof dealCreatedSchema>;
export type DealRefundedInput = z.infer<typeof dealRefundedSchema>;
export type RecurringSeriesCompletedInput = z.infer<
  typeof recurringSeriesCompletedSchema
>;
export type RecurringSeriesStartedInput = z.infer<
  typeof recurringSeriesStartedSchema
>;
export type RecurringSeriesPausedInput = z.infer<
  typeof recurringSeriesPausedSchema
>;
export type UpcomingDealItem = z.infer<typeof upcomingDealItemSchema>;
export type RecurringDealUpcomingInput = z.infer<
  typeof recurringDealUpcomingSchema
>;
export type TransactionsCategorizedInput = z.infer<
  typeof transactionsCategorizedSchema
>;
export type TransactionsAssignedInput = z.infer<
  typeof transactionsAssignedSchema
>;

// Notification types map - all available notification types with their data structures
export type NotificationTypes = {
  transactions_created: TransactionsCreatedInput;
  transactions_exported: TransactionsExportedInput;
  transactions_categorized: TransactionsCategorizedInput;
  transactions_assigned: TransactionsAssignedInput;
  document_uploaded: DocumentUploadedInput;
  document_processed: DocumentProcessedInput;
  inbox_new: InboxNewInput;
  inbox_auto_matched: InboxAutoMatchedInput;
  inbox_needs_review: InboxNeedsReviewInput;
  inbox_cross_currency_matched: InboxCrossCurrencyMatchedInput;
  deal_paid: DealPaidInput;
  deal_overdue: DealOverdueInput;
  deal_scheduled: DealScheduledInput;
  deal_sent: DealSentInput;
  deal_reminder_sent: DealReminderSentInput;
  deal_cancelled: DealCancelledInput;
  deal_created: DealCreatedInput;
  deal_refunded: DealRefundedInput;
  recurring_series_completed: RecurringSeriesCompletedInput;
  recurring_series_started: RecurringSeriesStartedInput;
  recurring_series_paused: RecurringSeriesPausedInput;
  recurring_deal_upcoming: RecurringDealUpcomingInput;
};
