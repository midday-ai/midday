import {
  approveExpenseSchema,
  createExpenseApprovalSchema,
  deleteExpenseApprovalSchema,
  getExpenseApprovalByIdSchema,
  getExpenseApprovalsSchema,
  getPendingApprovalsCountSchema,
  markExpensePaidSchema,
  rejectExpenseSchema,
  submitExpenseApprovalSchema,
  updateExpenseApprovalSchema,
} from "@api/schemas/expense-approvals";
import { createTRPCRouter, protectedProcedure } from "@api/trpc/init";
import {
  approveExpense,
  createExpenseApproval,
  deleteExpenseApproval,
  getExpenseApprovalById,
  getExpenseApprovals,
  getPendingApprovalsCount,
  markExpensePaid,
  rejectExpense,
  submitExpenseApproval,
  updateExpenseApproval,
} from "@midday/db/queries";
import { usersOnTeam } from "@midday/db/schema";
import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";

/**
 * Check if user has approver permission (owner or approver role)
 */
async function hasApproverPermission(
  db: Parameters<typeof approveExpense>[0],
  userId: string,
  teamId: string,
): Promise<boolean> {
  const membership = await db.query.usersOnTeam.findFirst({
    where: and(
      eq(usersOnTeam.userId, userId),
      eq(usersOnTeam.teamId, teamId),
    ),
    columns: {
      role: true,
    },
  });

  if (!membership) {
    return false;
  }

  return membership.role === "owner" || membership.role === "approver";
}

export const expenseApprovalsRouter = createTRPCRouter({
  /**
   * List expense approvals with filtering and pagination
   */
  list: protectedProcedure
    .input(getExpenseApprovalsSchema.optional())
    .query(async ({ ctx: { teamId, db }, input }) => {
      return getExpenseApprovals(db, {
        teamId: teamId!,
        ...input,
      });
    }),

  /**
   * Get a single expense approval by ID
   */
  getById: protectedProcedure
    .input(getExpenseApprovalByIdSchema)
    .query(async ({ ctx: { teamId, db }, input }) => {
      const result = await getExpenseApprovalById(db, {
        id: input.id,
        teamId: teamId!,
      });

      if (!result) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Expense approval not found",
        });
      }

      return result;
    }),

  /**
   * Create a new expense approval (in draft status)
   */
  create: protectedProcedure
    .input(createExpenseApprovalSchema)
    .mutation(async ({ ctx: { teamId, db, session }, input }) => {
      const result = await createExpenseApproval(db, {
        teamId: teamId!,
        requesterId: session.user.id,
        ...input,
      });

      if (!result) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create expense approval",
        });
      }

      return result;
    }),

  /**
   * Update an expense approval (only in draft status)
   */
  update: protectedProcedure
    .input(updateExpenseApprovalSchema)
    .mutation(async ({ ctx: { teamId, db }, input }) => {
      const result = await updateExpenseApproval(db, {
        teamId: teamId!,
        ...input,
      });

      if (!result) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Expense approval not found or cannot be updated",
        });
      }

      return result;
    }),

  /**
   * Delete an expense approval (only in draft status)
   */
  delete: protectedProcedure
    .input(deleteExpenseApprovalSchema)
    .mutation(async ({ ctx: { teamId, db }, input }) => {
      const result = await deleteExpenseApproval(db, {
        id: input.id,
        teamId: teamId!,
      });

      if (!result) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Expense approval not found or cannot be deleted",
        });
      }

      return result;
    }),

  /**
   * Submit an expense approval for review (draft -> pending)
   */
  submit: protectedProcedure
    .input(submitExpenseApprovalSchema)
    .mutation(async ({ ctx: { teamId, db, session }, input }) => {
      const result = await submitExpenseApproval(db, {
        id: input.id,
        teamId: teamId!,
        userId: session.user.id,
      });

      if (!result) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Expense approval not found or cannot be submitted",
        });
      }

      return result;
    }),

  /**
   * Approve an expense (pending -> approved)
   * Only users with approver role can approve
   */
  approve: protectedProcedure
    .input(approveExpenseSchema)
    .mutation(async ({ ctx: { teamId, db, session }, input }) => {
      // Check if user has approver permission (owner or approver role)
      const canApprove = await hasApproverPermission(
        db,
        session.user.id,
        teamId!,
      );

      if (!canApprove) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to approve expenses. Only owners and approvers can approve.",
        });
      }

      const result = await approveExpense(db, {
        id: input.id,
        teamId: teamId!,
        approverId: session.user.id,
      });

      if (!result) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Expense approval not found or cannot be approved",
        });
      }

      return result;
    }),

  /**
   * Reject an expense (pending -> rejected)
   * Only users with approver role can reject
   */
  reject: protectedProcedure
    .input(rejectExpenseSchema)
    .mutation(async ({ ctx: { teamId, db, session }, input }) => {
      // Check if user has approver permission (owner or approver role)
      const canReject = await hasApproverPermission(
        db,
        session.user.id,
        teamId!,
      );

      if (!canReject) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to reject expenses. Only owners and approvers can reject.",
        });
      }

      const result = await rejectExpense(db, {
        id: input.id,
        teamId: teamId!,
        approverId: session.user.id,
        rejectionReason: input.rejectionReason,
      });

      if (!result) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Expense approval not found or cannot be rejected",
        });
      }

      return result;
    }),

  /**
   * Mark an approved expense as paid (approved -> paid)
   */
  markPaid: protectedProcedure
    .input(markExpensePaidSchema)
    .mutation(async ({ ctx: { teamId, db, session }, input }) => {
      const result = await markExpensePaid(db, {
        id: input.id,
        teamId: teamId!,
        userId: session.user.id,
      });

      if (!result) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Expense approval not found or cannot be marked as paid",
        });
      }

      return result;
    }),

  /**
   * Get count of pending expense approvals
   */
  pendingCount: protectedProcedure
    .input(getPendingApprovalsCountSchema.optional())
    .query(async ({ ctx: { teamId, db }, input }) => {
      return getPendingApprovalsCount(db, {
        teamId: teamId!,
        ...input,
      });
    }),
});
