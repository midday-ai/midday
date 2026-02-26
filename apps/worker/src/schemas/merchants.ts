import { z } from "zod";

/**
 * Merchant job schemas
 */

export const enrichMerchantSchema = z.object({
  merchantId: z.string().uuid(),
  teamId: z.string().uuid(),
});

export type EnrichMerchantPayload = z.infer<typeof enrichMerchantSchema>;
