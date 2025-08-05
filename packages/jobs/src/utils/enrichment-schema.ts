import { z } from "zod";

// Transaction categories that the LLM can assign
export const transactionCategories = [
  "travel",
  "office_supplies",
  "meals",
  "software",
  "rent",
  "equipment",
  "internet_and_telephone",
  "facilities_expenses",
  "activity",
  "taxes",
  "fees",
] as const;

// Structured output schema for LLM response
export const enrichmentSchema = z.object({
  results: z.array(
    z.object({
      index: z.number(),
      merchant: z.string(),
      category: z.enum(transactionCategories),
    }),
  ),
});

// Types
export type TransactionData = {
  index: number;
  description: string;
  amount: string;
  currency: string;
};

export type EnrichmentResult = z.infer<typeof enrichmentSchema>;

export type UpdateData = {
  merchantName?: string;
  categorySlug?: string;
};
