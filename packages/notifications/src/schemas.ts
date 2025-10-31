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
    "invoice_paid",
    "invoice_overdue",
    "invoice_scheduled",
    "invoice_sent",
    "invoice_reminder_sent",
    "invoice_cancelled",
    "invoice_created",
    "draft_invoice_created",
    "document_uploaded",
    "document_processed",
    "invoice_duplicated",
    "tracker_entry_created",
    "tracker_project_created",
    "transactions_categorized",
    "transactions_assigned",
    "transaction_attachment_created",
    "transaction_category_created",
    "transactions_exported",
    "customer_created",
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

export const invoiceSchema = z.object({
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
  inboxType: z.enum(["email", "sync", "slack", "upload"]),
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

export const invoicePaidSchema = z.object({
  users: z.array(userSchema),
  invoiceId: z.string().uuid(),
  invoiceNumber: z.string(),
  customerName: z.string().optional(),
  paidAt: z.string().optional(),
  source: z.enum(["user", "system"]).default("system"),
});

export const invoiceOverdueSchema = z.object({
  users: z.array(userSchema),
  invoiceId: z.string().uuid(),
  invoiceNumber: z.string(),
  customerName: z.string(),
  source: z.enum(["user", "system"]).default("system"),
});

export const invoiceScheduledSchema = z.object({
  users: z.array(userSchema),
  invoiceId: z.string().uuid(),
  invoiceNumber: z.string(),
  scheduledAt: z.string(),
  customerName: z.string().optional(),
});

export const invoiceSentSchema = z.object({
  users: z.array(userSchema),
  invoiceId: z.string().uuid(),
  token: z.string(),
  invoiceNumber: z.string(),
  customerName: z.string(),
  customerEmail: z.string().email().optional(),
});

export const invoiceReminderSentSchema = z.object({
  users: z.array(userSchema),
  invoiceId: z.string().uuid(),
  token: z.string(),
  invoiceNumber: z.string(),
  customerName: z.string(),
  customerEmail: z.string().email().optional(),
});

export const invoiceCancelledSchema = z.object({
  users: z.array(userSchema),
  invoiceId: z.string().uuid(),
  invoiceNumber: z.string(),
  customerName: z.string().optional(),
});

export const invoiceCreatedSchema = z.object({
  users: z.array(userSchema),
  invoiceId: z.string().uuid(),
  invoiceNumber: z.string(),
  customerName: z.string().optional(),
  amount: z.number().optional(),
  currency: z.string().optional(),
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
export type InvoiceData = z.infer<typeof invoiceSchema>;
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

export type InvoicePaidInput = z.infer<typeof invoicePaidSchema>;
export type InvoiceOverdueInput = z.infer<typeof invoiceOverdueSchema>;
export type InvoiceScheduledInput = z.infer<typeof invoiceScheduledSchema>;
export type InvoiceSentInput = z.infer<typeof invoiceSentSchema>;
export type InvoiceReminderSentInput = z.infer<
  typeof invoiceReminderSentSchema
>;
export type InvoiceCancelledInput = z.infer<typeof invoiceCancelledSchema>;
export type InvoiceCreatedInput = z.infer<typeof invoiceCreatedSchema>;
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
  invoice_paid: InvoicePaidInput;
  invoice_overdue: InvoiceOverdueInput;
  invoice_scheduled: InvoiceScheduledInput;
  invoice_sent: InvoiceSentInput;
  invoice_reminder_sent: InvoiceReminderSentInput;
  invoice_cancelled: InvoiceCancelledInput;
  invoice_created: InvoiceCreatedInput;
};
