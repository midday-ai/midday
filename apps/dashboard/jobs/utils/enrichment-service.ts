import { type OpenAIProvider, createOpenAI } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";

type Transaction = {
  id: string;
  name: string;
};

type EnrichedTransaction = {
  id: string;
  category_slug: string | null;
};

export class EnrichmentService {
  model: OpenAIProvider;

  constructor() {
    this.model = createOpenAI({
      baseURL: process.env.AI_GATEWAY_ENDPOINT,
      apiKey: process.env.AI_GATEWAY_API_KEY,
    });
  }

  async enrichTransactions(
    transactions: Transaction[],
  ): Promise<EnrichedTransaction[]> {
    const { object } = await generateObject({
      model: this.model.chat(process.env.AI_GATEWAY_MODEL!),
      prompt: `You are an expert in categorizing financial transactions for business expense tracking.
            Analyze the transaction details and determine the most appropriate category.

            Here are the categories and their descriptions:
            - travel: Business travel expenses including flights, hotels, car rentals, and other transportation costs
            - office_supplies: Office materials like paper, pens, printer supplies, and basic office equipment
            - meals: Business meals, client dinners, team lunches, and catering expenses
            - software: Software licenses, subscriptions, cloud services, and digital tools
            - rent: Office space rental, coworking memberships, and real estate related costs
            - equipment: Major hardware purchases, computers, machinery, and durable business equipment
            - internet_and_telephone: Internet service, phone plans, mobile devices, and communication expenses
            - facilities_expenses: Utilities, maintenance, cleaning, and other building operation costs
            - activity: Team building events, conferences, training, and professional development
            - taxes: Business tax payments, property taxes, and other tax-related expenses
            - fees: Bank fees, service charges, professional fees, and administrative costs
            
            Transactions: ${JSON.stringify(transactions)}
            
            Important: Return the transactions array in the exact same order as provided.`,
      temperature: 1,
      mode: "json",
      schema: z.object({
        transactions: z.array(
          z.object({
            category: z
              .enum([
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
              ])
              .describe("The most appropriate category for the transaction"),
          }),
        ),
      }),
    });

    return transactions.map((transaction, idx) => ({
      id: transaction.id,
      category_slug: object.transactions[idx]?.category ?? null,
      name: transaction.name,
    }));
  }

  async batchEnrichTransactions(
    transactions: Transaction[],
  ): Promise<EnrichedTransaction[]> {
    const MAX_TOKENS_PER_BATCH = 4000;
    const ESTIMATED_TOKENS_PER_TRANSACTION = 40;

    const batchSize = Math.max(
      1,
      Math.floor(MAX_TOKENS_PER_BATCH / ESTIMATED_TOKENS_PER_TRANSACTION),
    );

    const enrichedTransactions: EnrichedTransaction[] = [];

    // Process in batches to avoid token limits
    for (let i = 0; i < transactions.length; i += batchSize) {
      const batch = transactions.slice(i, i + batchSize);
      const batchResults = await this.enrichTransactions(batch);

      // Add the batch results to our collection
      enrichedTransactions.push(...batchResults);
    }

    return enrichedTransactions;
  }
}
