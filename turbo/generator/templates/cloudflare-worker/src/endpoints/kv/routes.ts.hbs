import { createRoute, z } from "@hono/zod-openapi";
import { openApiErrorResponses } from "../../pkg/errors";

export const getRoute = createRoute({
  tags: ["kv"],
  operationId: "v1.kv.get",
  method: "get",
  path: "/v1/kv/{key}",
  request: {
    params: z.object({
      key: z.string(),
    }),
  },
  responses: {
    200: {
      description: "The requested value",
      content: {
        "application/octet-stream": {
          schema: z.any(),
        },
      },
    },
    204: {
      description: "No content found for the given key",
    },
    ...openApiErrorResponses,
  },
});

export const putRoute = createRoute({
  tags: ["kv"],
  operationId: "v1.kv.put",
  method: "put",
  path: "/v1/kv/{key}",
  request: {
    params: z.object({
      key: z.string(),
    }),
    body: {
      content: {
        "application/octet-stream": {
          schema: z.any(),
        },
      },
    },
  },
  responses: {
    204: {
      description: "Value stored successfully",
    },
    ...openApiErrorResponses,
  },
});
