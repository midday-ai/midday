import { z } from "zod";

import { billingTier } from "./tiers";

const fixedSubscriptionSchema = z.object({
  productId: z.string(),
  cents: z.string().regex(/^\d{1,15}(\.\d{1,12})?$/), // in cents, e.g. "10.124" = $0.10124
});
export type FixedSubscription = z.infer<typeof fixedSubscriptionSchema>;

const tieredSubscriptionSchema = z.object({
  productId: z.string(),
  tiers: z.array(billingTier),
});

export type TieredSubscription = z.infer<typeof tieredSubscriptionSchema>;

export const subscriptionsSchema = z.object({
  verifications: tieredSubscriptionSchema.optional(),
  ratelimits: tieredSubscriptionSchema.optional(),
  plan: fixedSubscriptionSchema.optional(),
  support: fixedSubscriptionSchema.optional(),
});

export type Subscriptions = z.infer<typeof subscriptionsSchema>;

export function defaultProSubscriptions(): Subscriptions | null {
  const stripeEnv = z.object({
    STRIPE_PRODUCT_ID_PRO_PLAN: z.string(),
    STRIPE_PRODUCT_ID_KEY_VERIFICATIONS: z.string(),
    STRIPE_PRODUCT_ID_RATELIMITS: z.string(),
    STRIPE_PRODUCT_ID_SUPPORT: z.string(),
  });
  const env = stripeEnv.parse(process.env);
  if (!env) {
    return null;
  }
  return {
    plan: {
      productId: env.STRIPE_PRODUCT_ID_PRO_PLAN,
      cents: "2500", // $25
    },
    verifications: {
      productId: env.STRIPE_PRODUCT_ID_KEY_VERIFICATIONS,
      tiers: [
        {
          firstUnit: 1,
          lastUnit: 150_000,
          centsPerUnit: null,
        },
        {
          firstUnit: 150_001,
          lastUnit: null,
          centsPerUnit: "0.01", // $0.0001 per verification or  $10 per 100k verifications
        },
      ],
    },
    ratelimits: {
      productId: env.STRIPE_PRODUCT_ID_KEY_VERIFICATIONS,
      tiers: [
        {
          firstUnit: 1,
          lastUnit: 2_500_000,
          centsPerUnit: null,
        },
        {
          firstUnit: 2_500_001,
          lastUnit: null,
          centsPerUnit: "0.001", // $0.00001 per ratelimit or  $1 per 100k verifications
        },
      ],
    },
  };
}
