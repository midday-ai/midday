import { z } from "zod";

// Transaction categories that the LLM can assign
export const transactionCategories = [
  "travel",
  "office-supplies",
  "meals",
  "software",
  "rent",
  "equipment",
  "internet-and-telephone",
  "facilities-expenses",
  "activity",
  "fees",
  "transfer",
] as const;

// Structured output schema for LLM response (for use with output: "array")
export const enrichmentSchema = z.object({
  merchant: z
    .string()
    .nullable()
    .describe("The formal legal business entity name"),
  category: z
    .enum(transactionCategories)
    .describe("The category of the transaction"),
});

// Types
export type TransactionData = {
  description: string;
  amount: string;
  currency: string;
};

export type EnrichmentResult = z.infer<typeof enrichmentSchema>;

export type UpdateData = {
  merchantName?: string;
  categorySlug?: string;
};
