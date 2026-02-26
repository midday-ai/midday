import { z } from "@hono/zod-openapi";

export const generateDisclosureSchema = z.object({
  dealId: z.string().uuid(),
  /** Override merchant's state for disclosure generation */
  stateOverride: z.string().length(2).toUpperCase().optional(),
});

export const previewDisclosureSchema = z.object({
  dealId: z.string().uuid(),
  stateOverride: z.string().length(2).toUpperCase().optional(),
});

export const getDisclosureByIdSchema = z.object({
  id: z.string().uuid(),
});

export const getDisclosuresByDealSchema = z.object({
  dealId: z.string().uuid(),
});

export const listDisclosuresSchema = z.object({
  cursor: z.string().nullish(),
  pageSize: z.number().min(1).max(100).optional(),
  status: z.string().optional(),
  stateCode: z.string().length(2).toUpperCase().optional(),
});

export const acknowledgeDisclosureSchema = z.object({
  id: z.string().uuid(),
  acknowledgedBy: z.string().min(1),
  signatureData: z.any().optional(),
});

export const createDealFeeSchema = z.object({
  dealId: z.string().uuid(),
  feeType: z.enum([
    "origination",
    "processing",
    "underwriting",
    "broker",
    "other",
  ]),
  feeName: z.string().min(1),
  amount: z.number().nonnegative(),
  percentage: z.number().min(0).max(100).optional(),
});

export const getDealFeesSchema = z.object({
  dealId: z.string().uuid(),
});

export const deleteDealFeeSchema = z.object({
  id: z.string().uuid(),
});
