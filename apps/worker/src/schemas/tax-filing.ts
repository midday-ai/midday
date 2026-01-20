import { z } from "zod";

/**
 * Tax Filing Export Schema
 * 会計ソフト形式でのエクスポート用
 */

export const accountingFormatSchema = z.enum(["yayoi", "freee", "moneyforward"]);

export type AccountingFormat = z.infer<typeof accountingFormatSchema>;

export const exportTaxFilingSchema = z.object({
  teamId: z.string().uuid(),
  userId: z.string().uuid(),
  fiscalYear: z.number().min(2020).max(2030),
  format: accountingFormatSchema,
  locale: z.string().default("ja-JP"),
});

export type ExportTaxFilingPayload = z.infer<typeof exportTaxFilingSchema>;
