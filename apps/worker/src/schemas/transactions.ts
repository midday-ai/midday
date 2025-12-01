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
  locale: z.string(),
  dateFormat: z.string().nullable().optional(),
});

export type ProcessExportPayload = z.infer<typeof processExportSchema>;
