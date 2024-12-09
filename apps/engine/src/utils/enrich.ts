import type { EnrichBody } from "@/routes/enrich/schema";

export function generateEnrichedCacheKey(transaction: EnrichBody["data"][0]) {
  const { description } = transaction;
  return `enriched:${description}`.toLowerCase();
}
