import { z } from "@hono/zod-openapi";

export const proxyFileSchema = z.object({
  filePath: z
    .string()
    .min(1)
    .openapi({
      description:
        "Path to the file in storage. Can include or exclude 'vault/' prefix.",
      example: "vault/documents/2024/invoice.pdf",
      param: {
        in: "query",
        name: "filePath",
        required: true,
      },
    }),
  token: z
    .string()
    .min(1)
    .openapi({
      description:
        "Authentication token (JWT). Required for secure file access.",
      example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      param: {
        in: "query",
        name: "token",
        required: true,
      },
    }),
});

export const previewFileSchema = z.object({
  filePath: z
    .string()
    .min(1)
    .openapi({
      description:
        "Path to the PDF file in storage. Can include or exclude 'vault/' prefix.",
      example: "vault/documents/2024/invoice.pdf",
      param: {
        in: "query",
        name: "filePath",
        required: true,
      },
    }),
  token: z
    .string()
    .min(1)
    .openapi({
      description:
        "Authentication token (JWT). Required for secure file access.",
      example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      param: {
        in: "query",
        name: "token",
        required: true,
      },
    }),
});

export const downloadFileSchema = z.object({
  path: z
    .string()
    .min(1)
    .openapi({
      description:
        "Path to the file in storage. Can include or exclude 'vault/' prefix.",
      example: "vault/documents/2024/invoice.pdf",
      param: {
        in: "query",
        name: "path",
        required: true,
      },
    }),
  filename: z
    .string()
    .optional()
    .openapi({
      description: "Optional filename for the Content-Disposition header.",
      example: "invoice.pdf",
      param: {
        in: "query",
        name: "filename",
      },
    }),
  token: z
    .string()
    .min(1)
    .openapi({
      description:
        "Authentication token (JWT). Required for secure file access.",
      example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      param: {
        in: "query",
        name: "token",
        required: true,
      },
    }),
});

export const downloadInvoiceSchema = z.object({
  id: z
    .string()
    .uuid()
    .optional()
    .openapi({
      description:
        "Invoice ID (UUID). Requires authentication via Authorization header or token query parameter.",
      example: "b3b7c1e2-4c2a-4e7a-9c1a-2b7c1e24c2a4",
      param: {
        in: "query",
        name: "id",
      },
    }),
  token: z
    .string()
    .optional()
    .openapi({
      description:
        "Authentication token (when used with id) or invoice access token (for public access). When used with id, provides authentication. When used alone, allows public access.",
      example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      param: {
        in: "query",
        name: "token",
      },
    }),
  preview: z
    .preprocess(
      (val) => val === "true" || val === true,
      z.boolean().default(false),
    )
    .optional()
    .openapi({
      description:
        "If true, the PDF will be displayed inline. If false, it will be downloaded.",
      example: false,
      param: {
        in: "query",
        name: "preview",
      },
    }),
});
