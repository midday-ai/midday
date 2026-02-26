import { z } from "zod";

export const generateDisclosurePayloadSchema = z.object({
  disclosureId: z.string().uuid(),
  dealId: z.string().uuid(),
  teamId: z.string().uuid(),
  stateCode: z.string().length(2),
});

export type GenerateDisclosurePayload = z.infer<
  typeof generateDisclosurePayloadSchema
>;
