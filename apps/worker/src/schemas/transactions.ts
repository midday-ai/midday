import { z } from "zod";

/**
 * Transaction job schemas (independent from @midday/jobs)
 */

export const exportTransactionsSchema = z.object({
  teamId: z.string().uuid(),
  userId: z.string().uuid(),
  locale: z.string(),
  dateFormat: z.string().nullable().optional(),
  transactionIds: z.array(z.string().uuid()),
  exportSettings: z
    .object({
      csvDelimiter: z.string(),
      includeCSV: z.boolean(),
      includeXLSX: z.boolean(),
      sendEmail: z.boolean(),
      accountantEmail: z.string().optional(),
    })
    .optional(),
});

export type ExportTransactionsPayload = z.infer<
  typeof exportTransactionsSchema
>;

export const processExportSchema = z.object({
  ids: z.array(z.string().uuid()),
  teamId: z.string().uuid(),
  locale: z.string(),
  dateFormat: z.string().nullable().optional(),
});

export type ProcessExportPayload = z.infer<typeof processExportSchema>;

export const processTransactionAttachmentSchema = z.object({
  transactionId: z.string().uuid(),
  mimetype: z.string(),
  filePath: z.array(z.string()),
  teamId: z.string().uuid(),
});

export type ProcessTransactionAttachmentPayload = z.infer<
  typeof processTransactionAttachmentSchema
>;

export const embedTransactionSchema = z.object({
  transactionIds: z.array(z.string().uuid()),
  teamId: z.string().uuid(),
});

export type EmbedTransactionPayload = z.infer<typeof embedTransactionSchema>;

export const enrichTransactionsSchema = z.object({
  transactionIds: z.array(z.string().uuid()),
  teamId: z.string().uuid(),
});

export type EnrichTransactionsPayload = z.infer<
  typeof enrichTransactionsSchema
>;

export const importTransactionsSchema = z.object({
  inverted: z.boolean(),
  filePath: z.array(z.string()).optional(),
  bankAccountId: z.string(),
  currency: z.string(),
  teamId: z.string(),
  table: z.array(z.record(z.string(), z.string())).optional(),
  mappings: z.object({
    amount: z.string(),
    date: z.string(),
    description: z.string(),
    balance: z.string().optional(),
  }),
});

export type ImportTransactionsPayload = z.infer<
  typeof importTransactionsSchema
>;

export const updateBaseCurrencySchema = z.object({
  teamId: z.string().uuid(),
  baseCurrency: z.string(),
});

export type UpdateBaseCurrencyPayload = z.infer<
  typeof updateBaseCurrencySchema
>;

export const updateAccountBaseCurrencySchema = z.object({
  accountId: z.string().uuid(),
  currency: z.string(),
  balance: z.number(),
  baseCurrency: z.string(),
});

export type UpdateAccountBaseCurrencyPayload = z.infer<
  typeof updateAccountBaseCurrencySchema
>;
