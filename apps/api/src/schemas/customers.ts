import { z } from "zod";

export const getCustomersSchema = z
  .object({
    filter: z
      .object({
        q: z.string().nullable().optional(),
      })
      .optional(),
    sort: z.array(z.string(), z.string()).nullable().optional(),
    cursor: z.string().optional(),
    pageSize: z.number().optional(),
  })
  .optional();

export const getCustomerByIdSchema = z.object({
  id: z.string(),
});

export const deleteCustomerSchema = z.object({
  id: z.string(),
});

export const upsertCustomerSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string(),
  email: z.string().email(),
  country: z.string().nullable().optional(),
  addressLine1: z.string().nullable().optional(),
  addressLine2: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  state: z.string().nullable().optional(),
  zip: z.string().nullable().optional(),
  note: z.string().nullable().optional(),
  website: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  contact: z.string().nullable().optional(),
  tags: z
    .array(
      z.object({
        id: z.string().uuid(),
        name: z.string(),
      }),
    )
    .optional()
    .nullable(),
});
