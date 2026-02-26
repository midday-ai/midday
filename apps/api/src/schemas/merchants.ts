import { z } from "@hono/zod-openapi";
import { isValidEmailList } from "@midday/utils";

export const getMerchantsSchema = z
  .object({
    q: z
      .string()
      .nullable()
      .optional()
      .openapi({
        description:
          "Search query string to filter merchants by name, email, or other text fields",
        example: "acme",
        param: {
          in: "query",
        },
      }),
    sort: z
      .array(z.string().min(1))
      .max(2)
      .min(2)
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
        description: "Number of merchants to return per page (1-100)",
        example: 20,
        param: {
          in: "query",
        },
      }),
  })
  .openapi({
    description: "Query parameters for filtering and paginating merchants",
    param: {
      in: "query",
    },
  });

export const merchantResponseSchema = z.object({
  id: z.string().uuid().openapi({
    description: "Unique identifier of the merchant",
    example: "b3b7c1e2-4c2a-4e7a-9c1a-2b7c1e24c2a4",
  }),
  name: z.string().openapi({
    description: "Name of the merchant or organization",
    example: "Acme Corporation",
  }),
  email: z.string().email().openapi({
    description: "Primary email address of the merchant",
    example: "contact@acme.com",
  }),
  billingEmail: z.string().nullable().openapi({
    description:
      "Billing email addresses of the merchant (comma-separated for multiple)",
    example: "finance@acme.com, accounting@acme.com",
  }),
  phone: z.string().nullable().openapi({
    description: "Primary phone number of the merchant",
    example: "+1-555-123-4567",
  }),
  website: z.string().nullable().openapi({
    description: "Website URL of the merchant",
    example: "https://acme.com",
  }),
  createdAt: z.string().openapi({
    description:
      "Date and time when the merchant was created in ISO 8601 format",
    example: "2024-05-01T12:34:56.789Z",
  }),
  country: z.string().nullable().openapi({
    description: "Country name where the merchant is located",
    example: "United States",
  }),
  addressLine1: z.string().nullable().openapi({
    description: "First line of the merchant's address",
    example: "123 Main Street",
  }),
  addressLine2: z.string().nullable().openapi({
    description:
      "Second line of the merchant's address (suite, apartment, etc.)",
    example: "Suite 400",
  }),
  city: z.string().nullable().openapi({
    description: "City where the merchant is located",
    example: "San Francisco",
  }),
  state: z.string().nullable().openapi({
    description: "State or province where the merchant is located",
    example: "California",
  }),
  zip: z.string().nullable().openapi({
    description: "ZIP or postal code of the merchant's address",
    example: "94105",
  }),
  note: z.string().nullable().openapi({
    description: "Internal notes about the merchant for team reference",
    example: "Preferred contact method is email. Large enterprise client.",
  }),
  vatNumber: z.string().nullable().openapi({
    description: "VAT (Value Added Tax) number of the merchant",
    example: "US123456789",
  }),
  countryCode: z.string().nullable().openapi({
    description: "Country code in ISO 3166-1 alpha-2 format",
    example: "US",
  }),
  token: z.string().openapi({
    description:
      "Unique token for the merchant (used for internal identification)",
    example: "cus_abc123xyz789",
  }),
  contact: z.string().nullable().openapi({
    description: "Primary contact person's name at the merchant organization",
    example: "John Smith",
  }),
  dealCount: z.number().openapi({
    description: "Total number of deals created for this merchant",
    example: 12,
  }),
  projectCount: z.number().openapi({
    description: "Total number of projects associated with this merchant",
    example: 3,
  }),
  // Financial metrics (calculated from deals, only returned in list queries)
  totalRevenue: z.number().optional().openapi({
    description:
      "Total revenue from paid deals for this merchant (in deal currency). Only returned in list queries.",
    example: 15000.5,
  }),
  outstandingAmount: z.number().optional().openapi({
    description:
      "Total outstanding amount from unpaid/overdue deals (in deal currency). Only returned in list queries.",
    example: 2500.0,
  }),
  lastDealDate: z.string().nullable().optional().openapi({
    description:
      "Date of the most recent deal in ISO 8601 format. Only returned in list queries.",
    example: "2024-04-15",
  }),
  dealCurrency: z.string().nullable().optional().openapi({
    description:
      "Primary currency used in deals for this merchant. Only returned in list queries.",
    example: "USD",
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
        "Array of tags associated with the merchant for categorization",
      example: [
        { id: "e7a9c1a2-4c2a-4e7a-9c1a-2b7c1e24c2a4", name: "VIP" },
        { id: "f1b2c3d4-5678-4e7a-9c1a-2b7c1e24c2a4", name: "Enterprise" },
      ],
    }),
  // Enrichment fields
  description: z.string().nullable().openapi({
    description: "AI-generated description of what the company does",
    example: "A cloud-based project management platform for remote teams.",
  }),
  industry: z.string().nullable().openapi({
    description: "Primary industry of the company",
    example: "Software",
  }),
  companyType: z.string().nullable().openapi({
    description: "Business model type",
    example: "SaaS",
  }),
  employeeCount: z.string().nullable().openapi({
    description: "Estimated number of employees",
    example: "51-200",
  }),
  foundedYear: z.number().nullable().openapi({
    description: "Year the company was founded",
    example: 2018,
  }),
  estimatedRevenue: z.string().nullable().openapi({
    description: "Estimated annual revenue range",
    example: "$10M-$50M",
  }),
  fundingStage: z.string().nullable().openapi({
    description: "Current funding stage",
    example: "Series A",
  }),
  totalFunding: z.string().nullable().openapi({
    description: "Total funding raised",
    example: "$15M",
  }),
  headquartersLocation: z.string().nullable().openapi({
    description: "Company headquarters location",
    example: "San Francisco, CA",
  }),
  timezone: z.string().nullable().openapi({
    description: "IANA timezone of the company headquarters",
    example: "America/Los_Angeles",
  }),
  linkedinUrl: z.string().nullable().openapi({
    description: "LinkedIn company page URL",
    example: "https://linkedin.com/company/acme",
  }),
  twitterUrl: z.string().nullable().openapi({
    description: "Twitter/X profile URL",
    example: "https://twitter.com/acme",
  }),
  instagramUrl: z.string().nullable().openapi({
    description: "Instagram profile URL",
    example: "https://instagram.com/acme",
  }),
  facebookUrl: z.string().nullable().openapi({
    description: "Facebook page URL",
    example: "https://facebook.com/acme",
  }),
  logoUrl: z.string().nullable().openapi({
    description: "URL to the company logo",
    example: "https://example.com/logo.png",
  }),
  ceoName: z.string().nullable().openapi({
    description: "Name of the CEO or founder",
    example: "Jane Smith",
  }),
  financeContact: z.string().nullable().openapi({
    description: "Name of the finance/AP contact for invoicing",
    example: "John Doe",
  }),
  financeContactEmail: z.string().nullable().openapi({
    description: "Email of the finance/AP contact",
    example: "finance@acme.com",
  }),
  primaryLanguage: z.string().nullable().openapi({
    description: "Primary business language (ISO 639-1 code)",
    example: "en",
  }),
  fiscalYearEnd: z.string().nullable().openapi({
    description: "Month when the fiscal year ends",
    example: "December",
  }),
  enrichmentStatus: z.string().nullable().openapi({
    description: "Status of the enrichment process",
    example: "completed",
  }),
  enrichedAt: z.string().nullable().openapi({
    description: "When the merchant was last enriched",
    example: "2024-05-01T12:34:56.789Z",
  }),
});

export const merchantsResponseSchema = z.object({
  meta: z
    .object({
      cursor: z.string().nullable().openapi({
        description:
          "Cursor for the next page of results, null if no more pages",
        example: "eyJpZCI6IjQ1NiJ9",
      }),
      hasPreviousPage: z.boolean().openapi({
        description:
          "Whether there are more merchants available on the previous page",
        example: false,
      }),
      hasNextPage: z.boolean().openapi({
        description:
          "Whether there are more merchants available on the next page",
        example: true,
      }),
    })
    .openapi({
      description: "Pagination metadata for the merchants response",
    }),
  data: z.array(merchantResponseSchema).openapi({
    description: "Array of merchants matching the query criteria",
  }),
});

export const getMerchantByIdSchema = z.object({
  id: z.string().openapi({
    description: "Unique identifier of the merchant to retrieve",
    example: "b3b7c1e2-4c2a-4e7a-9c1a-2b7c1e24c2a4",
    param: {
      in: "path",
      name: "id",
    },
  }),
});

export const getMerchantDealSummarySchema = z.object({
  id: z.string().openapi({
    description: "Unique identifier of the merchant",
    example: "b3b7c1e2-4c2a-4e7a-9c1a-2b7c1e24c2a4",
    param: {
      in: "path",
      name: "id",
    },
  }),
});

export const merchantDealSummaryResponseSchema = z.object({
  totalAmount: z.number().openapi({
    description: "Total amount of all deals",
    example: 10021.5,
  }),
  paidAmount: z.number().openapi({
    description: "Total amount of paid deals",
    example: 5320.5,
  }),
  outstandingAmount: z.number().openapi({
    description: "Total amount of unpaid and overdue deals",
    example: 4701.0,
  }),
  dealCount: z.number().openapi({
    description: "Total number of deals",
    example: 5,
  }),
  currency: z.string().openapi({
    description: "Currency code",
    example: "EUR",
  }),
});

export const deleteMerchantSchema = z.object({
  id: z.string().openapi({
    description: "Unique identifier of the merchant to delete",
    example: "b3b7c1e2-4c2a-4e7a-9c1a-2b7c1e24c2a4",
    param: {
      in: "path",
      name: "id",
    },
  }),
});

export const enrichMerchantSchema = z.object({
  id: z.string().uuid().openapi({
    description: "Unique identifier of the merchant to enrich",
    example: "b3b7c1e2-4c2a-4e7a-9c1a-2b7c1e24c2a4",
  }),
});

export const enrichMerchantResponseSchema = z.object({
  queued: z.boolean().openapi({
    description: "Whether the enrichment job was successfully queued",
    example: true,
  }),
});

export const upsertMerchantSchema = z.object({
  id: z.string().uuid().optional().openapi({
    description:
      "Unique identifier of the merchant. Required for updates, omit for new merchants",
    example: "b3b7c1e2-4c2a-4e7a-9c1a-2b7c1e24c2a4",
  }),
  name: z.string().openapi({
    description: "Name of the merchant or organization",
    example: "Acme Corporation",
  }),
  email: z.string().email().openapi({
    description: "Primary email address of the merchant",
    example: "contact@acme.com",
  }),
  billingEmail: z
    .string()
    .nullable()
    .optional()
    .refine(isValidEmailList, {
      message: "All billing emails must be valid and unique",
    })
    .openapi({
      description:
        "Billing email addresses of the merchant (comma-separated for multiple)",
      example: "finance@acme.com, accounting@acme.com",
    }),
  country: z.string().nullable().optional().openapi({
    description: "Country name where the merchant is located",
    example: "United States",
  }),
  addressLine1: z.string().nullable().optional().openapi({
    description: "First line of the merchant's address",
    example: "123 Main Street",
  }),
  addressLine2: z.string().nullable().optional().openapi({
    description:
      "Second line of the merchant's address (suite, apartment, etc.)",
    example: "Suite 400",
  }),
  city: z.string().nullable().optional().openapi({
    description: "City where the merchant is located",
    example: "San Francisco",
  }),
  state: z.string().nullable().optional().openapi({
    description: "State or province where the merchant is located",
    example: "California",
  }),
  zip: z.string().nullable().optional().openapi({
    description: "ZIP or postal code of the merchant's address",
    example: "94105",
  }),
  phone: z.string().nullable().optional().openapi({
    description: "Primary phone number of the merchant",
    example: "+1-555-123-4567",
  }),
  website: z.string().nullable().optional().openapi({
    description: "Website URL of the merchant",
    example: "https://acme.com",
  }),
  note: z.string().nullable().optional().openapi({
    description: "Internal notes about the merchant for team reference",
    example: "Preferred contact method is email. Large enterprise client.",
  }),
  vatNumber: z.string().nullable().optional().openapi({
    description: "VAT (Value Added Tax) number of the merchant",
    example: "US123456789",
  }),
  countryCode: z.string().nullable().optional().openapi({
    description: "Country code in ISO 3166-1 alpha-2 format",
    example: "US",
  }),
  contact: z.string().nullable().optional().openapi({
    description: "Primary contact person's name at the merchant organization",
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
        "Array of tags to associate with the merchant for categorization",
      example: [
        { id: "e7a9c1a2-4c2a-4e7a-9c1a-2b7c1e24c2a4", name: "VIP" },
        { id: "f1b2c3d4-5678-4e7a-9c1a-2b7c1e24c2a4", name: "Enterprise" },
      ],
    }),
});

export const toggleMerchantPortalSchema = z.object({
  merchantId: z.string().uuid().openapi({
    description: "Unique identifier of the merchant",
    example: "b3b7c1e2-4c2a-4e7a-9c1a-2b7c1e24c2a4",
  }),
  enabled: z.boolean().openapi({
    description: "Whether to enable or disable the merchant portal",
    example: true,
  }),
});

export const getMerchantByPortalIdSchema = z.object({
  portalId: z.string().openapi({
    description: "Short ID for the merchant portal URL",
    example: "X7kM9nPq",
    param: {
      in: "path",
      name: "portalId",
    },
  }),
});

export const getPortalDealsSchema = z.object({
  portalId: z.string().openapi({
    description: "Short ID for the merchant portal URL",
    example: "X7kM9nPq",
  }),
  cursor: z.string().nullish().openapi({
    description: "Cursor for pagination",
    example: "10",
  }),
  pageSize: z.number().min(1).max(50).optional().openapi({
    description: "Number of deals to return per page",
    example: 10,
  }),
});
