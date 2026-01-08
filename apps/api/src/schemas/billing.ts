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
});

export type CreateCheckoutSchema = z.infer<typeof createCheckoutSchema>;

export const checkoutResponseSchema = z.object({
  url: z.string(),
});

export type CheckoutResponseSchema = z.infer<typeof checkoutResponseSchema>;
