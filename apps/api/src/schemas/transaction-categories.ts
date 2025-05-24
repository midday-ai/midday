import { z } from "zod";

export const createTransactionCategorySchema = z.object({
  name: z.string(),
  color: z.string().optional(),
  description: z.string().optional(),
  vat: z.number().optional(),
});

export const createManyTransactionCategorySchema = z.array(
  z.object({
    name: z.string(),
    color: z.string().optional(),
    description: z.string().optional(),
    vat: z.number().optional(),
  }),
);

export const updateTransactionCategorySchema = z.object({
  id: z.string(),
  name: z.string(),
  color: z.string().nullable(),
  description: z.string().nullable(),
  vat: z.number().nullable(),
});

export const deleteTransactionCategorySchema = z.object({ id: z.string() });

export const getCategoriesSchema = z
  .object({
    limit: z.number().optional(),
  })
  .optional();
