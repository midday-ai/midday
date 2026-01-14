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
  fk: z
    .string()
    .min(1)
    .openapi({
      description:
        "Team file key for proxy/download access to team files. This key is returned in the user data response (GET /users/me) as the `fileKey` field. It is team-scoped and deterministic - all members of the same team share the same file key. Use this key to authenticate file access requests.",
      example: "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6",
      param: {
        in: "query",
        name: "fk",
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
  fk: z
    .string()
    .min(1)
    .openapi({
      description:
        "Team file key for proxy/download access to team files. This key is returned in the user data response (GET /users/me) as the `fileKey` field. It is team-scoped and deterministic - all members of the same team share the same file key. Use this key to authenticate file access requests.",
      example: "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6",
      param: {
        in: "query",
        name: "fk",
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
        "Invoice ID (UUID). Requires team file key (fk) query parameter for authentication.",
      example: "b3b7c1e2-4c2a-4e7a-9c1a-2b7c1e24c2a4",
      param: {
        in: "query",
        name: "id",
      },
    }),
  fk: z
    .string()
    .min(1)
    .optional()
    .openapi({
      description:
        "Team file key for authenticated invoice access. Required when using invoice ID. This key is returned in the user data response (GET /users/me) as the `fileKey` field.",
      example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      param: {
        in: "query",
        name: "fk",
      },
    }),
  token: z
    .string()
    .optional()
    .openapi({
      description:
        "Invoice access token for public access. When used alone (without id), allows public access to the invoice.",
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
  type: z
    .enum(["invoice", "receipt"])
    .optional()
    .default("invoice")
    .openapi({
      description:
        "Type of document to download. Use 'receipt' to download a receipt for paid invoices.",
      example: "invoice",
      param: {
        in: "query",
        name: "type",
      },
    }),
});
