import { z } from "zod";

export const getRevenueSchema = z.object({
  from: z.string(),
  to: z.string(),
  currency: z.string().optional(),
});

export const getProfitSchema = z.object({
  from: z.string(),
  to: z.string(),
  currency: z.string().optional(),
});

export const getBurnRateSchema = z.object({
  from: z.string(),
  to: z.string(),
  currency: z.string().optional(),
});

export const getRunwaySchema = z.object({
  from: z.string(),
  to: z.string(),
  currency: z.string().optional(),
});

export const getExpensesSchema = z.object({
  from: z.string(),
  to: z.string(),
  currency: z.string().optional(),
});

export const getSpendingSchema = z.object({
  from: z.string(),
  to: z.string(),
  currency: z.string().optional(),
});
