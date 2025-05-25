import { z } from "zod";
import "zod-openapi/extend";

export const getCustomersSchema = z
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
  });

export const customerResponseSchema = z.object({
  id: z.string().uuid().openapi({
    description: "Customer ID (UUID)",
    example: "b3b7c1e2-4c2a-4e7a-9c1a-2b7c1e24c2a4",
  }),
  name: z.string().openapi({
    description: "Customer name",
    example: "Acme Corporation",
  }),
  email: z.string().email().openapi({
    description: "Customer email address",
    example: "info@acme.com",
  }),
  phone: z.string().nullable().optional().openapi({
    description: "Customer phone number",
    example: "+1-555-123-4567",
    nullable: true,
  }),
  website: z.string().nullable().optional().openapi({
    description: "Customer website URL",
    example: "https://acme.com",
    nullable: true,
  }),
  createdAt: z.string().openapi({
    description: "Date and time when the customer was created (ISO 8601)",
    example: "2024-05-01T12:34:56.789Z",
  }),
  country: z.string().nullable().optional().openapi({
    description: "Country name",
    example: "United States",
    nullable: true,
  }),
  addressLine1: z.string().nullable().optional().openapi({
    description: "Address line 1",
    example: "123 Main St",
    nullable: true,
  }),
  addressLine2: z.string().nullable().optional().openapi({
    description: "Address line 2",
    example: "Suite 400",
    nullable: true,
  }),
  city: z.string().nullable().optional().openapi({
    description: "City",
    example: "San Francisco",
    nullable: true,
  }),
  state: z.string().nullable().optional().openapi({
    description: "State or province",
    example: "CA",
    nullable: true,
  }),
  zip: z.string().nullable().optional().openapi({
    description: "ZIP or postal code",
    example: "94105",
    nullable: true,
  }),
  note: z.string().nullable().optional().openapi({
    description: "Internal note about the customer",
    example: "Preferred contact by email.",
    nullable: true,
  }),
  vatNumber: z.string().nullable().optional().openapi({
    description: "VAT number",
    example: "US123456789",
    nullable: true,
  }),
  countryCode: z.string().nullable().optional().openapi({
    description: "Country code (ISO 3166-1 alpha-2)",
    example: "US",
    nullable: true,
  }),
  token: z.string().openapi({
    description: "Customer token (internal use)",
    example: "cus_abc123xyz",
  }),
  contact: z.string().nullable().optional().openapi({
    description: "Contact person for the customer",
    example: "John Doe",
    nullable: true,
  }),
  invoiceCount: z.number().openapi({
    description: "Number of invoices associated with the customer",
    example: 5,
  }),
  projectCount: z.number().openapi({
    description: "Number of projects associated with the customer",
    example: 2,
  }),
  tags: z
    .array(
      z.object({
        id: z.string().uuid().openapi({
          description: "Tag ID (UUID)",
          example: "e7a9c1a2-4c2a-4e7a-9c1a-2b7c1e24c2a4",
        }),
        name: z.string().openapi({
          description: "Tag name",
          example: "VIP",
        }),
      }),
    )
    .openapi({
      description: "List of tags associated with the customer",
      example: [
        { id: "e7a9c1a2-4c2a-4e7a-9c1a-2b7c1e24c2a4", name: "VIP" },
        { id: "f1b2c3d4-5678-4e7a-9c1a-2b7c1e24c2a4", name: "Partner" },
      ],
    }),
});

export const customersResponseSchema = z.object({
  meta: z.object({
    cursor: z.string().optional(),
    hasPreviousPage: z.boolean(),
    hasNextPage: z.boolean(),
  }),
  data: z.array(customerResponseSchema),
});

export const getCustomerByIdSchema = z.object({
  id: z.string(),
});

export const deleteCustomerSchema = z.object({
  id: z.string(),
});

export const upsertCustomerSchema = z.object({
  id: z.string().uuid().optional().openapi({
    description: "Customer ID (UUID). Required for update, omit for create.",
    example: "b3b7c1e2-4c2a-4e7a-9c1a-2b7c1e24c2a4",
  }),
  name: z.string().openapi({
    description: "Customer name",
    example: "Acme Corporation",
  }),
  email: z.string().email().openapi({
    description: "Customer email address",
    example: "info@acme.com",
  }),
  country: z.string().nullable().optional().openapi({
    description: "Country name",
    example: "United States",
    nullable: true,
  }),
  addressLine1: z.string().nullable().optional().openapi({
    description: "Address line 1",
    example: "123 Main St",
    nullable: true,
  }),
  addressLine2: z.string().nullable().optional().openapi({
    description: "Address line 2",
    example: "Suite 400",
    nullable: true,
  }),
  city: z.string().nullable().optional().openapi({
    description: "City",
    example: "San Francisco",
    nullable: true,
  }),
  state: z.string().nullable().optional().openapi({
    description: "State or province",
    example: "CA",
    nullable: true,
  }),
  zip: z.string().nullable().optional().openapi({
    description: "ZIP or postal code",
    example: "94105",
    nullable: true,
  }),
  note: z.string().nullable().optional().openapi({
    description: "Internal note about the customer",
    example: "VIP client, handle with care.",
    nullable: true,
  }),
  website: z.string().nullable().optional().openapi({
    description: "Customer website URL",
    example: "https://acme.com",
    nullable: true,
  }),
  phone: z.string().nullable().optional().openapi({
    description: "Customer phone number",
    example: "+1-555-123-4567",
    nullable: true,
  }),
  contact: z.string().nullable().optional().openapi({
    description: "Contact person at the customer",
    example: "Jane Doe",
    nullable: true,
  }),
  tags: z
    .array(
      z.object({
        id: z.string().uuid().openapi({
          description: "Tag ID (UUID)",
          example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
        }),
        name: z.string().openapi({
          description: "Tag name",
          example: "Enterprise",
        }),
      }),
    )
    .optional()
    .nullable()
    .openapi({
      description: "List of tags assigned to the customer",
      example: [
        { id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890", name: "Enterprise" },
        { id: "b2c3d4e5-f678-90ab-cdef-234567890abc", name: "VIP" },
      ],
      nullable: true,
    }),
});
