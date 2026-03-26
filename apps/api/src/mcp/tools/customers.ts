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
import {
  mcpCustomerDetailSchema,
  mcpCustomerListItemSchema,
  sanitize,
  sanitizeArray,
} from "../schemas";
import {
  DESTRUCTIVE_ANNOTATIONS,
  hasScope,
  READ_ONLY_ANNOTATIONS,
  type RegisterTools,
  WRITE_ANNOTATIONS,
} from "../types";
import { truncateListResponse, withErrorHandling } from "../utils";

export const registerCustomerTools: RegisterTools = (server, ctx) => {
  const { db, teamId } = ctx;

  const hasReadScope = hasScope(ctx, "customers.read");
  const hasWriteScope = hasScope(ctx, "customers.write");

  if (!hasReadScope && !hasWriteScope) {
    return;
  }

  if (hasReadScope) {
    const { sort: _sort, ...customersListFields } = getCustomersSchema.shape;

    server.registerTool(
      "customers_list",
      {
        title: "List Customers",
        description:
          "List customers with optional free-text search and sorting. Returns paginated results (default 25) with name, email, contact info, and address. Use cursor from the response to fetch the next page.",
        inputSchema: {
          ...customersListFields,
          sortBy: z
            .enum([
              "name",
              "created_at",
              "contact",
              "email",
              "invoices",
              "projects",
              "tags",
              "industry",
              "country",
              "total_revenue",
              "outstanding",
              "last_invoice",
            ])
            .optional()
            .describe("Column to sort by"),
          sortDirection: z
            .enum(["asc", "desc"])
            .optional()
            .describe("Sort direction"),
        },
        outputSchema: {
          meta: z.looseObject({
            cursor: z.string().nullable().optional(),
            hasNextPage: z.boolean(),
            hasPreviousPage: z.boolean(),
          }),
          data: z.array(z.record(z.string(), z.any())),
        },
        annotations: READ_ONLY_ANNOTATIONS,
      },
      withErrorHandling(async (params) => {
        const sort = params.sortBy
          ? [params.sortBy, params.sortDirection ?? "desc"]
          : null;

        const result = await getCustomers(db, {
          teamId,
          cursor: params.cursor ?? null,
          pageSize: params.pageSize ?? 25,
          q: params.q ?? null,
          sort,
        });

        const response = {
          meta: {
            cursor: result.meta.cursor ?? null,
            hasNextPage: result.meta.hasNextPage,
            hasPreviousPage: result.meta.hasPreviousPage,
          },
          data: sanitizeArray(mcpCustomerListItemSchema, result.data ?? []),
        };

        const { text, structuredContent } = truncateListResponse(response);

        return {
          content: [{ type: "text", text }],
          structuredContent,
        };
      }, "Failed to list customers"),
    );

    server.registerTool(
      "customers_get",
      {
        title: "Get Customer",
        description:
          "Get full customer details by ID including name, email, billing email, phone, website, contact person, full address, VAT number, tags, and notes.",
        inputSchema: {
          id: getCustomerByIdSchema.shape.id,
        },
        outputSchema: {
          data: z.record(z.string(), z.any()),
        },
        annotations: READ_ONLY_ANNOTATIONS,
      },
      withErrorHandling(async ({ id }) => {
        const result = await getCustomerById(db, { id, teamId });

        if (!result) {
          return {
            content: [{ type: "text", text: "Customer not found" }],
            isError: true,
          };
        }

        const clean = sanitize(mcpCustomerDetailSchema, result);

        return {
          content: [{ type: "text", text: JSON.stringify(clean) }],
          structuredContent: { data: clean },
        };
      }, "Failed to get customer"),
    );
  }

  if (hasWriteScope) {
    server.registerTool(
      "customers_create",
      {
        title: "Create Customer",
        description:
          "Create a new customer. Name is required; all other fields (email, phone, address, VAT, etc.) are optional. Returns the created customer object.",
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
        try {
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

          const clean = sanitize(mcpCustomerDetailSchema, result);

          return {
            content: [{ type: "text", text: JSON.stringify(clean) }],
            structuredContent: { data: clean },
          };
        } catch (error) {
          return {
            content: [
              {
                type: "text",
                text:
                  error instanceof Error
                    ? error.message
                    : "Failed to create customer",
              },
            ],
            isError: true,
          };
        }
      },
    );

    server.registerTool(
      "customers_update",
      {
        title: "Update Customer",
        description:
          "Update an existing customer. Provide the customer ID and only the fields you want to change. Unspecified fields keep their current values.",
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
        try {
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

          const clean = sanitize(mcpCustomerDetailSchema, result);

          return {
            content: [{ type: "text", text: JSON.stringify(clean) }],
            structuredContent: { data: clean },
          };
        } catch (error) {
          return {
            content: [
              {
                type: "text",
                text:
                  error instanceof Error
                    ? error.message
                    : "Failed to update customer",
              },
            ],
            isError: true,
          };
        }
      },
    );

    server.registerTool(
      "customers_delete",
      {
        title: "Delete Customer",
        description:
          "Permanently delete a customer by ID. Will fail if the customer has associated invoices or projects — remove those first.",
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
                text: JSON.stringify({ success: true, deleted: result }),
              },
            ],
            structuredContent: { success: true, deleted: result },
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
