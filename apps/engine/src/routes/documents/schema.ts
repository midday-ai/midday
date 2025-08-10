import { z } from "@hono/zod-openapi";

export const MarkdownRequestSchema = z
  .object({
    files: z
      .array(z.any())
      .min(1)
      .openapi({
        description: "Files to convert to markdown",
        type: "array",
        items: {
          type: "string",
          format: "binary",
        },
      }),
  })
  .openapi("MarkdownRequestSchema");

export const MarkdownConversionSchema = z
  .object({
    data: z.array(
      z.object({
        name: z.string().openapi({
          example: "document.pdf",
        }),
        mimeType: z.string().openapi({
          example: "application/pdf",
        }),
        format: z.literal("markdown").openapi({
          example: "markdown",
        }),
        tokens: z.number().openapi({
          example: 1024,
        }),
        data: z.string().openapi({
          example:
            "# Document Title\n\nThis is the converted markdown content...",
        }),
      }),
    ),
  })
  .openapi("MarkdownConversionSchema");

export const DocumentErrorSchema = z
  .object({
    error: z.string().openapi({
      example: "conversion_failed",
    }),
    message: z.string().openapi({
      example: "Failed to convert document to markdown",
    }),
    code: z.string().openapi({
      example: "400",
    }),
  })
  .openapi("DocumentErrorSchema");
