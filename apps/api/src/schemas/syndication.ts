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
