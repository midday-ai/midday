import { EmbedDocumentTagsProcessor } from "./embed-document-tags";
import { ProcessDocumentProcessor } from "./process-document";

export { EmbedDocumentTagsProcessor } from "./embed-document-tags";
export { ProcessDocumentProcessor } from "./process-document";

/**
 * Document processor registry
 * Maps job names to processor instances
 */
export const documentProcessors = {
  "process-document": new ProcessDocumentProcessor(),
  "embed-document-tags": new EmbedDocumentTagsProcessor(),
};
