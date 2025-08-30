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

export class Embed {
  public async embedMany(content: string[]): Promise<{
    embeddings: number[][];
    model: string;
  }> {
    const { embeddings } = await embedMany({
      model: EMBEDDING_CONFIG.model,
      values: content,
      providerOptions: EMBEDDING_CONFIG.providerOptions,
    });

    return {
      embeddings,
      model: EMBEDDING_CONFIG.modelName,
    };
  }

  public async embed(content: string): Promise<{
    embedding: number[];
    model: string;
  }> {
    const { embedding } = await embed({
      model: EMBEDDING_CONFIG.model,
      value: content,
      providerOptions: EMBEDDING_CONFIG.providerOptions,
    });

    return {
      embedding,
      model: EMBEDDING_CONFIG.modelName,
    };
  }
}
