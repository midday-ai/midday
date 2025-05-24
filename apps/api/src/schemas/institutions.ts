import { z } from "zod";

export const getInstitutionsSchema = z.object({
  q: z.string().optional(),
  countryCode: z.string(),
});

export const getAccountsSchema = z.object({
  id: z.string().optional(), // EnableBanking & GoCardLess
  accessToken: z.string().optional(),
  institutionId: z.string().optional(), // Plaid
  provider: z.enum(["gocardless", "teller", "plaid", "enablebanking"]),
});

export const updateUsageSchema = z.object({ id: z.string() });
