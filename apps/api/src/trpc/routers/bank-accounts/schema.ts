import { z } from "zod";

export const getBankAccountsSchema = z
  .object({
    enabled: z.boolean().optional(),
    manual: z.boolean().optional(),
  })
  .optional();

export const deleteBankAccountSchema = z.object({ id: z.string() });

export const updateBankAccountSchema = z.object({
  id: z.string().uuid(),
  name: z.string().optional(),
  enabled: z.boolean().optional(),
  balance: z.number().optional(),
  type: z
    .enum(["depository", "credit", "other_asset", "loan", "other_liability"])
    .optional(),
});

export const createBankAccountSchema = z.object({
  name: z.string(),
  currency: z.string().optional(),
  manual: z.boolean().optional(),
});
