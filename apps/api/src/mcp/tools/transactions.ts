import {
  createTransactionSchema,
  deleteTransactionSchema,
  getTransactionByIdSchema,
  getTransactionsSchema,
  updateTransactionSchema,
  updateTransactionsSchema,
} from "@api/schemas/transactions";
import type { AccountingProviderConfig } from "@midday/accounting";
import { getOrgName } from "@midday/accounting";
import {
  createTransaction,
  createTransactions,
  deleteTransactions,
  getAccountingSyncStatus,
  getAppByAppId,
  getApps,
  getTransactionById,
  getTransactions,
  updateTransaction,
  updateTransactions,
} from "@midday/db/queries";
import {
  getJobStatus,
  triggerJob,
  triggerJobAndWait,
} from "@midday/job-client";
import { z } from "zod";
import {
  mcpTransactionDetailSchema,
  mcpTransactionSchema,
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
import {
  getVaultSignedUrl,
  truncateListResponse,
  withErrorHandling,
} from "../utils";

export const registerTransactionTools: RegisterTools = (server, ctx) => {
  const { db, teamId, userId, userEmail } = ctx;

  const hasReadScope = hasScope(ctx, "transactions.read");
  const hasWriteScope = hasScope(ctx, "transactions.write");

  if (!hasReadScope && !hasWriteScope) {
    return;
  }

  if (hasReadScope) {
    const {
      sort: _sort,
      amountRange: _amountRange,
      pageSize: _pageSize,
      ...transactionsListFields
    } = getTransactionsSchema.shape;

    server.registerTool(
      "transactions_list",
      {
        title: "List Transactions",
        description:
          "List bank transactions with filtering by date range, amount, category, status, account, tags, and free-text search. Returns paginated results (default 25 per page). Use cursor from the response to fetch the next page. Filter fields: categories expects slugs (from categories_list), tags expects tag IDs (from tags_list), accounts expects bank account IDs, assignees expects user IDs (from team_members). For quick lookups across all data types, prefer search_global instead.",
        inputSchema: {
          ...transactionsListFields,
          pageSize: z.coerce
            .number()
            .min(1)
            .max(100)
            .optional()
            .describe("Number of transactions per page (1-100, default 25)"),
          sortBy: z
            .enum([
              "date",
              "amount",
              "name",
              "status",
              "attachment",
              "assigned",
              "bank_account",
              "category",
              "tags",
              "counterparty",
            ])
            .optional()
            .describe("Column to sort by"),
          sortDirection: z
            .enum(["asc", "desc"])
            .optional()
            .describe("Sort direction"),
          amountMin: z.coerce
            .number()
            .optional()
            .describe(
              "Minimum absolute amount to include (e.g. 100 matches both -100 expense and +100 income)",
            ),
          amountMax: z.coerce
            .number()
            .optional()
            .describe("Maximum absolute amount to include"),
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

        const amountRange =
          params.amountMin != null || params.amountMax != null
            ? [
                params.amountMin ?? 0,
                params.amountMax ?? Number.MAX_SAFE_INTEGER,
              ]
            : null;

        const result = await getTransactions(db, {
          teamId,
          cursor: params.cursor ?? null,
          pageSize: params.pageSize ?? 25,
          q: params.q ?? null,
          start: params.start ?? null,
          end: params.end ?? null,
          categories: params.categories ?? null,
          statuses: params.statuses ?? null,
          type: params.type ?? null,
          accounts: params.accounts ?? null,
          sort,
          tags: params.tags ?? null,
          assignees: params.assignees ?? null,
          recurring: params.recurring ?? null,
          attachments: params.attachments ?? null,
          amountRange,
          amount: params.amount ?? null,
          manual: params.manual ?? null,
          exported: params.exported ?? undefined,
          fulfilled: params.fulfilled ?? undefined,
        });

        const data = sanitizeArray(mcpTransactionSchema, result.data ?? []);

        const response = {
          meta: {
            cursor: result.meta.cursor ?? null,
            hasNextPage: result.meta.hasNextPage,
            hasPreviousPage: result.meta.hasPreviousPage,
          },
          data,
        };

        const { text, structuredContent } = truncateListResponse(response);

        return {
          content: [{ type: "text" as const, text }],
          structuredContent,
        };
      }, "Failed to list transactions"),
    );

    server.registerTool(
      "transactions_get",
      {
        title: "Get Transaction",
        description:
          "Get a single transaction by ID. Returns full details including amount, currency, category, merchant name, date, attachments, notes, and bank account info.",
        inputSchema: {
          id: getTransactionByIdSchema.shape.id,
        },
        outputSchema: {
          data: z.record(z.string(), z.any()),
        },
        annotations: READ_ONLY_ANNOTATIONS,
      },
      withErrorHandling(async ({ id }) => {
        const result = await getTransactionById(db, { id, teamId });

        if (!result) {
          return {
            content: [{ type: "text" as const, text: "Transaction not found" }],
            isError: true,
          };
        }

        const clean = sanitize(mcpTransactionDetailSchema, result);

        return {
          content: [{ type: "text" as const, text: JSON.stringify(clean) }],
          structuredContent: { data: clean },
        };
      }, "Failed to get transaction"),
    );
  }

  if (hasWriteScope) {
    server.registerTool(
      "transactions_create",
      {
        title: "Create Transaction",
        description:
          "Create a manual transaction (not from bank sync). Requires bank account ID, amount, currency, date, and name. Use for manual entries and adjustments.",
        inputSchema: createTransactionSchema.shape,
        annotations: WRITE_ANNOTATIONS,
      },
      async (params) => {
        try {
          const result = await createTransaction(db, { teamId, ...params });

          if (!result) {
            return {
              content: [{ type: "text", text: "Failed to create transaction" }],
              isError: true,
            };
          }

          const clean = sanitize(mcpTransactionSchema, result);

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
                    : "Failed to create transaction",
              },
            ],
            isError: true,
          };
        }
      },
    );

    server.registerTool(
      "transactions_create_bulk",
      {
        title: "Create Transactions (Bulk)",
        description:
          "Create up to 100 manual transactions in one request. Each item follows the same shape as transactions_create.",
        inputSchema: z.object({
          transactions: z.array(createTransactionSchema).min(1).max(100),
        }).shape,
        annotations: WRITE_ANNOTATIONS,
      },
      async ({ transactions: items }) => {
        try {
          const result = await createTransactions(
            db,
            items.map((item) => ({ ...item, teamId })),
          );

          const clean = sanitizeArray(mcpTransactionSchema, result ?? []);

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
                    : "Failed to create transactions",
              },
            ],
            isError: true,
          };
        }
      },
    );

    server.registerTool(
      "transactions_update",
      {
        title: "Update Transaction",
        description:
          "Update a single transaction by ID: category, status, note, assignment, amount, tax fields, etc. Use the transaction status field for workflow states (pending, posted, excluded, archived, exported, completed).",
        inputSchema: updateTransactionSchema.shape,
        annotations: WRITE_ANNOTATIONS,
      },
      async (params) => {
        try {
          const result = await updateTransaction(db, {
            ...params,
            teamId,
            userId,
          });

          if (!result) {
            return {
              content: [
                {
                  type: "text",
                  text: "Transaction not found or update failed",
                },
              ],
              isError: true,
            };
          }

          const clean = sanitize(mcpTransactionSchema, result);

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
                    : "Failed to update transaction",
              },
            ],
            isError: true,
          };
        }
      },
    );

    server.registerTool(
      "transactions_update_bulk",
      {
        title: "Update Transactions (Bulk)",
        description:
          "Apply the same updates to multiple transactions by ID (e.g. bulk categorize, set tag, assignee, status).",
        inputSchema: updateTransactionsSchema.shape,
        annotations: WRITE_ANNOTATIONS,
      },
      async (params) => {
        try {
          const result = await updateTransactions(db, {
            ...params,
            teamId,
            userId,
          });

          const clean = sanitizeArray(mcpTransactionSchema, result ?? []);

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
                    : "Failed to update transactions",
              },
            ],
            isError: true,
          };
        }
      },
    );

    server.registerTool(
      "transactions_delete",
      {
        title: "Delete Transaction",
        description:
          "Delete a single transaction. Only manually created transactions can be deleted; bank-imported rows must be excluded via status instead.",
        inputSchema: deleteTransactionSchema.shape,
        annotations: DESTRUCTIVE_ANNOTATIONS,
      },
      async ({ id }) => {
        try {
          const result = await deleteTransactions(db, { teamId, ids: [id] });

          if (result.length === 0) {
            return {
              content: [
                {
                  type: "text",
                  text: "Transaction could not be deleted (not found or not a manual transaction)",
                },
              ],
              isError: true,
            };
          }

          const clean = sanitize(mcpTransactionSchema, result[0]);

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
                    : "Failed to delete transaction",
              },
            ],
            isError: true,
          };
        }
      },
    );

    server.registerTool(
      "transactions_delete_bulk",
      {
        title: "Delete Transactions (Bulk)",
        description:
          "Delete up to 1000 manual transactions by ID. Bank-imported transactions cannot be deleted.",
        inputSchema: {
          ids: z
            .array(z.string().uuid())
            .min(1)
            .max(1000)
            .describe(
              "Transaction IDs to delete (1–1000 UUIDs, must not be empty)",
            ),
        },
        annotations: DESTRUCTIVE_ANNOTATIONS,
      },
      async ({ ids }) => {
        try {
          const result = await deleteTransactions(db, { teamId, ids });

          const clean = sanitizeArray(mcpTransactionSchema, result ?? []);

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
                    : "Failed to delete transactions",
              },
            ],
            isError: true,
          };
        }
      },
    );

    server.registerTool(
      "transactions_export",
      {
        title: "Export Transactions (File)",
        description:
          "Export transactions as a ZIP file containing CSV and/or XLSX spreadsheets plus receipt attachments. Optionally emails the file to your accountant. Provide either transactionIds directly OR use filter parameters (start, end, categories, statuses, accounts, q, type) to select transactions by criteria. For up to 500 transactions the export completes synchronously and returns a download URL; larger exports return a jobId for polling with export_job_status.",
        inputSchema: {
          transactionIds: z
            .array(z.string().uuid())
            .optional()
            .describe(
              "Transaction IDs to export. Optional if filter parameters are provided instead.",
            ),
          start: z
            .string()
            .optional()
            .describe(
              "Start date (inclusive, ISO 8601) to filter transactions for export",
            ),
          end: z
            .string()
            .optional()
            .describe(
              "End date (inclusive, ISO 8601) to filter transactions for export",
            ),
          q: z
            .string()
            .optional()
            .describe("Search query to filter transactions for export"),
          categories: z
            .array(z.string())
            .optional()
            .describe(
              "Category slugs to filter transactions for export (from categories_list)",
            ),
          statuses: z
            .array(z.string())
            .optional()
            .describe("Status filters for transactions to export"),
          accounts: z
            .array(z.string())
            .optional()
            .describe("Bank account IDs to filter transactions for export"),
          type: z
            .enum(["income", "expense"])
            .optional()
            .describe("Transaction type filter: income or expense"),
          tags: z
            .array(z.string())
            .optional()
            .describe("Tag IDs to filter transactions for export"),
          locale: z
            .string()
            .optional()
            .describe("Locale for number/date formatting (e.g. en, sv)"),
          dateFormat: z
            .string()
            .optional()
            .describe(
              "Date format string (e.g. yyyy-MM-dd). Defaults to team setting.",
            ),
          csvDelimiter: z
            .string()
            .optional()
            .describe("CSV delimiter character (default: comma)"),
          includeCSV: z
            .boolean()
            .optional()
            .describe("Include CSV file in the export (default: true)"),
          includeXLSX: z
            .boolean()
            .optional()
            .describe("Include XLSX file in the export (default: true)"),
          sendEmail: z
            .boolean()
            .optional()
            .describe(
              "Email the export to your accountant (default: false). Requires accountantEmail.",
            ),
          accountantEmail: z
            .string()
            .email()
            .optional()
            .describe(
              "Accountant email address (required if sendEmail is true)",
            ),
          sendCopyToMe: z
            .boolean()
            .optional()
            .describe(
              "Send a copy of the email to yourself (default: false). Only works with sendEmail.",
            ),
        },
        annotations: WRITE_ANNOTATIONS,
      },
      async (params) => {
        try {
          if (params.sendEmail && !params.accountantEmail) {
            return {
              content: [
                {
                  type: "text",
                  text: "accountantEmail is required when sendEmail is true",
                },
              ],
              isError: true,
            };
          }

          let transactionIds = params.transactionIds;

          const hasFilters =
            params.start ||
            params.end ||
            params.q ||
            params.categories?.length ||
            params.statuses?.length ||
            params.accounts?.length ||
            params.type ||
            params.tags?.length;

          if (!transactionIds?.length && !hasFilters) {
            return {
              content: [
                {
                  type: "text",
                  text: "Provide either transactionIds or at least one filter parameter (start, end, q, categories, statuses, accounts, type, tags).",
                },
              ],
              isError: true,
            };
          }

          if (!transactionIds?.length && hasFilters) {
            const ids: string[] = [];
            let cursor: string | null = null;
            const MAX_EXPORT_ROWS = 10_000;

            do {
              const page = await getTransactions(db, {
                teamId,
                cursor,
                pageSize: 500,
                q: params.q ?? null,
                start: params.start ?? null,
                end: params.end ?? null,
                categories: params.categories ?? null,
                statuses:
                  (params.statuses as
                    | (
                        | "blank"
                        | "receipt_match"
                        | "in_review"
                        | "export_error"
                        | "exported"
                        | "excluded"
                        | "archived"
                      )[]
                    | null) ?? null,
                type: params.type ?? null,
                accounts: params.accounts ?? null,
                tags: params.tags ?? null,
                sort: null,
                assignees: null,
                recurring: null,
                attachments: null,
                amountRange: null,
                amount: null,
                manual: null,
              });

              for (const txn of page.data ?? []) {
                ids.push(txn.id);
              }

              cursor = page.meta.hasNextPage
                ? (page.meta.cursor ?? null)
                : null;
            } while (cursor && ids.length < MAX_EXPORT_ROWS);

            if (ids.length === 0) {
              return {
                content: [
                  {
                    type: "text",
                    text: "No transactions matched the provided filters.",
                  },
                ],
                isError: true,
              };
            }

            transactionIds = ids;
          }

          const jobPayload = {
            teamId,
            userId,
            userEmail: userEmail ?? undefined,
            locale: params.locale ?? ctx.locale ?? "en",
            transactionIds: transactionIds!,
            dateFormat: params.dateFormat ?? ctx.dateFormat ?? undefined,
            exportSettings: {
              csvDelimiter: params.csvDelimiter ?? ",",
              includeCSV: params.includeCSV ?? true,
              includeXLSX: params.includeXLSX ?? true,
              sendEmail: params.sendEmail ?? false,
              sendCopyToMe: params.sendCopyToMe ?? false,
              accountantEmail: params.accountantEmail,
            },
          };

          const SYNC_THRESHOLD = 500;

          if (transactionIds!.length <= SYNC_THRESHOLD) {
            const { result } = await triggerJobAndWait(
              "export-transactions",
              jobPayload,
              "transactions",
              { timeout: 120_000 },
            );

            const jobResult = result as
              | { fullPath?: string; fileName?: string; totalItems?: number }
              | undefined;

            const downloadUrl = jobResult?.fullPath
              ? await getVaultSignedUrl(jobResult.fullPath)
              : null;

            const response = {
              status: "completed" as const,
              fileName: jobResult?.fileName ?? null,
              totalItems: jobResult?.totalItems ?? transactionIds!.length,
              downloadUrl,
            };

            return {
              content: [{ type: "text", text: JSON.stringify(response) }],
              structuredContent: response,
            };
          }

          const triggerResult = await triggerJob(
            "export-transactions",
            jobPayload,
            "transactions",
          );

          const response = {
            message: params.sendEmail
              ? `Export started. Your accountant at ${params.accountantEmail} will receive the file once ready.`
              : "Export started. Poll export_job_status with the jobId to track progress and get the download URL.",
            jobId: triggerResult.id,
            transactionCount: transactionIds!.length,
          };

          return {
            content: [{ type: "text", text: JSON.stringify(response) }],
            structuredContent: response,
          };
        } catch (error) {
          return {
            content: [
              {
                type: "text",
                text:
                  error instanceof Error
                    ? error.message
                    : "Failed to start export",
              },
            ],
            isError: true,
          };
        }
      },
    );

    server.registerTool(
      "transactions_export_to_accounting",
      {
        title: "Export to Accounting Software",
        description:
          "Push transactions (with receipt attachments) to a connected accounting provider (Xero, QuickBooks, or Fortnox). Use accounting_connections first to check which providers are connected. Returns a job ID — poll with export_job_status to track progress.",
        inputSchema: {
          transactionIds: z
            .array(z.string().uuid())
            .min(1)
            .describe("Transaction IDs to export"),
          providerId: z
            .enum(["xero", "quickbooks", "fortnox"])
            .describe("Accounting provider to export to"),
        },
        annotations: WRITE_ANNOTATIONS,
      },
      async (params) => {
        try {
          const app = await getAppByAppId(db, {
            appId: params.providerId,
            teamId,
          });

          if (!app?.config) {
            return {
              content: [
                {
                  type: "text",
                  text: `${params.providerId} is not connected. Connect it in Settings → Accounting before exporting.`,
                },
              ],
              isError: true,
            };
          }

          const result = await triggerJob(
            "export-to-accounting",
            {
              teamId,
              userId,
              providerId: params.providerId,
              transactionIds: params.transactionIds,
            },
            "accounting",
          );

          const config = app.config as AccountingProviderConfig;
          const orgName = getOrgName(config) ?? params.providerId;

          const response = {
            message: `Exporting ${params.transactionIds.length} transaction(s) to ${orgName} (${params.providerId}). Poll export_job_status with the jobId to track progress.`,
            jobId: result.id,
            provider: params.providerId,
            tenantName: orgName,
            transactionCount: params.transactionIds.length,
          };

          return {
            content: [{ type: "text", text: JSON.stringify(response) }],
            structuredContent: response,
          };
        } catch (error) {
          return {
            content: [
              {
                type: "text",
                text:
                  error instanceof Error
                    ? error.message
                    : "Failed to start accounting export",
              },
            ],
            isError: true,
          };
        }
      },
    );

    server.registerTool(
      "export_job_status",
      {
        title: "Export Job Status",
        description:
          "Poll the status of an export job (file export or accounting sync). Use the jobId returned by transactions_export or transactions_export_to_accounting. Status progresses: waiting → active → completed/failed.",
        inputSchema: {
          jobId: z
            .string()
            .describe(
              "Job ID returned by an export tool (e.g. transactions:42)",
            ),
        },
        annotations: READ_ONLY_ANNOTATIONS,
      },
      async ({ jobId }) => {
        try {
          const status = await getJobStatus(jobId, { teamId });
          const response: Record<string, unknown> = { ...status };

          if (
            status.status === "completed" &&
            status.result &&
            typeof status.result === "object" &&
            "fullPath" in status.result &&
            typeof (status.result as Record<string, unknown>).fullPath ===
              "string"
          ) {
            const downloadUrl = await getVaultSignedUrl(
              (status.result as Record<string, unknown>).fullPath as string,
            );
            if (downloadUrl) {
              response.result = {
                ...(status.result as Record<string, unknown>),
                downloadUrl,
              };
            }
          }

          return {
            content: [{ type: "text", text: JSON.stringify(response) }],
            structuredContent: response,
          };
        } catch (error) {
          return {
            content: [
              {
                type: "text",
                text:
                  error instanceof Error
                    ? error.message
                    : "Failed to get job status",
              },
            ],
            isError: true,
          };
        }
      },
    );

    server.registerTool(
      "accounting_connections",
      {
        title: "List Accounting Connections",
        description:
          "List connected accounting providers (Xero, QuickBooks, Fortnox) for the team. Use this before transactions_export_to_accounting to check which providers are available.",
        inputSchema: {},
        annotations: READ_ONLY_ANNOTATIONS,
      },
      async () => {
        try {
          const allApps = await getApps(db, teamId);

          const accountingProviderIds = ["xero", "quickbooks", "fortnox"];
          const connections = allApps
            .filter((app) => accountingProviderIds.includes(app.app_id))
            .map((app) => {
              const config = app.config as AccountingProviderConfig | null;
              return {
                providerId: app.app_id,
                tenantName: config
                  ? (getOrgName(config) ?? "Connected")
                  : "Connected",
              };
            });

          if (connections.length === 0) {
            return {
              content: [
                {
                  type: "text",
                  text: "No accounting providers connected. Connect Xero, QuickBooks, or Fortnox in Settings → Accounting.",
                },
              ],
              structuredContent: { connections: [] },
            };
          }

          const response = { connections };

          return {
            content: [{ type: "text", text: JSON.stringify(response) }],
            structuredContent: response,
          };
        } catch (error) {
          return {
            content: [
              {
                type: "text",
                text:
                  error instanceof Error
                    ? error.message
                    : "Failed to list accounting connections",
              },
            ],
            isError: true,
          };
        }
      },
    );
  }

  if (hasReadScope) {
    server.registerTool(
      "accounting_sync_status",
      {
        title: "Accounting Sync Status",
        description:
          "Check the sync status of transactions with connected accounting software. Filter by specific transaction IDs or by provider (xero, quickbooks, fortnox). Returns sync records showing which transactions have been exported and their status.",
        inputSchema: {
          transactionIds: z
            .array(z.string().uuid())
            .optional()
            .describe("Filter by specific transaction IDs"),
          provider: z
            .enum(["xero", "quickbooks", "fortnox"])
            .optional()
            .describe("Filter by accounting provider"),
        },
        annotations: READ_ONLY_ANNOTATIONS,
      },
      withErrorHandling(async (params) => {
        const result = await getAccountingSyncStatus(db, {
          teamId,
          transactionIds: params.transactionIds,
          provider: params.provider,
        });

        return {
          content: [{ type: "text" as const, text: JSON.stringify(result) }],
          structuredContent: { data: result ?? [] },
        };
      }, "Failed to get accounting sync status"),
    );
  }
};
