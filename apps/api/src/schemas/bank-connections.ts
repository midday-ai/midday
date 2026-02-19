import { z } from "@hono/zod-openapi";

export const getBankConnectionsSchema = z
  .object({ enabled: z.boolean().optional() })
  .optional();

export const createBankConnectionSchema = z.object({
  accessToken: z.string().nullable().optional(), // Teller
  enrollmentId: z.string().nullable().optional(), // Teller
  referenceId: z.string().nullable().optional(), // GoCardLess
  provider: z.enum(["gocardless", "teller", "plaid", "enablebanking"]),
  accounts: z.array(
    z.object({
      accountId: z.string(),
      institutionId: z.string(),
      logoUrl: z.string().nullable().optional(),
      name: z.string(),
      bankName: z.string(),
      currency: z.string(),
      enabled: z.boolean(),
      balance: z.number().optional(),
      type: z.enum([
        "credit",
        "depository",
        "other_asset",
        "loan",
        "other_liability",
      ]),
      accountReference: z.string().nullable().optional(), // EnableBanking & GoCardLess
      expiresAt: z.string().nullable().optional(), // EnableBanking & GoCardLess
      // Additional account data for reconnect matching and user display
      iban: z.string().nullable().optional(),
      subtype: z.string().nullable().optional(),
      bic: z.string().nullable().optional(),
      // US bank account details (Teller, Plaid)
      routingNumber: z.string().nullable().optional(),
      wireRoutingNumber: z.string().nullable().optional(),
      accountNumber: z.string().nullable().optional(),
      sortCode: z.string().nullable().optional(),
      // Credit account balances
      availableBalance: z.number().nullable().optional(),
      creditLimit: z.number().nullable().optional(),
    }),
  ),
});

export const deleteBankConnectionSchema = z.object({ id: z.string() });

export const addProviderAccountsSchema = z.object({
  connectionId: z.string().uuid(),
  accounts: z.array(
    z.object({
      accountId: z.string(),
      name: z.string(),
      currency: z.string(),
      type: z.enum([
        "credit",
        "depository",
        "other_asset",
        "loan",
        "other_liability",
      ]),
      accountReference: z.string().nullable().optional(),
      balance: z.number().optional(),
      iban: z.string().nullable().optional(),
      subtype: z.string().nullable().optional(),
      bic: z.string().nullable().optional(),
      routingNumber: z.string().nullable().optional(),
      wireRoutingNumber: z.string().nullable().optional(),
      accountNumber: z.string().nullable().optional(),
      sortCode: z.string().nullable().optional(),
      availableBalance: z.number().nullable().optional(),
      creditLimit: z.number().nullable().optional(),
    }),
  ),
});

export const reconnectBankConnectionSchema = z.object({
  referenceId: z.string(),
  newReferenceId: z.string(),
  expiresAt: z.string(),
});
