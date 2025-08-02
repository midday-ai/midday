import { z } from "@hono/zod-openapi";

// Create OAuth Application Schema
export const createOAuthApplicationSchema = z.object({
  name: z.string().min(1).max(255).openapi({
    description: "The name of the OAuth application",
    example: "My Raycast Extension",
  }),
  description: z.string().optional().openapi({
    description: "The description of the OAuth application",
    example: "A Raycast extension for managing transactions",
  }),
  overview: z.string().optional().openapi({
    description: "Detailed overview of the OAuth application",
    example:
      "This application provides advanced transaction management features including:\n- Real-time sync\n- Advanced filtering",
  }),
  developerName: z.string().optional().openapi({
    description: "The person or company developing this application",
    example: "Acme Corp",
  }),
  logoUrl: z.string().url().optional().openapi({
    description: "URL to the application's logo",
    example: "https://example.com/logo.png",
  }),
  website: z.string().url().optional().openapi({
    description: "The website URL of the OAuth application",
    example: "https://myapp.com",
  }),
  installUrl: z.string().url().optional().openapi({
    description: "An optional URL for installing the application",
    example: "https://myapp.com/install",
  }),
  screenshots: z
    .array(z.string().url())
    .max(4)
    .optional()
    .openapi({
      description:
        "Up to 4 screenshots that will be displayed on the apps page",
      example: [
        "https://example.com/screenshot1.png",
        "https://example.com/screenshot2.png",
      ],
    }),
  redirectUris: z
    .array(z.string().url())
    .min(1)
    .openapi({
      description: "Array of redirect URIs for OAuth callbacks",
      example: ["https://myapp.com/callback"],
    }),
  scopes: z
    .array(z.string())
    .default([])
    .openapi({
      description: "Array of scopes requested by the application",
      example: ["transactions.read", "invoices.read"],
    }),
  isPublic: z.boolean().default(false).openapi({
    description: "Whether this is a public OAuth application",
    example: false,
  }),
});

// Update OAuth Application Schema
export const updateOAuthApplicationSchema = z.object({
  id: z.string().uuid().openapi({
    description: "The unique identifier of the OAuth application",
    example: "123e4567-e89b-12d3-a456-426614174000",
  }),
  name: z.string().min(1).max(255).optional().openapi({
    description: "The name of the OAuth application",
    example: "My Updated Raycast Extension",
  }),
  description: z.string().optional().openapi({
    description: "The description of the OAuth application",
    example: "An updated Raycast extension for managing transactions",
  }),
  overview: z.string().optional().openapi({
    description: "Detailed overview of the OAuth application",
    example:
      "This updated application now includes:\n- Enhanced security\n- Better performance",
  }),
  developerName: z.string().optional().openapi({
    description: "The person or company developing this application",
    example: "Acme Corp",
  }),
  logoUrl: z.string().url().optional().openapi({
    description: "URL to the application's logo",
    example: "https://example.com/updated-logo.png",
  }),
  website: z.string().url().optional().openapi({
    description: "The website URL of the OAuth application",
    example: "https://myapp.com",
  }),
  installUrl: z.string().url().optional().openapi({
    description: "An optional URL for installing the application",
    example: "https://myapp.com/install",
  }),
  screenshots: z
    .array(z.string().url())
    .max(4)
    .optional()
    .openapi({
      description:
        "Up to 4 screenshots that will be displayed on the apps page",
      example: [
        "https://example.com/screenshot1.png",
        "https://example.com/screenshot2.png",
      ],
    }),
  redirectUris: z
    .array(z.string().url())
    .min(1)
    .optional()
    .openapi({
      description: "Array of redirect URIs for OAuth callbacks",
      example: ["https://myapp.com/callback"],
    }),
  scopes: z
    .array(z.string())
    .optional()
    .openapi({
      description: "Array of scopes requested by the application",
      example: ["transactions.read", "invoices.read"],
    }),
  isPublic: z.boolean().optional().openapi({
    description: "Whether this is a public OAuth application",
    example: false,
  }),
  active: z.boolean().optional().openapi({
    description: "Whether the OAuth application is active",
    example: true,
  }),
});

// Get OAuth Application Schema
export const getOAuthApplicationSchema = z.object({
  id: z
    .string()
    .uuid()
    .openapi({
      description: "The unique identifier of the OAuth application",
      example: "123e4567-e89b-12d3-a456-426614174000",
      param: {
        in: "path",
        name: "id",
        required: true,
      },
    }),
});

// Delete OAuth Application Schema
export const deleteOAuthApplicationSchema = z.object({
  id: z.string().uuid().openapi({
    description: "The unique identifier of the OAuth application to delete",
    example: "123e4567-e89b-12d3-a456-426614174000",
  }),
});

// Regenerate Client Secret Schema
export const regenerateClientSecretSchema = z.object({
  id: z.string().uuid().openapi({
    description: "The unique identifier of the OAuth application",
    example: "123e4567-e89b-12d3-a456-426614174000",
  }),
});

// OAuth Application Response Schema
export const oauthApplicationResponseSchema = z.object({
  id: z.string().uuid().openapi({
    description: "Unique identifier of the OAuth application",
    example: "123e4567-e89b-12d3-a456-426614174000",
  }),
  name: z.string().openapi({
    description: "Name of the OAuth application",
    example: "My Raycast Extension",
  }),
  description: z.string().nullable().openapi({
    description: "Description of the OAuth application",
    example: "A Raycast extension for managing transactions",
  }),
  overview: z.string().nullable().openapi({
    description: "Detailed overview of the OAuth application",
    example:
      "This application provides advanced transaction management features including:\n- Real-time sync\n- Advanced filtering",
  }),
  developerName: z.string().nullable().openapi({
    description: "The person or company developing this application",
    example: "Acme Corp",
  }),
  logoUrl: z.string().nullable().openapi({
    description: "URL to the application's logo",
    example: "https://example.com/logo.png",
  }),
  website: z.string().nullable().openapi({
    description: "Website URL of the OAuth application",
    example: "https://myapp.com",
  }),
  installUrl: z.string().nullable().openapi({
    description: "An optional URL for installing the application",
    example: "https://myapp.com/install",
  }),
  screenshots: z.array(z.string().url()).openapi({
    description: "Up to 4 screenshots that will be displayed on the apps page",
    example: [
      "https://example.com/screenshot1.png",
      "https://example.com/screenshot2.png",
    ],
  }),
  redirectUris: z.array(z.string()).openapi({
    description: "Array of redirect URIs for OAuth callbacks",
    example: ["https://myapp.com/callback"],
  }),
  clientId: z.string().openapi({
    description: "Client ID of the OAuth application",
    example: "mid_client_abcdef123456789",
  }),
  scopes: z.array(z.string()).openapi({
    description: "Array of scopes for the application",
    example: ["transactions.read", "invoices.read"],
  }),
  isPublic: z.boolean().openapi({
    description: "Whether this is a public OAuth application",
    example: false,
  }),
  active: z.boolean().openapi({
    description: "Whether the OAuth application is active",
    example: true,
  }),
  createdAt: z.string().openapi({
    description: "ISO 8601 timestamp when the application was created",
    example: "2024-01-01T00:00:00Z",
  }),
  updatedAt: z.string().openapi({
    description: "ISO 8601 timestamp when the application was last updated",
    example: "2024-01-01T00:00:00Z",
  }),
});

// OAuth Applications List Response Schema
export const oauthApplicationsListResponseSchema = z.object({
  data: z.array(oauthApplicationResponseSchema).openapi({
    description: "Array of OAuth applications",
  }),
});

// Client Secret Response Schema
export const clientSecretResponseSchema = z.object({
  clientSecret: z.string().openapi({
    description: "The new client secret",
    example: "mid_secret_abcdef123456789",
  }),
});

export const authorizeOAuthApplicationSchema = z.object({
  clientId: z.string(),
  decision: z.enum(["allow", "deny"]),
  scopes: z.array(z.string()),
  redirectUri: z.string().url(),
  state: z.string().optional(),
  codeChallenge: z.string().optional(),
  teamId: z.string().uuid(),
});

export const getApplicationInfoSchema = z.object({
  clientId: z.string(),
  redirectUri: z.string().url(),
  scope: z.string(),
  state: z.string().optional(),
});

export const updateApprovalStatusSchema = z
  .object({
    id: z.string().uuid().openapi({
      description: "The unique identifier of the OAuth application",
      example: "123e4567-e89b-12d3-a456-426614174000",
    }),
    status: z.enum(["draft", "pending"]).openapi({
      description: "The approval status of the OAuth application",
      example: "pending",
    }),
  })
  .openapi({
    description: "Update the approval status of an OAuth application",
    example: {
      id: "123e4567-e89b-12d3-a456-426614174000",
      status: "pending",
    },
  });
