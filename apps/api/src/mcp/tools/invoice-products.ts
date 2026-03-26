import {
  createInvoiceProductSchema,
  deleteInvoiceProductSchema,
  getInvoiceProductSchema,
  updateInvoiceProductSchema,
} from "@api/schemas/invoice";
import {
  createInvoiceProduct,
  deleteInvoiceProduct,
  getInvoiceProductById,
  getInvoiceProducts,
  updateInvoiceProduct,
} from "@midday/db/queries";
import { z } from "zod";
import { mcpInvoiceProductSchema, sanitize, sanitizeArray } from "../schemas";
import {
  DESTRUCTIVE_ANNOTATIONS,
  hasScope,
  READ_ONLY_ANNOTATIONS,
  type RegisterTools,
  WRITE_ANNOTATIONS,
} from "../types";
import { withErrorHandling } from "../utils";

export const registerInvoiceProductTools: RegisterTools = (server, ctx) => {
  const { db, teamId, userId } = ctx;

  const hasReadScope = hasScope(ctx, "invoices.read");
  const hasWriteScope = hasScope(ctx, "invoices.write");

  if (!hasReadScope && !hasWriteScope) {
    return;
  }

  if (hasReadScope) {
    server.registerTool(
      "invoice_products_list",
      {
        title: "List Invoice Products",
        description:
          "List saved invoice line item products (product catalog). Sort by popularity (most used) or recency. Filter by currency or include inactive products. Use these products when creating invoices for consistent line items.",
        inputSchema: {
          sortBy: z
            .enum(["popular", "recent"])
            .optional()
            .describe("Sort by popularity (default) or most recently used"),
          limit: z.coerce
            .number()
            .min(1)
            .max(100)
            .optional()
            .describe("Max products to return (default 50)"),
          includeInactive: z
            .boolean()
            .optional()
            .describe("Include inactive products (default false)"),
          currency: z.string().optional().describe("Filter by currency code"),
        },
        outputSchema: {
          data: z.array(z.record(z.string(), z.any())),
        },
        annotations: READ_ONLY_ANNOTATIONS,
      },
      withErrorHandling(async (params) => {
        const result = await getInvoiceProducts(db, teamId, {
          sortBy: params.sortBy,
          limit: params.limit,
          includeInactive: params.includeInactive,
          currency: params.currency,
        });

        const clean = sanitizeArray(mcpInvoiceProductSchema, result ?? []);

        return {
          content: [{ type: "text" as const, text: JSON.stringify(clean) }],
          structuredContent: { data: clean },
        };
      }, "Failed to list invoice products"),
    );

    server.registerTool(
      "invoice_products_get",
      {
        title: "Get Invoice Product",
        description:
          "Get a single invoice product by ID with name, description, price, currency, unit, tax rate, and usage statistics.",
        inputSchema: {
          id: getInvoiceProductSchema.shape.id,
        },
        outputSchema: {
          data: z.record(z.string(), z.any()),
        },
        annotations: READ_ONLY_ANNOTATIONS,
      },
      withErrorHandling(async ({ id }) => {
        const result = await getInvoiceProductById(db, id, teamId);

        if (!result) {
          return {
            content: [
              { type: "text" as const, text: "Invoice product not found" },
            ],
            isError: true,
          };
        }

        const clean = sanitize(mcpInvoiceProductSchema, result);

        return {
          content: [{ type: "text" as const, text: JSON.stringify(clean) }],
          structuredContent: { data: clean },
        };
      }, "Failed to get invoice product"),
    );
  }

  if (hasWriteScope) {
    server.registerTool(
      "invoice_products_create",
      {
        title: "Create Invoice Product",
        description:
          "Create a reusable invoice line item product. Name is required. Set price, currency, unit, and tax rate for quick insertion into future invoices.",
        inputSchema: {
          name: createInvoiceProductSchema.shape.name,
          description: createInvoiceProductSchema.shape.description,
          price: createInvoiceProductSchema.shape.price,
          currency: createInvoiceProductSchema.shape.currency,
          unit: createInvoiceProductSchema.shape.unit,
          taxRate: createInvoiceProductSchema.shape.taxRate,
          isActive: createInvoiceProductSchema.shape.isActive,
        },
        annotations: WRITE_ANNOTATIONS,
      },
      async (params) => {
        try {
          const result = await createInvoiceProduct(db, {
            teamId,
            createdBy: userId,
            name: params.name,
            description: params.description,
            price: params.price,
            currency: params.currency,
            unit: params.unit,
            taxRate: params.taxRate,
            isActive: params.isActive,
          });

          const clean = sanitize(mcpInvoiceProductSchema, result);

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
                    : "Failed to create invoice product",
              },
            ],
            isError: true,
          };
        }
      },
    );

    server.registerTool(
      "invoice_products_update",
      {
        title: "Update Invoice Product",
        description:
          "Update an existing invoice product. Provide the product ID and only the fields to change.",
        inputSchema: {
          id: updateInvoiceProductSchema.shape.id,
          name: updateInvoiceProductSchema.shape.name,
          description: updateInvoiceProductSchema.shape.description,
          price: updateInvoiceProductSchema.shape.price,
          currency: updateInvoiceProductSchema.shape.currency,
          unit: updateInvoiceProductSchema.shape.unit,
          taxRate: updateInvoiceProductSchema.shape.taxRate,
          isActive: updateInvoiceProductSchema.shape.isActive,
        },
        annotations: WRITE_ANNOTATIONS,
      },
      async (params) => {
        try {
          const result = await updateInvoiceProduct(db, {
            id: params.id,
            teamId,
            name: params.name,
            description: params.description,
            price: params.price,
            currency: params.currency,
            unit: params.unit,
            taxRate: params.taxRate,
            isActive: params.isActive,
          });

          if (!result) {
            return {
              content: [
                {
                  type: "text",
                  text: "Invoice product not found or update failed",
                },
              ],
              isError: true,
            };
          }

          const clean = sanitize(mcpInvoiceProductSchema, result);

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
                    : "Failed to update invoice product",
              },
            ],
            isError: true,
          };
        }
      },
    );

    server.registerTool(
      "invoice_products_delete",
      {
        title: "Delete Invoice Product",
        description:
          "Delete an invoice product by ID. This does not affect existing invoices that used this product.",
        inputSchema: {
          id: deleteInvoiceProductSchema.shape.id,
        },
        annotations: DESTRUCTIVE_ANNOTATIONS,
      },
      async ({ id }) => {
        try {
          const deleted = await deleteInvoiceProduct(db, id, teamId);

          if (!deleted) {
            return {
              content: [{ type: "text", text: "Invoice product not found" }],
              isError: true,
            };
          }

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({ success: true, deletedId: id }),
              },
            ],
            structuredContent: { success: true, deletedId: id },
          };
        } catch (error) {
          return {
            content: [
              {
                type: "text",
                text:
                  error instanceof Error
                    ? error.message
                    : "Failed to delete invoice product",
              },
            ],
            isError: true,
          };
        }
      },
    );
  }
};
