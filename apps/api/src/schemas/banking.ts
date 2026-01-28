import { z } from "@hono/zod-openapi";

const providerEnum = z.enum(["gocardless", "plaid", "teller", "enablebanking"]);

const accountTypeEnum = z.enum([
  "depository",
  "credit",
  "other_asset",
  "loan",
  "other_liability",
]);

// Plaid
export const createPlaidLinkSchema = z.object({
  userId: z.string().optional(),
  accessToken: z.string().optional(),
  language: z.string().optional(),
  environment: z.enum(["sandbox", "production"]).optional(),
});

export const exchangePlaidTokenSchema = z.object({
  publicToken: z.string(),
});

// GoCardless
export const createGoCardlessAgreementSchema = z.object({
  institutionId: z.string(),
  transactionTotalDays: z.number(),
});

export const createGoCardlessLinkSchema = z.object({
  institutionId: z.string(),
  agreement: z.string(),
  redirect: z.string(),
  reference: z.string().optional(),
});

// EnableBanking
export const createEnableBankingLinkSchema = z.object({
  country: z.string(),
  institutionId: z.string(),
  teamId: z.string(),
  validUntil: z.string(),
  state: z.string(),
  type: z.enum(["personal", "business"]),
});

export const exchangeEnableBankingCodeSchema = z.object({
  code: z.string(),
});

// Accounts
export const getAccountsSchema = z.object({
  provider: providerEnum,
  id: z.string().optional(),
  accessToken: z.string().optional(),
  institutionId: z.string().optional(),
});

export const getAccountBalanceSchema = z.object({
  provider: providerEnum,
  accountId: z.string(),
  accessToken: z.string().optional(),
  accountType: z.string().optional(),
});

export const deleteAccountsSchema = z.object({
  provider: providerEnum,
  accountId: z.string().optional(),
  accessToken: z.string().optional(),
});

// Connections
export const getConnectionStatusSchema = z.object({
  provider: providerEnum,
  id: z.string().optional(),
  accessToken: z.string().optional(),
});

export const getConnectionByReferenceSchema = z.object({
  reference: z.string(),
});

export const deleteConnectionSchema = z.object({
  provider: providerEnum,
  id: z.string(),
  accessToken: z.string().optional(),
});

// Transactions
export const getTransactionsSchema = z.object({
  provider: providerEnum,
  accountId: z.string(),
  accessToken: z.string().optional(),
  latest: z.boolean().optional(),
  accountType: accountTypeEnum,
});
