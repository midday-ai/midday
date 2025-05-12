import { z } from "zod";

export const getDocumentsSchema = z.object({
  cursor: z.string().nullable().optional(),
  sort: z.array(z.string(), z.string()).nullable().optional(),
  pageSize: z.number().optional(),
  filter: z
    .object({
      q: z.string().nullable().optional(),
      tags: z.array(z.string()).nullable().optional(),
    })
    .optional(),
});

export const getDocumentSchema = z.object({
  id: z.string().nullable().optional(),
  filePath: z.string().nullable().optional(),
});

export const getRelatedDocumentsSchema = z.object({
  id: z.string(),
  pageSize: z.number(),
});

export const deleteDocumentSchema = z.object({ id: z.string() });

export const processDocumentSchema = z.array(
  z.object({
    mimetype: z.string(),
    size: z.number(),
    file_path: z.array(z.string()),
  }),
);

export const signedUrlSchema = z.object({
  filePath: z.string(),
  expireIn: z.number(),
});

export const signedUrlsSchema = z.array(z.string());
