import {
  deleteSyndicatorSchema,
  getSyndicatorByIdSchema,
  getSyndicatorsSchema,
  upsertSyndicatorSchema,
  getSyndicatorDealsSchema,
} from "@api/schemas/syndication";
import {
  deleteSyndicator,
  getSyndicatorById,
  getSyndicators,
  getSyndicatorDeals,
  upsertSyndicator,
} from "@midday/db/queries";
import { z } from "zod";
import { READ_ONLY_ANNOTATIONS, type RegisterTools, hasScope } from "../types";

const WRITE_ANNOTATIONS = {
  readOnlyHint: false,
  destructiveHint: false,
  idempotentHint: false,
  openWorldHint: false,
} as const;

const DESTRUCTIVE_ANNOTATIONS = {
  readOnlyHint: false,
  destructiveHint: true,
  idempotentHint: true,
  openWorldHint: false,
} as const;

export const registerSyndicatorTools: RegisterTools = (server, ctx) => {
  const { db, teamId } = ctx;

  const hasReadScope = hasScope(ctx, "merchants.read");
  const hasWriteScope = hasScope(ctx, "merchants.write");

  if (!hasReadScope && !hasWriteScope) {
    return;
  }

  // ==========================================
  // READ TOOLS
  // ==========================================

  if (hasReadScope) {
    server.registerTool(
      "syndicators_list",
      {
        title: "List Syndicators",
        description:
          "List syndication partners with filtering and search. Use this to find syndicator information.",
        inputSchema: getSyndicatorsSchema.shape,
        annotations: READ_ONLY_ANNOTATIONS,
      },
      async (params) => {
        const result = await getSyndicators(db, {
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
      "syndicators_get",
      {
        title: "Get Syndicator",
        description:
          "Get a specific syndicator by their ID with full details",
        inputSchema: {
          id: getSyndicatorByIdSchema.shape.id,
        },
        annotations: READ_ONLY_ANNOTATIONS,
      },
      async ({ id }) => {
        const result = await getSyndicatorById(db, { id, teamId });

        if (!result) {
          return {
            content: [{ type: "text", text: "Syndicator not found" }],
            isError: true,
          };
        }

        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      },
    );

    server.registerTool(
      "syndicators_deals",
      {
        title: "Get Syndicator Deals",
        description:
          "Get all deals a syndicator participates in with proportional metrics (balance, payments scaled by ownership %)",
        inputSchema: {
          syndicatorId: getSyndicatorDealsSchema.shape.syndicatorId,
        },
        annotations: READ_ONLY_ANNOTATIONS,
      },
      async ({ syndicatorId }) => {
        const result = await getSyndicatorDeals(db, {
          syndicatorId,
          teamId,
        });

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
      "syndicators_create",
      {
        title: "Create Syndicator",
        description:
          "Create a new syndication partner with name, email, and optional address/contact details.",
        inputSchema: {
          name: upsertSyndicatorSchema.shape.name,
          email: upsertSyndicatorSchema.shape.email,
          phone: upsertSyndicatorSchema.shape.phone,
          companyName: upsertSyndicatorSchema.shape.companyName,
          website: upsertSyndicatorSchema.shape.website,
          addressLine1: upsertSyndicatorSchema.shape.addressLine1,
          addressLine2: upsertSyndicatorSchema.shape.addressLine2,
          city: upsertSyndicatorSchema.shape.city,
          state: upsertSyndicatorSchema.shape.state,
          zip: upsertSyndicatorSchema.shape.zip,
          country: upsertSyndicatorSchema.shape.country,
          note: upsertSyndicatorSchema.shape.note,
        },
        annotations: WRITE_ANNOTATIONS,
      },
      async (params) => {
        const result = await upsertSyndicator(db, {
          teamId,
          name: params.name,
          email: params.email,
          phone: params.phone,
          companyName: params.companyName,
          website: params.website,
          addressLine1: params.addressLine1,
          addressLine2: params.addressLine2,
          city: params.city,
          state: params.state,
          zip: params.zip,
          country: params.country,
          note: params.note,
        });

        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      },
    );

    server.registerTool(
      "syndicators_update",
      {
        title: "Update Syndicator",
        description:
          "Update an existing syndicator. Provide the syndicator ID and fields to update.",
        inputSchema: {
          id: z
            .string()
            .uuid()
            .describe("The ID of the syndicator to update"),
          name: upsertSyndicatorSchema.shape.name.optional(),
          email: z.string().email().optional(),
          phone: upsertSyndicatorSchema.shape.phone,
          companyName: upsertSyndicatorSchema.shape.companyName,
          website: upsertSyndicatorSchema.shape.website,
          addressLine1: upsertSyndicatorSchema.shape.addressLine1,
          addressLine2: upsertSyndicatorSchema.shape.addressLine2,
          city: upsertSyndicatorSchema.shape.city,
          state: upsertSyndicatorSchema.shape.state,
          zip: upsertSyndicatorSchema.shape.zip,
          country: upsertSyndicatorSchema.shape.country,
          note: upsertSyndicatorSchema.shape.note,
        },
        annotations: WRITE_ANNOTATIONS,
      },
      async (params) => {
        const existing = await getSyndicatorById(db, {
          id: params.id,
          teamId,
        });

        if (!existing) {
          return {
            content: [{ type: "text", text: "Syndicator not found" }],
            isError: true,
          };
        }

        const result = await upsertSyndicator(db, {
          id: params.id,
          teamId,
          name: params.name ?? existing.name,
          email: params.email ?? existing.email,
          phone: params.phone ?? existing.phone,
          companyName: params.companyName ?? existing.companyName,
          website: params.website ?? existing.website,
          addressLine1: params.addressLine1 ?? existing.addressLine1,
          addressLine2: params.addressLine2 ?? existing.addressLine2,
          city: params.city ?? existing.city,
          state: params.state ?? existing.state,
          zip: params.zip ?? existing.zip,
          country: params.country ?? existing.country,
          note: params.note ?? existing.note,
        });

        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      },
    );

    server.registerTool(
      "syndicators_delete",
      {
        title: "Delete Syndicator",
        description:
          "Delete a syndicator by their ID. This will also remove all syndication participations.",
        inputSchema: {
          id: deleteSyndicatorSchema.shape.id,
        },
        annotations: DESTRUCTIVE_ANNOTATIONS,
      },
      async ({ id }) => {
        try {
          const result = await deleteSyndicator(db, { id, teamId });

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
                    : "Failed to delete syndicator",
              },
            ],
            isError: true,
          };
        }
      },
    );
  }
};
