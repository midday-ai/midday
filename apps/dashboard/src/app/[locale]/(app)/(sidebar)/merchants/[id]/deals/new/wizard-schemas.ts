import { z } from "zod/v3";

export const merchantStepSchema = z.object({
  merchantId: z.string().uuid("Select a merchant"),
  merchantName: z.string().min(1),
  brokerId: z.string().uuid().optional(),
  commissionPercentage: z.coerce.number().min(0).max(100).optional(),
});

export const bankAccountStepSchema = z.discriminatedUnion("mode", [
  z.object({
    mode: z.literal("existing"),
    existingBankAccountId: z.string().uuid("Select an account"),
    existingBankAccountName: z.string().optional(),
  }),
  z.object({
    mode: z.literal("new"),
    bankName: z.string().min(1, "Bank name is required"),
    routingNumber: z.string().min(1, "Routing number is required"),
    accountNumber: z.string().min(1, "Account number is required"),
    accountType: z.enum(["checking", "savings"]).default("checking"),
  }),
  z.object({
    mode: z.literal("skip"),
  }),
]);

export const dealTermsStepSchema = z.object({
  // Core Terms
  dealCode: z.string().min(1, "Deal code is required"),
  fundingAmount: z.coerce.number().positive("Must be positive"),
  factorRate: z.coerce.number().positive("Must be positive"),
  paybackAmount: z.coerce.number().positive("Must be positive"),
  dailyPayment: z.coerce.number().positive("Must be positive").optional(),
  paymentFrequency: z
    .enum(["daily", "weekly", "bi_weekly", "monthly", "variable"])
    .default("daily"),

  // Contract Dates
  fundedAt: z.string().optional(),
  startDate: z.string().optional(),
  firstPaymentDate: z.string().optional(),
  maturityDate: z.string().optional(),
  expectedPayoffDate: z.string().optional(),
  holdbackPercentage: z.coerce.number().min(0).max(100).optional(),

  // Legal Terms
  uccFilingStatus: z.enum(["filed", "pending", "not_filed"]).optional(),
  personalGuarantee: z.boolean().optional(),
  defaultTerms: z.string().optional(),
  curePeriodDays: z.coerce.number().int().positive().optional(),
});

export type MerchantStepData = z.infer<typeof merchantStepSchema>;
export type BankAccountStepData = z.infer<typeof bankAccountStepSchema>;
export type DealTermsStepData = z.infer<typeof dealTermsStepSchema>;
