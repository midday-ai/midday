import { z } from "@hono/zod-openapi";

export const getBrokersSchema = z.object({
  q: z.string().nullable().optional(),
  sort: z.array(z.string().min(1)).max(2).min(2).nullable().optional(),
  cursor: z.string().optional(),
  pageSize: z.coerce.number().min(1).max(100).optional(),
});

export const getBrokerByIdSchema = z.object({
  id: z.string().uuid(),
});

export const upsertBrokerSchema = z.object({
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
  commissionPercentage: z.number().min(0).max(100).nullable().optional(),
  status: z.enum(["active", "inactive"]).optional(),
  note: z.string().nullable().optional(),
  externalId: z.string().nullable().optional(),
});

export const deleteBrokerSchema = z.object({
  id: z.string().uuid(),
});

export const toggleBrokerPortalSchema = z.object({
  brokerId: z.string().uuid(),
  enabled: z.boolean(),
});

export const getBrokerByPortalIdSchema = z.object({
  portalId: z.string(),
});

export const getBrokerDealsSchema = z.object({
  brokerId: z.string().uuid(),
});

export const getBrokerDealStatsSchema = z.object({
  brokerId: z.string().uuid(),
});

export const getCommissionsByBrokerSchema = z.object({
  brokerId: z.string().uuid(),
});

export const getCommissionsByDealSchema = z.object({
  dealId: z.string().uuid(),
});

export const updateCommissionSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["pending", "paid", "cancelled"]).optional(),
  commissionPercentage: z.coerce.number().min(0).max(100).optional(),
  commissionAmount: z.coerce.number().min(0).optional(),
  note: z.string().nullable().optional(),
});
