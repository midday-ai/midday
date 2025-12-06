import { ClassifyDocumentProcessor } from "./classify-document";
import { ClassifyImageProcessor } from "./classify-image";
import { EmbedDocumentTagsProcessor } from "./embed-document-tags";
import { ProcessDocumentProcessor } from "./process-document";

/**
 * Export all document processors (for type imports)
 */
export { ProcessDocumentProcessor } from "./process-document";
export { ClassifyImageProcessor } from "./classify-image";
export { ClassifyDocumentProcessor } from "./classify-document";
export { EmbedDocumentTagsProcessor } from "./embed-document-tags";

/**
 * Document processor registry
 * Maps job names to processor instances
 */
export const documentProcessors = {
  "process-document": new ProcessDocumentProcessor(),
  "classify-image": new ClassifyImageProcessor(),
  "classify-document": new ClassifyDocumentProcessor(),
  "embed-document-tags": new EmbedDocumentTagsProcessor(),
};
