import { z } from "@hono/zod-openapi";

export const getSyndicatorsSchema = z.object({
  q: z.string().nullable().optional(),
  sort: z.array(z.string().min(1)).max(2).min(2).nullable().optional(),
  cursor: z.string().optional(),
  pageSize: z.coerce.number().min(1).max(100).optional(),
});

export const getSyndicatorByIdSchema = z.object({
  id: z.string().uuid(),
});

export const upsertSyndicatorSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1),
  email: z.string().email().nullable().optional(),
  phone: z.string().nullable().optional(),
  companyName: z.string().nullable().optional(),
  website: z.string().nullable().optional(),
  addressLine1: z.string().nullable().optional(),
  addressLine2: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  state: z.string().nullable().optional(),
  zip: z.string().nullable().optional(),
  country: z.string().nullable().optional(),
  status: z.enum(["active", "inactive"]).optional(),
  note: z.string().nullable().optional(),
  externalId: z.string().nullable().optional(),
});

export const deleteSyndicatorSchema = z.object({
  id: z.string().uuid(),
});

export const toggleSyndicatorPortalSchema = z.object({
  syndicatorId: z.string().uuid(),
  enabled: z.boolean(),
});

export const getSyndicatorByPortalIdSchema = z.object({
  portalId: z.string(),
});

export const getSyndicatorDealsSchema = z.object({
  syndicatorId: z.string().uuid(),
});

export const getSyndicatorDealStatsSchema = z.object({
  syndicatorId: z.string().uuid(),
});

export const getParticipantsByDealSchema = z.object({
  dealId: z.string().uuid(),
});

export const upsertParticipantSchema = z.object({
  id: z.string().uuid().optional(),
  dealId: z.string().uuid(),
  syndicatorId: z.string().uuid(),
  fundingShare: z.number().min(0),
  ownershipPercentage: z.number().min(0).max(1),
  status: z.enum(["active", "bought_out", "defaulted"]).optional(),
  note: z.string().nullable().optional(),
});

export const removeParticipantSchema = z.object({
  id: z.string().uuid(),
});

// ============================================================================
// Syndicator Transaction Schemas
// ============================================================================

export const getSyndicatorTransactionsSchema = z.object({
  syndicatorId: z.string().uuid(),
  cursor: z.string().optional(),
  pageSize: z.coerce.number().min(1).max(100).optional(),
  transactionType: z
    .enum([
      "contribution",
      "withdrawal",
      "profit_distribution",
      "refund",
      "fee",
      "chargeback",
      "transfer",
      "deal_allocation",
    ])
    .nullable()
    .optional(),
  dealId: z.string().uuid().nullable().optional(),
  status: z.string().nullable().optional(),
  dateFrom: z.string().nullable().optional(),
  dateTo: z.string().nullable().optional(),
});

export const getSyndicatorBalanceSchema = z.object({
  syndicatorId: z.string().uuid(),
});

export const createSyndicatorTransactionSchema = z.object({
  syndicatorId: z.string().uuid(),
  date: z.string(),
  transactionType: z.enum([
    "contribution",
    "withdrawal",
    "profit_distribution",
    "refund",
    "fee",
    "chargeback",
    "transfer",
    "deal_allocation",
  ]),
  method: z
    .enum(["ach", "wire", "check", "zelle", "other"])
    .nullable()
    .optional(),
  amount: z.number().positive(),
  currency: z.string().optional(),
  description: z.string().nullable().optional(),
  note: z.string().nullable().optional(),
  dealId: z.string().uuid().nullable().optional(),
  participationId: z.string().uuid().nullable().optional(),
  counterpartySyndicatorId: z.string().uuid().nullable().optional(),
  status: z
    .enum(["pending", "completed", "failed", "reversed"])
    .optional(),
  linkedTransactionId: z.string().uuid().nullable().optional(),
  reference: z.string().nullable().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const getPortalTransactionsSchema = z.object({
  portalId: z.string(),
  cursor: z.string().optional(),
  pageSize: z.coerce.number().min(1).max(100).optional(),
});

// ============================================================================
// Team-Wide Syndicator Transaction Schemas (for Transactions page tab)
// ============================================================================

export const getTeamSyndicatorTransactionsSchema = z.object({
  cursor: z.string().optional(),
  pageSize: z.coerce.number().min(1).max(100).optional(),
  transactionType: z
    .enum([
      "contribution",
      "withdrawal",
      "profit_distribution",
      "refund",
      "fee",
      "chargeback",
      "transfer",
      "deal_allocation",
    ])
    .nullable()
    .optional(),
  syndicatorId: z.string().uuid().nullable().optional(),
  dealId: z.string().uuid().nullable().optional(),
  status: z.string().nullable().optional(),
  dateFrom: z.string().nullable().optional(),
  dateTo: z.string().nullable().optional(),
  q: z.string().nullable().optional(),
});
