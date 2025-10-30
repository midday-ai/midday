import { z } from "@hono/zod-openapi";

export const getDocumentsSchema = z
  .object({
    cursor: z.string().nullable().optional().openapi({
      description:
        "A cursor for pagination. Pass the value returned from the previous response to get the next page.",
      example: "20",
    }),
    sort: z
      .tuple([z.string(), z.string()])
      .nullable()
      .optional()
      .openapi({
        description:
          "Sorting order as a tuple: [field, direction]. Example: ['name', 'asc'].",
        param: {
          in: "query",
        },
      }),
    pageSize: z.coerce.number().min(1).max(100).optional().openapi({
      description: "Number of documents to return per page.",
      example: 20,
    }),
    q: z.string().nullable().optional().openapi({
      description: "Search query string to filter documents by text.",
      example: "invoice",
    }),
    tags: z
      .array(z.string())
      .nullable()
      .optional()
      .openapi({
        description: "Array of tag IDs to filter documents by tags.",
        example: ["tag1", "tag2"],
      }),
  })
  .openapi({
    description: "Query parameters for listing documents.",
  });

export const getDocumentSchema = z.object({
  id: z
    .string()
    .nullable()
    .optional()
    .openapi({
      param: {
        in: "path",
        name: "id",
        required: true,
      },
    }),
  filePath: z.string().nullable().optional(),
});

export const getRelatedDocumentsSchema = z.object({
  id: z.string().openapi({
    param: {
      in: "path",
      name: "id",
    },
  }),
  pageSize: z.coerce.number().min(1).max(100),
});

export const deleteDocumentSchema = z.object({
  id: z.string().openapi({
    param: {
      in: "path",
      name: "id",
    },
  }),
});

export const deleteDocumentResponseSchema = z.object({
  id: z.string(),
});

export const processDocumentSchema = z.array(
  z.object({
    mimetype: z.string(),
    size: z.number(),
    filePath: z.array(z.string()),
  }),
);

export const signedUrlSchema = z.object({
  filePath: z.string(),
  expireIn: z.number(),
});

export const signedUrlsSchema = z.array(z.string());

export const getDocumentPreSignedUrlSchema = z.object({
  id: z
    .string()
    .uuid()
    .openapi({
      description:
        "Unique identifier of the document to generate a pre-signed URL for",
      example: "b3b7c1e2-4c2a-4e7a-9c1a-2b7c1e24c2a4",
      param: {
        in: "path",
        name: "id",
      },
    }),
  download: z.coerce
    .boolean()
    .optional()
    .openapi({
      description:
        "Whether to force download the file. If true, the file will be downloaded. If false or omitted, the file will be displayed in the browser if possible.",
      example: true,
      param: {
        in: "query",
        name: "download",
      },
    }),
});

export const preSignedUrlResponseSchema = z.object({
  url: z.string().url().openapi({
    description:
      "Pre-signed URL for accessing the document, valid for 60 seconds",
    example:
      "https://service.midday.ai/storage/v1/object/sign/vault/documents/2024/invoice.pdf?token=abc123&expires=1640995200",
  }),
  expiresAt: z.string().datetime().openapi({
    description: "ISO 8601 timestamp when the URL expires",
    example: "2024-04-15T10:01:00.000Z",
  }),
  fileName: z.string().nullable().openapi({
    description: "Original filename of the document",
    example: "invoice-april-2024.pdf",
  }),
});

export const documentResponseSchema = z
  .object({
    id: z.string().openapi({
      description: "Unique identifier for the document.",
      example: "doc_1234567890abcdef",
    }),
    title: z.string().nullable().openapi({
      description: "Title of the document.",
      example: "Invoice April 2024",
    }),
    pathTokens: z.array(z.string()).openapi({
      description: "Array of path tokens representing the document's location.",
      example: ["invoices", "2024", "april", "invoice-123.pdf"],
    }),
    metadata: z
      .object({
        size: z.number().nullable().openapi({
          description: "Size of the document in bytes.",
          example: 204800,
        }),
        mimetype: z.string().nullable().openapi({
          description: "MIME type of the document.",
          example: "application/pdf",
        }),
      })
      .nullable()
      .openapi({
        description: "Metadata about the document.",
      }),
    processingStatus: z.string().openapi({
      description: "Processing status of the document.",
      example: "processed",
    }),
    summary: z.string().nullable().openapi({
      description: "Summary or extracted content from the document.",
      example: "Invoice for April 2024, total $1,200.00",
    }),
    date: z.string().nullable().openapi({
      description: "Date associated with the document (ISO 8601).",
      example: "2024-04-30",
    }),
  })
  .openapi({
    description: "A single document object response.",
    example: {
      id: "doc_1234567890abcdef",
      title: "Invoice April 2024",
      pathTokens: ["invoices", "2024", "april", "invoice-123.pdf"],
      metadata: {
        size: 204800,
        mimetype: "application/pdf",
      },
      processingStatus: "processed",
      summary: "Invoice for April 2024, total $1,200.00",
      date: "2024-04-30",
    },
  });

export const documentsResponseSchema = z
  .object({
    meta: z
      .object({
        cursor: z.string().nullable().optional().openapi({
          description: "Cursor for pagination.",
          example: "20",
        }),
        hasPreviousPage: z.boolean().openapi({
          description: "Whether there is a previous page.",
          example: false,
        }),
        hasNextPage: z.boolean().openapi({
          description: "Whether there is a next page.",
          example: true,
        }),
      })
      .openapi({
        description: "Pagination metadata for the documents list.",
      }),
    data: z.array(documentResponseSchema).openapi({
      description: "Array of document objects.",
    }),
  })
  .openapi({
    description:
      "Response containing a list of documents and pagination metadata.",
    example: {
      meta: {
        cursor: "20",
        hasPreviousPage: false,
        hasNextPage: true,
      },
      data: [
        {
          id: "doc_1234567890abcdef",
          title: "Invoice April 2024",
          pathTokens: ["invoices", "2024", "april", "invoice-123.pdf"],
          metadata: {
            size: 204800,
            mimetype: "application/pdf",
          },
          processingStatus: "processed",
          summary: "Invoice for April 2024, total $1,200.00",
          date: "2024-04-30",
        },
      ],
    },
  });
