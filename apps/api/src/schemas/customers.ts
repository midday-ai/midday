import { createSchema } from "@api/utils/schema";
import { z } from "zod";
import "zod-openapi/extend";

export const getCustomersSchema = createSchema(
  z
    .object({
      filter: z
        .object({
          q: z
            .string()
            .nullable()
            .optional()
            .openapi({
              description: "Search query string to filter customers by text.",
              param: {
                in: "query",
              },
            }),
        })
        .optional()
        .openapi({
          description: "Filter object for searching customers.",
          param: {
            in: "query",
          },
        }),
      sort: z
        .array(z.string(), z.string())
        .nullable()
        .optional()
        .openapi({
          description:
            "Sorting order as a tuple: [field, direction]. Example: ['name', 'asc'].",
          param: {
            in: "query",
          },
        }),
      cursor: z
        .string()
        .optional()
        .openapi({
          description:
            "A cursor for pagination, representing the last item from the previous page.",
          param: {
            in: "query",
          },
        }),
      pageSize: z.coerce
        .number()
        .min(1)
        .max(100)
        .optional()
        .openapi({
          description: "Number of customers to return per page (1-100).",
          param: {
            in: "query",
          },
        }),
    })
    .optional()
    .openapi({
      description: "Filter object for searching customers.",
      param: {
        in: "query",
      },
    }),
);

export const customerResponseSchema = createSchema(
  z.object({
    id: z.string().uuid(),
    name: z.string(),
    email: z.string().email(),
    phone: z.string().nullable().optional(),
    website: z.string().nullable().optional(),
    createdAt: z.string(),
    teamId: z.string().uuid(),
    country: z.string().nullable().optional(),
    addressLine1: z.string().nullable().optional(),
    addressLine2: z.string().nullable().optional(),
    city: z.string().nullable().optional(),
    state: z.string().nullable().optional(),
    zip: z.string().nullable().optional(),
    note: z.string().nullable().optional(),
    vatNumber: z.string().nullable().optional(),
    countryCode: z.string().nullable().optional(),
    token: z.string(),
    contact: z.string().nullable().optional(),
    invoiceCount: z.number(),
    projectCount: z.number(),
    tags: z.array(
      z.object({
        id: z.string().uuid(),
        name: z.string(),
      }),
    ),
  }),
);

export const customersResponseSchema = createSchema(
  z.object({
    meta: z.object({
      cursor: z.string().optional(),
      hasPreviousPage: z.boolean(),
      hasNextPage: z.boolean(),
    }),
    data: z.array(customerResponseSchema.camel),
  }),
);

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
