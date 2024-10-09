import { z } from "@hono/zod-openapi";

export const PlaidLinkBodySchema = z.object({
  userId: z.string().optional(),
  language: z.string().optional(),
  accessToken: z.string().optional(),
});

export const PlaidLinkSchema = z.object({
  data: z.any(),
});

export const PlaidExchangeBodySchema = z.object({
  token: z.string(),
});

export const PlaidExchangeSchema = z.any();

export const GoCardLessLinkBodySchema = z.object({
  institutionId: z.string(),
  agreement: z.string().nullable(),
  redirect: z.string(),
});

export const GoCardLessLinkSchema = z.object({
  data: z.any(),
});

export const GoCardLessAgreementBodySchema = z.object({
  institutionId: z.string(),
  transactionTotalDays: z.number(),
});

export const GoCardLessAgreementSchema = z.object({
  data: z.any(),
});

export const GoCardLessExchangeBodySchema = z.object({
  institutionId: z.string(),
  transactionTotalDays: z.number(),
});

export const GoCardLessExchangeSchema = z.object({
  data: z.any(),
});
