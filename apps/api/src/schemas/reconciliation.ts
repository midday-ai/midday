import { z } from "zod";

export const matchStatusValues = [
  "unmatched",
  "auto_matched",
  "suggested",
  "manual_matched",
  "flagged",
  "excluded",
] as const;

export const discrepancyTypeValues = [
  "nsf",
  "partial_payment",
  "overpayment",
  "unrecognized",
  "bank_fee",
  "duplicate",
  "split_payment",
] as const;

export const getPaymentFeedSchema = z.object({
  matchStatus: z.array(z.enum(matchStatusValues)).optional(),
  start: z.string().optional(),
  end: z.string().optional(),
  bankAccountId: z.string().uuid().optional(),
  dealId: z.string().uuid().optional(),
  q: z.string().optional(),
  amountMin: z.number().optional(),
  amountMax: z.number().optional(),
  sort: z.array(z.string()).optional(),
  cursor: z.string().nullish(),
});

export const getReconciliationViewSchema = z.object({
  start: z.string(),
  end: z.string(),
  bankAccountId: z.string().uuid().optional(),
});

export const getDiscrepanciesSchema = z.object({
  discrepancyType: z.array(z.enum(discrepancyTypeValues)).optional(),
  start: z.string().optional(),
  end: z.string().optional(),
  cursor: z.string().nullish(),
});

export const getStatsSchema = z.object({
  start: z.string().optional(),
  end: z.string().optional(),
  bankAccountId: z.string().uuid().optional(),
});

export const confirmMatchSchema = z.object({
  transactionId: z.string().uuid(),
});

export const rejectMatchSchema = z.object({
  transactionId: z.string().uuid(),
});

export const manualMatchSchema = z.object({
  transactionId: z.string().uuid(),
  dealId: z.string().uuid(),
  paymentId: z.string().uuid().optional(),
  note: z.string().optional(),
});

export const flagDiscrepancySchema = z.object({
  transactionId: z.string().uuid(),
  discrepancyType: z.enum(discrepancyTypeValues),
  note: z.string().optional(),
});

export const resolveDiscrepancySchema = z.object({
  transactionId: z.string().uuid(),
  resolution: z.enum(["excluded", "manual_matched"]),
  dealId: z.string().uuid().optional(),
  note: z.string().optional(),
});

export const bulkConfirmMatchesSchema = z.object({
  transactionIds: z.array(z.string().uuid()).optional(),
  start: z.string().optional(),
  end: z.string().optional(),
});

export const startSessionSchema = z.object({
  bankAccountId: z.string().uuid().optional(),
  dateFrom: z.string(),
  dateTo: z.string(),
});

export const completeSessionSchema = z.object({
  sessionId: z.string().uuid(),
  stats: z.object({
    totalTransactions: z.number(),
    autoMatched: z.number(),
    manuallyMatched: z.number(),
    flagged: z.number(),
    unmatched: z.number(),
  }),
});

export const triggerReMatchSchema = z.object({
  transactionIds: z.array(z.string().uuid()),
});
