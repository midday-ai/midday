import {
  deleteMerchantSchema,
  getMerchantByIdSchema,
  getMerchantsSchema,
  upsertMerchantSchema,
} from "@api/schemas/merchants";
import {
  deleteMerchant,
  getMerchantById,
  getMerchants,
  upsertMerchant,
} from "@midday/db/queries";
import { z } from "zod";
import { READ_ONLY_ANNOTATIONS, type RegisterTools, hasScope } from "../types";

// Annotations for write operations
const WRITE_ANNOTATIONS = {
  readOnlyHint: false,
  destructiveHint: false,
  idempotentHint: false,
  openWorldHint: false,
} as const;

// Annotations for destructive operations
const DESTRUCTIVE_ANNOTATIONS = {
  readOnlyHint: false,
  destructiveHint: true,
  idempotentHint: true,
  openWorldHint: false,
} as const;

export const registerMerchantTools: RegisterTools = (server, ctx) => {
  const { db, teamId } = ctx;

  // Check scopes
  const hasReadScope = hasScope(ctx, "merchants.read");
  const hasWriteScope = hasScope(ctx, "merchants.write");

  // Skip if user has no merchant scopes
  if (!hasReadScope && !hasWriteScope) {
    return;
  }

  // ==========================================
  // READ TOOLS
  // ==========================================

  if (hasReadScope) {
    server.registerTool(
      "merchants_list",
      {
        title: "List Merchants",
        description:
          "List merchants with filtering and search. Use this to find merchant information.",
        inputSchema: getMerchantsSchema.shape,
        annotations: READ_ONLY_ANNOTATIONS,
      },
      async (params) => {
        const result = await getMerchants(db, {
          teamId,
          cursor: params.cursor ?? null,
          pageSize: params.pageSize ?? 25,
          q: params.q ?? null,
          sort: params.sort ?? null,
        });

        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      },
    );

    server.registerTool(
      "merchants_get",
      {
        title: "Get Merchant",
        description: "Get a specific merchant by their ID with full details",
        inputSchema: {
          id: getMerchantByIdSchema.shape.id,
        },
        annotations: READ_ONLY_ANNOTATIONS,
      },
      async ({ id }) => {
        const result = await getMerchantById(db, { id, teamId });

        if (!result) {
          return {
            content: [{ type: "text", text: "Merchant not found" }],
            isError: true,
          };
        }

        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      },
    );
  }

  // ==========================================
  // WRITE TOOLS
  // ==========================================

  if (hasWriteScope) {
    server.registerTool(
      "merchants_create",
      {
        title: "Create Merchant",
        description:
          "Create a new merchant with name, email, and optional address/contact details.",
        inputSchema: {
          name: upsertMerchantSchema.shape.name,
          email: upsertMerchantSchema.shape.email,
          billingEmail: upsertMerchantSchema.shape.billingEmail,
          phone: upsertMerchantSchema.shape.phone,
          website: upsertMerchantSchema.shape.website,
          contact: upsertMerchantSchema.shape.contact,
          country: upsertMerchantSchema.shape.country,
          countryCode: upsertMerchantSchema.shape.countryCode,
          addressLine1: upsertMerchantSchema.shape.addressLine1,
          addressLine2: upsertMerchantSchema.shape.addressLine2,
          city: upsertMerchantSchema.shape.city,
          state: upsertMerchantSchema.shape.state,
          zip: upsertMerchantSchema.shape.zip,
          vatNumber: upsertMerchantSchema.shape.vatNumber,
          note: upsertMerchantSchema.shape.note,
          tags: upsertMerchantSchema.shape.tags,
        },
        annotations: WRITE_ANNOTATIONS,
      },
      async (params) => {
        const result = await upsertMerchant(db, {
          teamId,
          name: params.name,
          email: params.email,
          billingEmail: params.billingEmail,
          phone: params.phone,
          website: params.website,
          contact: params.contact,
          country: params.country,
          countryCode: params.countryCode,
          addressLine1: params.addressLine1,
          addressLine2: params.addressLine2,
          city: params.city,
          state: params.state,
          zip: params.zip,
          vatNumber: params.vatNumber,
          note: params.note,
          tags: params.tags,
        });

        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      },
    );

    server.registerTool(
      "merchants_update",
      {
        title: "Update Merchant",
        description:
          "Update an existing merchant. Provide the merchant ID and fields to update.",
        inputSchema: {
          id: z.string().uuid().describe("The ID of the merchant to update"),
          name: upsertMerchantSchema.shape.name.optional(),
          email: z.string().email().optional(),
          billingEmail: upsertMerchantSchema.shape.billingEmail,
          phone: upsertMerchantSchema.shape.phone,
          website: upsertMerchantSchema.shape.website,
          contact: upsertMerchantSchema.shape.contact,
          country: upsertMerchantSchema.shape.country,
          countryCode: upsertMerchantSchema.shape.countryCode,
          addressLine1: upsertMerchantSchema.shape.addressLine1,
          addressLine2: upsertMerchantSchema.shape.addressLine2,
          city: upsertMerchantSchema.shape.city,
          state: upsertMerchantSchema.shape.state,
          zip: upsertMerchantSchema.shape.zip,
          vatNumber: upsertMerchantSchema.shape.vatNumber,
          note: upsertMerchantSchema.shape.note,
          tags: upsertMerchantSchema.shape.tags,
        },
        annotations: WRITE_ANNOTATIONS,
      },
      async (params) => {
        // First check if merchant exists
        const existing = await getMerchantById(db, {
          id: params.id,
          teamId,
        });

        if (!existing) {
          return {
            content: [{ type: "text", text: "Merchant not found" }],
            isError: true,
          };
        }

        const result = await upsertMerchant(db, {
          id: params.id,
          teamId,
          name: params.name ?? existing.name,
          email: params.email ?? existing.email,
          billingEmail: params.billingEmail ?? existing.billingEmail,
          phone: params.phone ?? existing.phone,
          website: params.website ?? existing.website,
          contact: params.contact ?? existing.contact,
          country: params.country ?? existing.country,
          countryCode: params.countryCode ?? existing.countryCode,
          addressLine1: params.addressLine1 ?? existing.addressLine1,
          addressLine2: params.addressLine2 ?? existing.addressLine2,
          city: params.city ?? existing.city,
          state: params.state ?? existing.state,
          zip: params.zip ?? existing.zip,
          vatNumber: params.vatNumber ?? existing.vatNumber,
          note: params.note ?? existing.note,
          tags: params.tags ?? existing.tags,
        });

        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      },
    );

    server.registerTool(
      "merchants_delete",
      {
        title: "Delete Merchant",
        description:
          "Delete a merchant by their ID. This will fail if the merchant has associated invoices or projects.",
        inputSchema: {
          id: deleteMerchantSchema.shape.id,
        },
        annotations: DESTRUCTIVE_ANNOTATIONS,
      },
      async ({ id }) => {
        try {
          const result = await deleteMerchant(db, { id, teamId });

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  { success: true, deleted: result },
                  null,
                  2,
                ),
              },
            ],
          };
        } catch (error) {
          return {
            content: [
              {
                type: "text",
                text:
                  error instanceof Error
                    ? error.message
                    : "Failed to delete merchant",
              },
            ],
            isError: true,
          };
        }
      },
    );
  }
};
