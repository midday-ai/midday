import { z } from "zod";
import "zod-openapi/extend";

export const createApiKeySchema = z.object({
  name: z.string().openapi({
    description: "The name of the API key",
    example: "API Key 1",
  }),
});

export const deleteApiKeySchema = z.object({
  id: z.string().openapi({
    description: "The ID of the API key",
    example: "123",
  }),
});
