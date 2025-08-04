import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { embed, embedMany } from "ai";

const GOOGLE_API_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY!;

const google = createGoogleGenerativeAI({
  apiKey: GOOGLE_API_KEY,
});

const EMBEDDING_CONFIG = {
  model: google.textEmbedding("gemini-embedding-001"),
  providerOptions: {
    google: {
      outputDimensionality: 768,
      taskType: "SEMANTIC_SIMILARITY",
    },
  },
  modelName: "gemini-embedding-001",
};

export async function generateEmbedding(text: string): Promise<{
  embedding: number[];
  model: string;
}> {
  const { embedding } = await embed({
    model: EMBEDDING_CONFIG.model,
    value: text,
    providerOptions: EMBEDDING_CONFIG.providerOptions,
  });

  return {
    embedding,
    model: EMBEDDING_CONFIG.modelName,
  };
}

/**
 * Generate multiple embeddings with our standard configuration
 */
export async function generateEmbeddings(texts: string[]): Promise<{
  embeddings: number[][];
  model: string;
}> {
  const { embeddings } = await embedMany({
    model: EMBEDDING_CONFIG.model,
    values: texts,
    providerOptions: EMBEDDING_CONFIG.providerOptions,
  });

  return {
    embeddings,
    model: EMBEDDING_CONFIG.modelName,
  };
}
