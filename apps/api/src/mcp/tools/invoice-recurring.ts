import {
  createInvoiceRecurring,
  deleteInvoiceRecurring,
  getInvoiceRecurringById,
  getInvoiceRecurringList,
  getUpcomingInvoices,
  pauseInvoiceRecurring,
  resumeInvoiceRecurring,
} from "@midday/db/queries";
import { z } from "zod";
import { sanitize, sanitizeArray } from "../schemas";
import {
  DESTRUCTIVE_ANNOTATIONS,
  hasScope,
  READ_ONLY_ANNOTATIONS,
  type RegisterTools,
  WRITE_ANNOTATIONS,
} from "../types";
import { truncateListResponse, withErrorHandling } from "../utils";

const mcpRecurringInvoiceSchema = z.object({
  id: z.string(),
  status: z.string().nullable().optional(),
  frequency: z.string().nullable().optional(),
  frequencyInterval: z.number().nullable().optional(),
  nextScheduledDate: z.string().nullable().optional(),
  lastGeneratedDate: z.string().nullable().optional(),
  endType: z.string().nullable().optional(),
  endDate: z.string().nullable().optional(),
  occurrenceLimit: z.number().nullable().optional(),
  occurrenceCount: z.number().nullable().optional(),
  timezone: z.string().nullable().optional(),
  dueDateOffset: z.number().nullable().optional(),
  createdAt: z.string().nullable().optional(),
  customer: z
    .object({
      id: z.string(),
      name: z.string(),
    })
    .nullable()
    .optional(),
  invoice: z
    .object({
      id: z.string(),
      invoiceNumber: z.string().nullable().optional(),
      amount: z.number().nullable().optional(),
      currency: z.string().nullable().optional(),
    })
    .nullable()
    .optional(),
});

export const registerInvoiceRecurringTools: RegisterTools = (server, ctx) => {
  const { db, teamId } = ctx;

  const hasReadScope = hasScope(ctx, "invoices.read");
  const hasWriteScope = hasScope(ctx, "invoices.write");

  if (!hasReadScope && !hasWriteScope) {
    return;
  }

  if (hasReadScope) {
    server.registerTool(
      "invoice_recurring_list",
      {
        title: "List Recurring Invoices",
        description:
          "List recurring invoice schedules with pagination. Filter by status (active, paused, completed, canceled) or customer. Returns schedule details, frequency, and next scheduled date.",
        inputSchema: {
          cursor: z.string().optional().describe("Pagination cursor"),
          pageSize: z.coerce
            .number()
            .min(1)
            .max(100)
            .optional()
            .describe("Results per page (default 25)"),
          status: z
            .enum(["active", "paused", "completed", "canceled"])
            .optional()
            .describe("Filter by recurring status"),
          customerId: z
            .string()
            .uuid()
            .optional()
            .describe("Filter by customer ID"),
        },
        outputSchema: {
          meta: z.looseObject({
            cursor: z.string().nullable().optional(),
            hasNextPage: z.boolean(),
          }),
          data: z.array(z.record(z.string(), z.any())),
        },
        annotations: READ_ONLY_ANNOTATIONS,
      },
      withErrorHandling(async (params) => {
        const result = await getInvoiceRecurringList(db, {
          teamId,
          cursor: params.cursor,
          pageSize: params.pageSize ?? 25,
          status: params.status ? [params.status] : undefined,
          customerId: params.customerId,
        });

        const response = {
          meta: {
            cursor: result.meta.cursor ?? null,
            hasNextPage: result.meta.hasNextPage,
            hasPreviousPage: result.meta.hasPreviousPage,
          },
          data: sanitizeArray(mcpRecurringInvoiceSchema, result.data ?? []),
        };

        const { text, structuredContent } = truncateListResponse(response);

        return {
          content: [{ type: "text" as const, text }],
          structuredContent,
        };
      }, "Failed to list recurring invoices"),
    );

    server.registerTool(
      "invoice_recurring_get",
      {
        title: "Get Recurring Invoice",
        description:
          "Get full details of a recurring invoice schedule by ID including frequency, next scheduled date, customer, and source invoice.",
        inputSchema: {
          id: z.string().uuid().describe("Recurring invoice schedule ID"),
        },
        outputSchema: {
          data: z.record(z.string(), z.any()),
        },
        annotations: READ_ONLY_ANNOTATIONS,
      },
      withErrorHandling(async ({ id }) => {
        const result = await getInvoiceRecurringById(db, { id, teamId });

        if (!result) {
          return {
            content: [
              { type: "text" as const, text: "Recurring invoice not found" },
            ],
            isError: true,
          };
        }

        const clean = sanitize(mcpRecurringInvoiceSchema, result);

        return {
          content: [{ type: "text" as const, text: JSON.stringify(clean) }],
          structuredContent: { data: clean },
        };
      }, "Failed to get recurring invoice"),
    );

    server.registerTool(
      "invoice_recurring_upcoming",
      {
        title: "Upcoming Recurring Invoices",
        description:
          "Preview upcoming scheduled invoices for a recurring schedule. Returns projected dates and amounts based on the current schedule configuration.",
        inputSchema: {
          id: z.string().uuid().describe("Recurring invoice schedule ID"),
          limit: z.coerce
            .number()
            .min(1)
            .max(24)
            .optional()
            .describe("Number of upcoming invoices to preview (default 6)"),
        },
        outputSchema: {
          data: z.record(z.string(), z.any()),
        },
        annotations: READ_ONLY_ANNOTATIONS,
      },
      withErrorHandling(async ({ id, limit }) => {
        const result = await getUpcomingInvoices(db, {
          id,
          teamId,
          limit: limit ?? 6,
        });

        if (!result) {
          return {
            content: [
              {
                type: "text" as const,
                text: "Recurring invoice not found or no upcoming invoices",
              },
            ],
            isError: true,
          };
        }

        return {
          content: [{ type: "text" as const, text: JSON.stringify(result) }],
          structuredContent: { data: result },
        };
      }, "Failed to get upcoming invoices"),
    );
  }

  if (hasWriteScope) {
    server.registerTool(
      "invoice_recurring_create",
      {
        title: "Create Recurring Invoice",
        description:
          "Set up a recurring invoice schedule for a customer. Requires a customer ID, frequency, and scheduling parameters. The system will automatically generate and send invoices on schedule.",
        inputSchema: {
          customerId: z
            .string()
            .uuid()
            .describe("ID of the customer to send recurring invoices to"),
          frequency: z
            .enum([
              "weekly",
              "biweekly",
              "monthly_date",
              "monthly_weekday",
              "monthly_last_day",
              "quarterly",
              "semi_annual",
              "annual",
              "custom",
            ])
            .describe(
              "How often to generate invoices. Use monthly_date for a specific day each month, monthly_weekday for a specific weekday occurrence, custom for every X days.",
            ),
          frequencyDay: z.coerce
            .number()
            .optional()
            .describe(
              "Day setting: for weekly/biweekly 0-6 (Sun-Sat), for monthly_date/quarterly/etc 1-31 (day of month)",
            ),
          frequencyWeek: z.coerce
            .number()
            .min(1)
            .max(5)
            .optional()
            .describe(
              "Week occurrence for monthly_weekday (1-5, e.g. 1 = first occurrence)",
            ),
          frequencyInterval: z.coerce
            .number()
            .min(1)
            .optional()
            .describe("For custom frequency: number of days between invoices"),
          startDate: z
            .string()
            .optional()
            .describe(
              "Start date / first issue date for the schedule (ISO 8601). If in the future, first invoice is scheduled for this date. If omitted or in the past, first invoice is generated immediately.",
            ),
          endType: z
            .enum(["never", "on_date", "after_count"])
            .default("never")
            .describe(
              "When the schedule ends: 'never' continues indefinitely, 'on_date' ends on endDate, 'after_count' ends after occurrenceLimit invoices",
            ),
          endDate: z
            .string()
            .optional()
            .describe("End date if endType is 'on_date' (ISO 8601)"),
          occurrenceLimit: z.coerce
            .number()
            .optional()
            .describe("Number of invoices if endType is 'after_count'"),
          timezone: z
            .string()
            .optional()
            .describe("Timezone for scheduling (defaults to team timezone)"),
          dueDateOffset: z.coerce
            .number()
            .optional()
            .describe("Days after issue date for the due date (default 30)"),
        },
        annotations: WRITE_ANNOTATIONS,
      },
      async (params) => {
        try {
          const result = await createInvoiceRecurring(db, {
            teamId,
            userId: ctx.userId,
            customerId: params.customerId,
            frequency: params.frequency,
            frequencyDay: params.frequencyDay ?? null,
            frequencyWeek: params.frequencyWeek ?? null,
            frequencyInterval: params.frequencyInterval ?? null,
            issueDate: params.startDate ?? null,
            endType: params.endType ?? "never",
            endDate: params.endDate ?? null,
            endCount: params.occurrenceLimit ?? null,
            timezone: params.timezone ?? ctx.timezone ?? "UTC",
            dueDateOffset: params.dueDateOffset,
          });

          if (!result) {
            return {
              content: [
                { type: "text", text: "Failed to create recurring schedule" },
              ],
              isError: true,
            };
          }

          const clean = sanitize(mcpRecurringInvoiceSchema, result);

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
                    : "Failed to create recurring invoice",
              },
            ],
            isError: true,
          };
        }
      },
    );

    server.registerTool(
      "invoice_recurring_pause",
      {
        title: "Pause Recurring Invoice",
        description:
          "Pause an active recurring invoice schedule. No new invoices will be generated until resumed. Only active schedules can be paused.",
        inputSchema: {
          id: z
            .string()
            .uuid()
            .describe("Recurring invoice schedule ID to pause"),
        },
        annotations: WRITE_ANNOTATIONS,
      },
      async ({ id }) => {
        try {
          const result = await pauseInvoiceRecurring(db, { id, teamId });

          if (!result) {
            return {
              content: [
                {
                  type: "text",
                  text: "Recurring invoice not found or cannot be paused",
                },
              ],
              isError: true,
            };
          }

          const clean = sanitize(mcpRecurringInvoiceSchema, result);

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  message: "Recurring invoice paused",
                  schedule: clean,
                }),
              },
            ],
            structuredContent: {
              message: "Recurring invoice paused",
              schedule: clean,
            },
          };
        } catch (error) {
          return {
            content: [
              {
                type: "text",
                text:
                  error instanceof Error
                    ? error.message
                    : "Failed to pause recurring invoice",
              },
            ],
            isError: true,
          };
        }
      },
    );

    server.registerTool(
      "invoice_recurring_resume",
      {
        title: "Resume Recurring Invoice",
        description:
          "Resume a paused recurring invoice schedule. Invoice generation will continue from where it left off.",
        inputSchema: {
          id: z
            .string()
            .uuid()
            .describe("Recurring invoice schedule ID to resume"),
        },
        annotations: WRITE_ANNOTATIONS,
      },
      async ({ id }) => {
        try {
          const result = await resumeInvoiceRecurring(db, { id, teamId });

          if (!result) {
            return {
              content: [
                {
                  type: "text",
                  text: "Recurring invoice not found or cannot be resumed",
                },
              ],
              isError: true,
            };
          }

          const clean = sanitize(mcpRecurringInvoiceSchema, result);

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  message: "Recurring invoice resumed",
                  schedule: clean,
                }),
              },
            ],
            structuredContent: {
              message: "Recurring invoice resumed",
              schedule: clean,
            },
          };
        } catch (error) {
          return {
            content: [
              {
                type: "text",
                text:
                  error instanceof Error
                    ? error.message
                    : "Failed to resume recurring invoice",
              },
            ],
            isError: true,
          };
        }
      },
    );

    server.registerTool(
      "invoice_recurring_delete",
      {
        title: "Delete Recurring Invoice",
        description:
          "Delete a recurring invoice schedule. Previously generated invoices are not affected. This action cannot be undone.",
        inputSchema: {
          id: z
            .string()
            .uuid()
            .describe("Recurring invoice schedule ID to delete"),
        },
        annotations: DESTRUCTIVE_ANNOTATIONS,
      },
      async ({ id }) => {
        try {
          const result = await deleteInvoiceRecurring(db, { id, teamId });

          if (!result) {
            return {
              content: [{ type: "text", text: "Recurring invoice not found" }],
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
                    : "Failed to delete recurring invoice",
              },
            ],
            isError: true,
          };
        }
      },
    );
  }
};
