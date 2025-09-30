import { z } from "@hono/zod-openapi";

export const createTransactionCategorySchema = z.object({
  name: z.string(),
  color: z.string().optional(),
  description: z.string().optional(),
  taxRate: z.number().optional(),
  taxType: z.string().optional(),
  taxReportingCode: z.string().optional(),
  excluded: z.boolean().optional(),
  parentId: z.string().optional(),
});

export const updateTransactionCategorySchema = z.object({
  id: z.string(),
  name: z.string(),
  color: z.string().nullable(),
  description: z.string().nullable(),
  taxRate: z.number().nullable(),
  taxType: z.string().nullable(),
  taxReportingCode: z.string().nullable(),
  excluded: z.boolean().nullable(),
  parentId: z.string().nullable().optional(),
});

export const deleteTransactionCategorySchema = z.object({ id: z.string() });

export const getCategoriesSchema = z
  .object({
    limit: z.number().optional(),
  })
  .optional();

export const getCategoryByIdSchema = z.object({
  id: z
    .string()
    .uuid()
    .openapi({
      description: "Unique identifier of the category to retrieve",
      example: "b3b7c1e2-4c2a-4e7a-9c1a-2b7c1e24c2a4",
      param: {
        in: "path",
        name: "id",
      },
    }),
});
