import { z } from "@hono/zod-openapi";

export const createShortLinkSchema = z.object({
  url: z.string().url().openapi({
    description: "The URL to create a short link for",
    example: "https://example.com/document.pdf",
  }),
});

export const createShortLinkForFileSchema = z.object({
  fullPath: z.string().openapi({
    description: "The full path to the file in storage",
    example: "team_123/documents/document.pdf",
  }),
  expireIn: z.number().default(3600).openapi({
    description: "Expiration time in seconds for the signed URL",
    example: 3600,
  }),
});

export const getShortLinkSchema = z.object({
  shortId: z.string().openapi({
    description: "The short ID of the link",
    example: "abc12345",
  }),
});
