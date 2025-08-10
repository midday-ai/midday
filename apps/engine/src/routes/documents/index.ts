import type { Bindings } from "@engine/common/bindings";
import { ErrorSchema } from "@engine/common/schema";
import { createErrorResponse } from "@engine/utils/error";
import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import { MarkdownConversionSchema, MarkdownRequestSchema } from "./schema";

const app = new OpenAPIHono<{ Bindings: Bindings }>().openapi(
  createRoute({
    method: "post",
    path: "/markdown",
    summary: "Convert Documents to Markdown",
    request: {
      body: {
        content: {
          "multipart/form-data": {
            schema: MarkdownRequestSchema,
          },
        },
      },
    },
    responses: {
      200: {
        content: {
          "application/json": {
            schema: MarkdownConversionSchema,
          },
        },
        description: "Successfully converted documents to markdown",
      },
      400: {
        content: {
          "application/json": {
            schema: ErrorSchema,
          },
        },
        description: "Returns an error",
      },
    },
  }),
  async (c) => {
    try {
      const formData = await c.req.formData();
      const rawFiles = formData.getAll("files");

      // Convert files to the format expected by Workers AI toMarkdown
      const documents: { name: string; blob: Blob }[] = [];

      for (const file of rawFiles) {
        if (
          file &&
          typeof file === "object" &&
          "name" in file &&
          "size" in file
        ) {
          documents.push({
            name: (file as File).name,
            blob: file as File,
          });
        }
      }

      const results = await c.env.AI.toMarkdown(documents);

      return c.json(
        {
          data: results,
        },
        200,
      );
    } catch (error) {
      console.error("Markdown conversion error:", error);
      const errorResponse = createErrorResponse(error);
      return c.json(errorResponse, 400);
    }
  },
);

export default app;
