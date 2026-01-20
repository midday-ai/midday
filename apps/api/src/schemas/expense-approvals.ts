import { z } from "@hono/zod-openapi";

// Expense approval status enum
export const expenseApprovalStatusSchema = z.enum([
  "draft",
  "pending",
  "approved",
  "rejected",
  "paid",
]);

// List expense approvals schema
export const getExpenseApprovalsSchema = z
  .object({
    cursor: z.string().nullable().optional().openapi({
      description:
        "Cursor for pagination, representing the offset from the beginning",
      example: "20",
      param: { in: "query" },
    }),
    pageSize: z.coerce.number().min(1).max(100).optional().openapi({
      description: "Number of expense approvals to return per page (1-100)",
      example: 20,
      param: { in: "query" },
    }),
    status: z
      .union([
        expenseApprovalStatusSchema,
        z.array(expenseApprovalStatusSchema),
      ])
      .optional()
      .openapi({
        description:
          "Filter by expense approval status. Can be a single status or array of statuses",
        example: "pending",
        param: { in: "query" },
      }),
    requesterId: z.string().uuid().nullable().optional().openapi({
      description: "Filter by requester user ID",
      example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      param: { in: "query" },
    }),
    approverId: z.string().uuid().nullable().optional().openapi({
      description: "Filter by approver user ID",
      example: "b2c3d4e5-f6a7-8901-bcde-f23456789012",
      param: { in: "query" },
    }),
    startDate: z.string().nullable().optional().openapi({
      description: "Filter by start date (ISO format)",
      example: "2024-01-01",
      param: { in: "query" },
    }),
    endDate: z.string().nullable().optional().openapi({
      description: "Filter by end date (ISO format)",
      example: "2024-12-31",
      param: { in: "query" },
    }),
  })
  .openapi("GetExpenseApprovalsSchema");

// Get expense approval by ID schema
export const getExpenseApprovalByIdSchema = z
  .object({
    id: z.string().uuid().openapi({
      description: "The unique identifier of the expense approval",
      example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    }),
  })
  .openapi("GetExpenseApprovalByIdSchema");

// Create expense approval schema
export const createExpenseApprovalSchema = z
  .object({
    transactionId: z.string().uuid().optional().openapi({
      description: "Optional transaction ID to link to this expense approval",
      example: "c3d4e5f6-a7b8-9012-cdef-345678901234",
    }),
    amount: z.number().positive().openapi({
      description: "The expense amount",
      example: 15000,
    }),
    currency: z.string().min(3).max(3).openapi({
      description: "Currency code (ISO 4217)",
      example: "JPY",
    }),
    note: z.string().optional().openapi({
      description: "Optional note or description for the expense",
      example: "交通費 - クライアント訪問",
    }),
    metadata: z.record(z.string(), z.any()).optional().openapi({
      description: "Additional metadata for the expense",
      example: { category: "travel", receipt: true },
    }),
  })
  .openapi("CreateExpenseApprovalSchema");

// Submit expense approval schema
export const submitExpenseApprovalSchema = z
  .object({
    id: z.string().uuid().openapi({
      description: "The unique identifier of the expense approval to submit",
      example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    }),
  })
  .openapi("SubmitExpenseApprovalSchema");

// Approve expense schema
export const approveExpenseSchema = z
  .object({
    id: z.string().uuid().openapi({
      description: "The unique identifier of the expense approval to approve",
      example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    }),
  })
  .openapi("ApproveExpenseSchema");

// Reject expense schema
export const rejectExpenseSchema = z
  .object({
    id: z.string().uuid().openapi({
      description: "The unique identifier of the expense approval to reject",
      example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    }),
    rejectionReason: z.string().optional().openapi({
      description: "Reason for rejecting the expense",
      example: "領収書が不鮮明です。再提出してください。",
    }),
  })
  .openapi("RejectExpenseSchema");

// Mark expense as paid schema
export const markExpensePaidSchema = z
  .object({
    id: z.string().uuid().openapi({
      description:
        "The unique identifier of the expense approval to mark as paid",
      example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    }),
  })
  .openapi("MarkExpensePaidSchema");

// Update expense approval schema
export const updateExpenseApprovalSchema = z
  .object({
    id: z.string().uuid().openapi({
      description: "The unique identifier of the expense approval to update",
      example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    }),
    transactionId: z.string().uuid().nullable().optional().openapi({
      description: "Optional transaction ID to link to this expense approval",
      example: "c3d4e5f6-a7b8-9012-cdef-345678901234",
    }),
    amount: z.number().positive().optional().openapi({
      description: "The expense amount",
      example: 15000,
    }),
    currency: z.string().min(3).max(3).optional().openapi({
      description: "Currency code (ISO 4217)",
      example: "JPY",
    }),
    note: z.string().nullable().optional().openapi({
      description: "Optional note or description for the expense",
      example: "交通費 - クライアント訪問",
    }),
    metadata: z.record(z.string(), z.any()).optional().openapi({
      description: "Additional metadata for the expense",
      example: { category: "travel", receipt: true },
    }),
  })
  .openapi("UpdateExpenseApprovalSchema");

// Delete expense approval schema
export const deleteExpenseApprovalSchema = z
  .object({
    id: z.string().uuid().openapi({
      description: "The unique identifier of the expense approval to delete",
      example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    }),
  })
  .openapi("DeleteExpenseApprovalSchema");

// Get pending approvals count schema
export const getPendingApprovalsCountSchema = z
  .object({
    approverId: z.string().uuid().optional().openapi({
      description: "Optional approver ID to filter count",
      example: "b2c3d4e5-f6a7-8901-bcde-f23456789012",
      param: { in: "query" },
    }),
  })
  .openapi("GetPendingApprovalsCountSchema");

// Response schemas
export const expenseApprovalSchema = z
  .object({
    id: z.string().uuid().openapi({
      description: "Unique identifier of the expense approval",
      example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    }),
    transactionId: z.string().uuid().nullable().openapi({
      description: "Linked transaction ID",
      example: "c3d4e5f6-a7b8-9012-cdef-345678901234",
    }),
    teamId: z.string().uuid().openapi({
      description: "Team ID",
      example: "d4e5f6a7-b8c9-0123-defg-456789012345",
    }),
    requesterId: z.string().uuid().openapi({
      description: "Requester user ID",
      example: "e5f6a7b8-c9d0-1234-efgh-567890123456",
    }),
    approverId: z.string().uuid().nullable().openapi({
      description: "Approver user ID",
      example: "f6a7b8c9-d0e1-2345-fghi-678901234567",
    }),
    status: expenseApprovalStatusSchema.openapi({
      description: "Current status of the expense approval",
      example: "pending",
    }),
    submittedAt: z.string().nullable().openapi({
      description: "ISO timestamp when the expense was submitted",
      example: "2024-04-15T09:00:00.000Z",
    }),
    approvedAt: z.string().nullable().openapi({
      description: "ISO timestamp when the expense was approved",
      example: "2024-04-16T10:00:00.000Z",
    }),
    rejectedAt: z.string().nullable().openapi({
      description: "ISO timestamp when the expense was rejected",
      example: null,
    }),
    paidAt: z.string().nullable().openapi({
      description: "ISO timestamp when the expense was paid",
      example: null,
    }),
    rejectionReason: z.string().nullable().openapi({
      description: "Reason for rejection (if rejected)",
      example: null,
    }),
    amount: z.number().openapi({
      description: "Expense amount",
      example: 15000,
    }),
    currency: z.string().openapi({
      description: "Currency code",
      example: "JPY",
    }),
    note: z.string().nullable().openapi({
      description: "Note or description",
      example: "交通費 - クライアント訪問",
    }),
    metadata: z.record(z.string(), z.any()).nullable().openapi({
      description: "Additional metadata",
      example: { category: "travel" },
    }),
    createdAt: z.string().openapi({
      description: "ISO timestamp when created",
      example: "2024-04-15T08:00:00.000Z",
    }),
    updatedAt: z.string().openapi({
      description: "ISO timestamp when last updated",
      example: "2024-04-15T09:00:00.000Z",
    }),
  })
  .openapi("ExpenseApprovalSchema");

export const expenseApprovalsResponseSchema = z
  .object({
    data: z.array(expenseApprovalSchema).openapi({
      description: "Array of expense approvals",
    }),
    meta: z
      .object({
        cursor: z.string().nullable().openapi({
          description: "Cursor for pagination (null if no more pages)",
          example: "40",
        }),
        hasPreviousPage: z.boolean().openapi({
          description: "Whether there are previous pages available",
          example: true,
        }),
        hasNextPage: z.boolean().openapi({
          description: "Whether there are more pages available",
          example: false,
        }),
      })
      .openapi({
        description: "Pagination metadata",
      }),
  })
  .openapi("ExpenseApprovalsResponseSchema");
