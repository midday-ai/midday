import {
  deleteCustomerSchema,
  getCustomerByIdSchema,
  getCustomersSchema,
  upsertCustomerSchema,
} from "@api/schemas/customers";
import {
  deleteCustomer,
  getCustomerById,
  getCustomers,
  upsertCustomer,
} from "@midday/db/queries";
import { z } from "zod";
import { hasScope, READ_ONLY_ANNOTATIONS, type RegisterTools } from "../types";

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

export const registerCustomerTools: RegisterTools = (server, ctx) => {
  const { db, teamId } = ctx;

  // Check scopes
  const hasReadScope = hasScope(ctx, "customers.read");
  const hasWriteScope = hasScope(ctx, "customers.write");

  // Skip if user has no customer scopes
  if (!hasReadScope && !hasWriteScope) {
    return;
  }

  // ==========================================
  // READ TOOLS
  // ==========================================

  if (hasReadScope) {
    server.registerTool(
      "customers_list",
      {
        title: "List Customers",
        description:
          "List customers with filtering and search. Use this to find customer information.",
        inputSchema: getCustomersSchema.shape,
        annotations: READ_ONLY_ANNOTATIONS,
      },
      async (params) => {
        const result = await getCustomers(db, {
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
      "customers_get",
      {
        title: "Get Customer",
        description: "Get a specific customer by their ID with full details",
        inputSchema: {
          id: getCustomerByIdSchema.shape.id,
        },
        annotations: READ_ONLY_ANNOTATIONS,
      },
      async ({ id }) => {
        const result = await getCustomerById(db, { id, teamId });

        if (!result) {
          return {
            content: [{ type: "text", text: "Customer not found" }],
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
      "customers_create",
      {
        title: "Create Customer",
        description:
          "Create a new customer with name, email, and optional address/contact details.",
        inputSchema: {
          name: upsertCustomerSchema.shape.name,
          email: upsertCustomerSchema.shape.email,
          billingEmail: upsertCustomerSchema.shape.billingEmail,
          phone: upsertCustomerSchema.shape.phone,
          website: upsertCustomerSchema.shape.website,
          contact: upsertCustomerSchema.shape.contact,
          country: upsertCustomerSchema.shape.country,
          countryCode: upsertCustomerSchema.shape.countryCode,
          addressLine1: upsertCustomerSchema.shape.addressLine1,
          addressLine2: upsertCustomerSchema.shape.addressLine2,
          city: upsertCustomerSchema.shape.city,
          state: upsertCustomerSchema.shape.state,
          zip: upsertCustomerSchema.shape.zip,
          vatNumber: upsertCustomerSchema.shape.vatNumber,
          note: upsertCustomerSchema.shape.note,
          tags: upsertCustomerSchema.shape.tags,
        },
        annotations: WRITE_ANNOTATIONS,
      },
      async (params) => {
        const result = await upsertCustomer(db, {
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
      "customers_update",
      {
        title: "Update Customer",
        description:
          "Update an existing customer. Provide the customer ID and fields to update.",
        inputSchema: {
          id: z.string().uuid().describe("The ID of the customer to update"),
          name: upsertCustomerSchema.shape.name.optional(),
          email: z.string().email().optional(),
          billingEmail: upsertCustomerSchema.shape.billingEmail,
          phone: upsertCustomerSchema.shape.phone,
          website: upsertCustomerSchema.shape.website,
          contact: upsertCustomerSchema.shape.contact,
          country: upsertCustomerSchema.shape.country,
          countryCode: upsertCustomerSchema.shape.countryCode,
          addressLine1: upsertCustomerSchema.shape.addressLine1,
          addressLine2: upsertCustomerSchema.shape.addressLine2,
          city: upsertCustomerSchema.shape.city,
          state: upsertCustomerSchema.shape.state,
          zip: upsertCustomerSchema.shape.zip,
          vatNumber: upsertCustomerSchema.shape.vatNumber,
          note: upsertCustomerSchema.shape.note,
          tags: upsertCustomerSchema.shape.tags,
        },
        annotations: WRITE_ANNOTATIONS,
      },
      async (params) => {
        // First check if customer exists
        const existing = await getCustomerById(db, {
          id: params.id,
          teamId,
        });

        if (!existing) {
          return {
            content: [{ type: "text", text: "Customer not found" }],
            isError: true,
          };
        }

        const result = await upsertCustomer(db, {
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
      "customers_delete",
      {
        title: "Delete Customer",
        description:
          "Delete a customer by their ID. This will fail if the customer has associated invoices or projects.",
        inputSchema: {
          id: deleteCustomerSchema.shape.id,
        },
        annotations: DESTRUCTIVE_ANNOTATIONS,
      },
      async ({ id }) => {
        try {
          const result = await deleteCustomer(db, { id, teamId });

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
                    : "Failed to delete customer",
              },
            ],
            isError: true,
          };
        }
      },
    );
  }
};
