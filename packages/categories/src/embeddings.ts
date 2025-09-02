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

/**
 * Generate a single embedding for a category name
 */
export async function generateCategoryEmbedding(categoryName: string) {
  const { embedding } = await embed({
    model: EMBEDDING_CONFIG.model,
    value: categoryName,
    providerOptions: EMBEDDING_CONFIG.providerOptions,
  });

  return {
    embedding,
    model: EMBEDDING_CONFIG.modelName,
  };
}

/**
 * Generate embeddings for multiple category names
 */
export async function generateCategoryEmbeddings(categoryNames: string[]) {
  const { embeddings } = await embedMany({
    model: EMBEDDING_CONFIG.model,
    values: categoryNames,
    providerOptions: EMBEDDING_CONFIG.providerOptions,
  });

  return {
    embeddings,
    model: EMBEDDING_CONFIG.modelName,
  };
}

/**
 * Category Embedding Service
 * Provides a consistent interface for generating category embeddings
 */
export class CategoryEmbeddings {
  /**
   * Generate embedding for a single category
   */
  public async embed(categoryName: string) {
    return generateCategoryEmbedding(categoryName);
  }

  /**
   * Generate embeddings for multiple categories
   */
  public async embedMany(categoryNames: string[]) {
    return generateCategoryEmbeddings(categoryNames);
  }
}
