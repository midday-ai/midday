"use server";

import { action } from "./safe-action";
import { searchEmbeddingsSchema } from "./schema";

export const searchEmbeddingsAction = action(
  searchEmbeddingsSchema,
  async (params) => {
    const { query, type, limit = 10 } = params;
  }
);
