import { z } from "zod";

export const getBillingOrdersSchema = z.object({
  cursor: z.string().optional(),
  pageSize: z.number().min(1).max(100).default(25),
});

export type GetBillingOrdersSchema = z.infer<typeof getBillingOrdersSchema>;

export const createCheckoutSchema = z.object({
  plan: z.enum(["starter", "pro"]),
  planType: z.string().optional(),
  embedOrigin: z.string(),
  currency: z.enum(["USD", "EUR"]).optional(),
});

export type CreateCheckoutSchema = z.infer<typeof createCheckoutSchema>;

export const checkoutResponseSchema = z.object({
  url: z.string(),
});

export type CheckoutResponseSchema = z.infer<typeof checkoutResponseSchema>;

export const cancelSubscriptionSchema = z.object({
  reason: z.enum([
    "too_expensive",
    "missing_features",
    "unused",
    "switched_service",
    "other",
  ]),
  comment: z.string().optional(),
});

export type CancelSubscriptionSchema = z.infer<typeof cancelSubscriptionSchema>;
