import { z } from "zod";

import { Err, Ok, SchemaError, type Result } from "@internal/error";

export const billingTier = z.object({
  firstUnit: z.number().int().min(1),
  lastUnit: z.number().int().min(1).nullable(),
  /**
   * in cents, e.g. "10.124" = $0.10124
   * set null, to make it free
   */
  centsPerUnit: z
    .string()
    .regex(/^\d{1,15}(\.\d{1,12})?$/)
    .nullable(),
});

export type BillingTier = z.infer<typeof billingTier>;

type TieredPrice = {
  tiers: (BillingTier & { quantity: number })[];

  /**
   * Here be dragons.
   *
   * DO NOT USE FOR BILLING
   *
   * We're doing floating point operatiuons here, so the result is likely not exact.
   * Use this only for displaying estimates to the user.
   */
  totalCentsEstimate: number;
};
/**
 * calculateTieredPrice calculates the price for a given number of units, based on a tiered pricing model.
 *
 */
export function calculateTieredPrices(
  rawTiers: BillingTier[],
  units: number,
): Result<TieredPrice, SchemaError> {
  /**
   * Validation logic:
   */
  const parsedTiers = billingTier.array().min(1).safeParse(rawTiers);
  if (!parsedTiers.success) {
    return Err(SchemaError.fromZod(parsedTiers.error, rawTiers));
  }
  const tiers = parsedTiers.data;

  for (let i = 0; i < tiers.length; i++) {
    if (i > 0) {
      const currentFirstUnit = tiers[i].firstUnit;
      const previousLastUnit = tiers[i - 1].lastUnit;
      if (previousLastUnit === null) {
        return Err(
          new SchemaError({
            message: "Every tier except the last one must have a lastUnit",
          }),
        );
      }
      if (currentFirstUnit > previousLastUnit + 1) {
        return Err(
          new SchemaError({ message: "There is a gap between tiers" }),
        );
      }
      if (currentFirstUnit < previousLastUnit + 1) {
        return Err(
          new SchemaError({ message: "There is an overlap between tiers" }),
        );
      }
    }
  }

  /**
  Calculation logic:
  */
  let remaining = units; // make a copy, so we don't mutate the original
  const res: TieredPrice = { tiers: [], totalCentsEstimate: 0 };
  for (const tier of tiers) {
    if (units <= 0) {
      break;
    }

    const quantity =
      tier.lastUnit === null
        ? remaining
        : Math.min(tier.lastUnit - tier.firstUnit + 1, remaining);
    remaining -= quantity;
    res.tiers.push({ quantity, ...tier });
    if (tier.centsPerUnit) {
      res.totalCentsEstimate += quantity * Number.parseFloat(tier.centsPerUnit);
    }
  }

  return Ok(res);
}
