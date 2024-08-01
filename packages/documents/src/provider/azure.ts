import DocumentIntelligence from "@azure-rest/ai-document-intelligence";

export const client = DocumentIntelligence(
  process.env.AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT!,
  {
    key: process.env.AZURE_DOCUMENT_INTELLIGENCE_KEY!,
  },
);
