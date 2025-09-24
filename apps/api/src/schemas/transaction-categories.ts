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

export const createManyTransactionCategorySchema = z.array(
  z.object({
    name: z.string(),
    color: z.string().optional(),
    description: z.string().optional(),
    taxRate: z.number().optional(),
    taxType: z.string().optional(),
    taxReportingCode: z.string().optional(),
    excluded: z.boolean().optional(),
    parentId: z.string().optional(),
  }),
);

export const updateTransactionCategorySchema = z.object({
  id: z.string(),
  name: z.string(),
  color: z.string().nullable(),
  description: z.string().nullable(),
  taxRate: z.number().nullable(),
  taxType: z.string().nullable(),
  taxReportingCode: z.string().nullable(),
  excluded: z.boolean().nullable(),
  parentId: z.string().nullable(),
});

export const deleteTransactionCategorySchema = z.object({ id: z.string() });

export const getCategoriesSchema = z
  .object({
    limit: z.number().optional(),
  })
  .optional();
