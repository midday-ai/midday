import { z } from "@hono/zod-openapi";

export const getCustomersSchema = z
  .object({
    q: z
      .string()
      .nullable()
      .optional()
      .openapi({
        description:
          "Search query string to filter customers by name, email, or other text fields",
        example: "acme",
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
          "Sorting order as a tuple: [field, direction]. Example: ['name', 'asc'] or ['createdAt', 'desc']",
        example: ["name", "asc"],
        param: {
          in: "query",
        },
      }),
    cursor: z
      .string()
      .optional()
      .openapi({
        description:
          "Cursor for pagination, representing the last item from the previous page",
        example: "eyJpZCI6IjEyMyJ9",
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
        description: "Number of customers to return per page (1-100)",
        example: 20,
        param: {
          in: "query",
        },
      }),
  })
  .openapi({
    description: "Query parameters for filtering and paginating customers",
    param: {
      in: "query",
    },
  });

export const customerResponseSchema = z.object({
  id: z.string().uuid().openapi({
    description: "Unique identifier of the customer",
    example: "b3b7c1e2-4c2a-4e7a-9c1a-2b7c1e24c2a4",
  }),
  name: z.string().openapi({
    description: "Name of the customer or organization",
    example: "Acme Corporation",
  }),
  email: z.string().email().openapi({
    description: "Primary email address of the customer",
    example: "contact@acme.com",
  }),
  phone: z.string().nullable().openapi({
    description: "Primary phone number of the customer",
    example: "+1-555-123-4567",
  }),
  website: z.string().nullable().openapi({
    description: "Website URL of the customer",
    example: "https://acme.com",
  }),
  createdAt: z.string().openapi({
    description:
      "Date and time when the customer was created in ISO 8601 format",
    example: "2024-05-01T12:34:56.789Z",
  }),
  country: z.string().nullable().openapi({
    description: "Country name where the customer is located",
    example: "United States",
  }),
  addressLine1: z.string().nullable().openapi({
    description: "First line of the customer's address",
    example: "123 Main Street",
  }),
  addressLine2: z.string().nullable().openapi({
    description:
      "Second line of the customer's address (suite, apartment, etc.)",
    example: "Suite 400",
  }),
  city: z.string().nullable().openapi({
    description: "City where the customer is located",
    example: "San Francisco",
  }),
  state: z.string().nullable().openapi({
    description: "State or province where the customer is located",
    example: "California",
  }),
  zip: z.string().nullable().openapi({
    description: "ZIP or postal code of the customer's address",
    example: "94105",
  }),
  note: z.string().nullable().openapi({
    description: "Internal notes about the customer for team reference",
    example: "Preferred contact method is email. Large enterprise client.",
  }),
  vatNumber: z.string().nullable().openapi({
    description: "VAT (Value Added Tax) number of the customer",
    example: "US123456789",
  }),
  countryCode: z.string().nullable().openapi({
    description: "Country code in ISO 3166-1 alpha-2 format",
    example: "US",
  }),
  token: z.string().openapi({
    description:
      "Unique token for the customer (used for internal identification)",
    example: "cus_abc123xyz789",
  }),
  contact: z.string().nullable().openapi({
    description: "Primary contact person's name at the customer organization",
    example: "John Smith",
  }),
  invoiceCount: z.number().openapi({
    description: "Total number of invoices created for this customer",
    example: 12,
  }),
  projectCount: z.number().openapi({
    description: "Total number of projects associated with this customer",
    example: 3,
  }),
  tags: z
    .array(
      z.object({
        id: z.string().uuid().openapi({
          description: "Unique identifier of the tag",
          example: "e7a9c1a2-4c2a-4e7a-9c1a-2b7c1e24c2a4",
        }),
        name: z.string().openapi({
          description: "Display name of the tag",
          example: "VIP",
        }),
      }),
    )
    .openapi({
      description:
        "Array of tags associated with the customer for categorization",
      example: [
        { id: "e7a9c1a2-4c2a-4e7a-9c1a-2b7c1e24c2a4", name: "VIP" },
        { id: "f1b2c3d4-5678-4e7a-9c1a-2b7c1e24c2a4", name: "Enterprise" },
      ],
    }),
});

export const customersResponseSchema = z.object({
  meta: z
    .object({
      cursor: z.string().nullable().openapi({
        description:
          "Cursor for the next page of results, null if no more pages",
        example: "eyJpZCI6IjQ1NiJ9",
      }),
      hasPreviousPage: z.boolean().openapi({
        description:
          "Whether there are more customers available on the previous page",
        example: false,
      }),
      hasNextPage: z.boolean().openapi({
        description:
          "Whether there are more customers available on the next page",
        example: true,
      }),
    })
    .openapi({
      description: "Pagination metadata for the customers response",
    }),
  data: z.array(customerResponseSchema).openapi({
    description: "Array of customers matching the query criteria",
  }),
});

export const getCustomerByIdSchema = z.object({
  id: z.string().openapi({
    description: "Unique identifier of the customer to retrieve",
    example: "b3b7c1e2-4c2a-4e7a-9c1a-2b7c1e24c2a4",
    param: {
      in: "path",
      name: "id",
    },
  }),
});

export const deleteCustomerSchema = z.object({
  id: z.string().openapi({
    description: "Unique identifier of the customer to delete",
    example: "b3b7c1e2-4c2a-4e7a-9c1a-2b7c1e24c2a4",
    param: {
      in: "path",
      name: "id",
    },
  }),
});

export const upsertCustomerSchema = z.object({
  id: z.string().uuid().optional().openapi({
    description:
      "Unique identifier of the customer. Required for updates, omit for new customers",
    example: "b3b7c1e2-4c2a-4e7a-9c1a-2b7c1e24c2a4",
  }),
  name: z.string().openapi({
    description: "Name of the customer or organization",
    example: "Acme Corporation",
  }),
  email: z.string().email().openapi({
    description: "Primary email address of the customer",
    example: "contact@acme.com",
  }),
  country: z.string().nullable().optional().openapi({
    description: "Country name where the customer is located",
    example: "United States",
  }),
  addressLine1: z.string().nullable().optional().openapi({
    description: "First line of the customer's address",
    example: "123 Main Street",
  }),
  addressLine2: z.string().nullable().optional().openapi({
    description:
      "Second line of the customer's address (suite, apartment, etc.)",
    example: "Suite 400",
  }),
  city: z.string().nullable().optional().openapi({
    description: "City where the customer is located",
    example: "San Francisco",
  }),
  state: z.string().nullable().optional().openapi({
    description: "State or province where the customer is located",
    example: "California",
  }),
  zip: z.string().nullable().optional().openapi({
    description: "ZIP or postal code of the customer's address",
    example: "94105",
  }),
  phone: z.string().nullable().optional().openapi({
    description: "Primary phone number of the customer",
    example: "+1-555-123-4567",
  }),
  website: z.string().nullable().optional().openapi({
    description: "Website URL of the customer",
    example: "https://acme.com",
  }),
  note: z.string().nullable().optional().openapi({
    description: "Internal notes about the customer for team reference",
    example: "Preferred contact method is email. Large enterprise client.",
  }),
  vatNumber: z.string().nullable().optional().openapi({
    description: "VAT (Value Added Tax) number of the customer",
    example: "US123456789",
  }),
  countryCode: z.string().nullable().optional().openapi({
    description: "Country code in ISO 3166-1 alpha-2 format",
    example: "US",
  }),
  contact: z.string().nullable().optional().openapi({
    description: "Primary contact person's name at the customer organization",
    example: "John Smith",
  }),
  tags: z
    .array(
      z.object({
        id: z.string().uuid().openapi({
          description: "Unique identifier of the tag",
          example: "e7a9c1a2-4c2a-4e7a-9c1a-2b7c1e24c2a4",
        }),
        name: z.string().openapi({
          description: "Display name of the tag",
          example: "VIP",
        }),
      }),
    )
    .optional()
    .openapi({
      description:
        "Array of tags to associate with the customer for categorization",
      example: [
        { id: "e7a9c1a2-4c2a-4e7a-9c1a-2b7c1e24c2a4", name: "VIP" },
        { id: "f1b2c3d4-5678-4e7a-9c1a-2b7c1e24c2a4", name: "Enterprise" },
      ],
    }),
});
