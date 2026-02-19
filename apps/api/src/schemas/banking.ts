import { z } from "zod";

export const providerSchema = z.enum([
  "gocardless",
  "teller",
  "plaid",
  "enablebanking",
]);

export const accountTypeSchema = z.enum([
  "depository",
  "credit",
  "other_asset",
  "loan",
  "other_liability",
]);

// Auth schemas
export const plaidLinkSchema = z
  .object({
    language: z.string().optional(),
    accessToken: z.string().optional(),
  })
  .optional();

export const plaidExchangeSchema = z.object({
  token: z.string(),
});

export const gocardlessLinkSchema = z.object({
  institutionId: z.string(),
  agreement: z.string(),
  redirect: z.string(),
  reference: z.string().optional(),
});

export const gocardlessAgreementSchema = z.object({
  institutionId: z.string(),
  transactionTotalDays: z.number(),
});

export const enablebankingLinkSchema = z.object({
  institutionId: z.string(),
  state: z.string(),
  countryCode: z.string().optional(),
});

export const enablebankingExchangeSchema = z.object({
  code: z.string(),
});

// Connection schemas
export const connectionStatusSchema = z.object({
  id: z.string().optional(),
  provider: providerSchema,
  accessToken: z.string().optional(),
});

export const deleteConnectionSchema = z.object({
  id: z.string(),
  provider: providerSchema,
  accessToken: z.string().optional(),
});

export const connectionByReferenceSchema = z.object({
  reference: z.string(),
});

// Account schemas
export const getProviderAccountsSchema = z.object({
  provider: providerSchema,
  accessToken: z.string().optional(),
  institutionId: z.string().optional(),
  id: z.string().optional(),
});

export const getBalanceSchema = z.object({
  provider: providerSchema,
  accessToken: z.string().optional(),
  id: z.string(),
  accountType: accountTypeSchema.optional(),
});

// Transaction schemas
export const getProviderTransactionsSchema = z.object({
  provider: providerSchema,
  accountId: z.string(),
  accountType: accountTypeSchema,
  latest: z.boolean().optional(),
  accessToken: z.string().optional(),
});
