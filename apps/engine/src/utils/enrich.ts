import { type EnrichBody, OutputSchema } from "@/routes/enrich/schema";
import { generateObject } from "ai";
import type { WorkersAI } from "workers-ai-provider";

export function generateEnrichedCacheKey(transaction: EnrichBody["data"][0]) {
  const { description } = transaction;
  return `enriched:${description.replace(/\s+/g, "_")}`.toLowerCase();
}

export async function enrichTransactionWithLLM(
  model: WorkersAI,
  transaction: EnrichBody["data"][0],
) {
  const result = await generateObject({
    mode: "json",
    // @ts-ignore
    model: model("@cf/meta/llama-3.3-70b-instruct-fp8-fast"),
    temperature: 0,
    maxTokens: 2048,
    prompt: `
            ${prompt}
  
            Transaction:
            ${JSON.stringify(transaction)}
        `,
    schema: OutputSchema,
  });

  return result.object;
}
