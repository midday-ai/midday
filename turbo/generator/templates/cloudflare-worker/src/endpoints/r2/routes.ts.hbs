import { createRoute, z } from "@hono/zod-openapi";
import { openApiErrorResponses } from "../../pkg/errors";
import { RecordSchema } from "./types";

export const getRoute = createRoute({
  tags: ["r2"],
  operationId: "v1.r2.get",
  method: "get",
  path: "/v1/r2/{key}",
  request: {
    params: z.object({
      key: z.string(),
    }),
  },
  responses: {
    200: {
      description: "The requested record",
      content: {
        "application/json": {
          schema: RecordSchema,
        },
      },
    },
    ...openApiErrorResponses,
  },
});

export const putRoute = createRoute({
  tags: ["r2"],
  operationId: "v1.r2.put",
  method: "put",
  path: "/v1/r2/{key}",
  request: {
    params: z.object({
      key: z.string(),
    }),
    body: {
      content: {
        "application/json": {
          schema: RecordSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: "Record stored successfully",
      content: {
        "application/json": {
          schema: z.object({
            message: z.string(),
            id: z.string().uuid(),
          }),
        },
      },
    },
    ...openApiErrorResponses,
  },
});

export const deleteRoute = createRoute({
  tags: ["r2"],
  operationId: "v1.r2.delete",
  method: "delete",
  path: "/v1/r2/{key}",
  request: {
    params: z.object({
      key: z.string(),
    }),
  },
  responses: {
    200: {
      description: "Record deleted successfully",
      content: {
        "application/json": {
          schema: z.object({
            message: z.string(),
          }),
        },
      },
    },
    ...openApiErrorResponses,
  },
});
