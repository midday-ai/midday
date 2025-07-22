import { z } from "@hono/zod-openapi";

export const createShortLinkSchema = z.object({
  url: z.string().url().openapi({
    description: "The URL to create a short link for",
    example: "https://example.com/document.pdf",
  }),
});

export const createShortLinkForDocumentSchema = z
  .object({
    documentId: z.string().optional().openapi({
      description: "The ID of the document",
      example: "doc_1234567890",
    }),
    filePath: z.string().optional().openapi({
      description: "The path to the file in storage",
      example: "team_123/documents/document.pdf",
    }),
    expireIn: z.number().default(3600).openapi({
      description: "Expiration time in seconds for the signed URL",
      example: 3600,
    }),
  })
  .refine((data) => data.documentId || data.filePath, {
    message: "At least one of documentId or filePath must be provided",
    path: ["documentId", "filePath"],
  });

export const getShortLinkSchema = z.object({
  shortId: z.string().openapi({
    description: "The short ID of the link",
    example: "abc12345",
  }),
});
