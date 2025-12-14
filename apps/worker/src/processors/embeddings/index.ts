import { EmbedInboxProcessor } from "../inbox/embed-inbox";

/**
 * Export embed-inbox processor (for type imports)
 */
export { EmbedInboxProcessor } from "../inbox/embed-inbox";

/**
 * Embeddings processor registry
 * Maps job names to processor instances
 *
 * These processors are intentionally on a separate queue from inbox processors
 * to prevent worker starvation when inbox processing jobs wait for embeddings.
 */
export const embeddingsProcessors = {
  "embed-inbox": new EmbedInboxProcessor(),
};
