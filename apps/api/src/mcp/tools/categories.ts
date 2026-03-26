import {
  createTransactionCategorySchema,
  deleteTransactionCategorySchema,
  getCategoryByIdSchema,
  updateTransactionCategorySchema,
} from "@api/schemas/transaction-categories";
import {
  createTransactionCategory,
  deleteTransactionCategory,
  getCategories,
  getCategoryById,
  updateTransactionCategory,
} from "@midday/db/queries";
import { z } from "zod";
import { mcpCategoryDetailSchema, sanitize, sanitizeArray } from "../schemas";
import {
  DESTRUCTIVE_ANNOTATIONS,
  hasScope,
  READ_ONLY_ANNOTATIONS,
  type RegisterTools,
  WRITE_ANNOTATIONS,
} from "../types";
import { withErrorHandling } from "../utils";

export const registerCategoryTools: RegisterTools = (server, ctx) => {
  const { db, teamId, userId } = ctx;

  const hasReadScope = hasScope(ctx, "transactions.read");
  const hasWriteScope = hasScope(ctx, "transactions.write");

  if (!hasReadScope && !hasWriteScope) {
    return;
  }

  if (hasReadScope) {
    server.registerTool(
      "categories_list",
      {
        title: "List Transaction Categories",
        description:
          "List all transaction categories as a tree with parent categories and their children. Includes system default categories and custom categories. Use category slugs (not IDs) when filtering or categorizing transactions.",
        inputSchema: {
          limit: z.coerce
            .number()
            .optional()
            .describe(
              "Max number of parent categories to return (default 1000)",
            ),
        },
        outputSchema: {
          data: z.array(z.record(z.string(), z.any())),
        },
        annotations: READ_ONLY_ANNOTATIONS,
      },
      withErrorHandling(async (params) => {
        const result = await getCategories(db, {
          teamId,
          limit: params.limit,
        });

        const clean = sanitizeArray(mcpCategoryDetailSchema, result ?? []);

        return {
          content: [{ type: "text" as const, text: JSON.stringify(clean) }],
          structuredContent: { data: clean },
        };
      }, "Failed to list categories"),
    );

    server.registerTool(
      "categories_get",
      {
        title: "Get Transaction Category",
        description:
          "Get a single transaction category by ID with its child categories, color, description, and tax settings.",
        inputSchema: {
          id: getCategoryByIdSchema.shape.id,
        },
        outputSchema: {
          data: z.record(z.string(), z.any()),
        },
        annotations: READ_ONLY_ANNOTATIONS,
      },
      withErrorHandling(async ({ id }) => {
        const result = await getCategoryById(db, { id, teamId });

        if (!result) {
          return {
            content: [{ type: "text" as const, text: "Category not found" }],
            isError: true,
          };
        }

        const clean = sanitize(mcpCategoryDetailSchema, result);

        return {
          content: [{ type: "text" as const, text: JSON.stringify(clean) }],
          structuredContent: { data: clean },
        };
      }, "Failed to get category"),
    );
  }

  if (hasWriteScope) {
    server.registerTool(
      "categories_create",
      {
        title: "Create Transaction Category",
        description:
          "Create a custom transaction category. Name is required. Optionally set color, description, tax rate, and parent category to create a subcategory.",
        inputSchema: {
          name: createTransactionCategorySchema.shape.name,
          color: createTransactionCategorySchema.shape.color,
          description: createTransactionCategorySchema.shape.description,
          taxRate: createTransactionCategorySchema.shape.taxRate,
          taxType: createTransactionCategorySchema.shape.taxType,
          taxReportingCode:
            createTransactionCategorySchema.shape.taxReportingCode,
          parentId: createTransactionCategorySchema.shape.parentId,
        },
        annotations: WRITE_ANNOTATIONS,
      },
      async (params) => {
        try {
          const result = await createTransactionCategory(db, {
            teamId,
            userId,
            name: params.name,
            color: params.color,
            description: params.description,
            taxRate: params.taxRate,
            taxType: params.taxType,
            taxReportingCode: params.taxReportingCode,
            parentId: params.parentId,
          });

          if (!result) {
            return {
              content: [{ type: "text", text: "Failed to create category" }],
              isError: true,
            };
          }

          const clean = sanitize(mcpCategoryDetailSchema, result);

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
                    : "Failed to create category",
              },
            ],
            isError: true,
          };
        }
      },
    );

    server.registerTool(
      "categories_update",
      {
        title: "Update Transaction Category",
        description:
          "Update an existing transaction category. Provide the category ID and only the fields to change. Cannot change parent of a category that has children.",
        inputSchema: {
          id: updateTransactionCategorySchema.shape.id,
          name: updateTransactionCategorySchema.shape.name,
          color: updateTransactionCategorySchema.shape.color,
          description: updateTransactionCategorySchema.shape.description,
          taxRate: updateTransactionCategorySchema.shape.taxRate,
          taxType: updateTransactionCategorySchema.shape.taxType,
          taxReportingCode:
            updateTransactionCategorySchema.shape.taxReportingCode,
          parentId: updateTransactionCategorySchema.shape.parentId,
        },
        annotations: WRITE_ANNOTATIONS,
      },
      async (params) => {
        try {
          const result = await updateTransactionCategory(db, {
            id: params.id,
            teamId,
            name: params.name,
            color: params.color,
            description: params.description,
            taxRate: params.taxRate,
            taxType: params.taxType,
            taxReportingCode: params.taxReportingCode,
            parentId: params.parentId,
          });

          if (!result) {
            return {
              content: [
                { type: "text", text: "Category not found or update failed" },
              ],
              isError: true,
            };
          }

          const clean = sanitize(mcpCategoryDetailSchema, result);

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
                    : "Failed to update category",
              },
            ],
            isError: true,
          };
        }
      },
    );

    server.registerTool(
      "categories_delete",
      {
        title: "Delete Transaction Category",
        description:
          "Delete a custom transaction category by ID. System default categories cannot be deleted. Returns the deleted category.",
        inputSchema: {
          id: deleteTransactionCategorySchema.shape.id,
        },
        annotations: DESTRUCTIVE_ANNOTATIONS,
      },
      async ({ id }) => {
        try {
          const result = await deleteTransactionCategory(db, { id, teamId });

          if (!result) {
            return {
              content: [
                {
                  type: "text",
                  text: "Category not found or is a system category (cannot be deleted)",
                },
              ],
              isError: true,
            };
          }

          const clean = sanitize(mcpCategoryDetailSchema, result);

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({ success: true, deleted: clean }),
              },
            ],
            structuredContent: { success: true, deleted: clean },
          };
        } catch (error) {
          return {
            content: [
              {
                type: "text",
                text:
                  error instanceof Error
                    ? error.message
                    : "Failed to delete category",
              },
            ],
            isError: true,
          };
        }
      },
    );
  }
};
