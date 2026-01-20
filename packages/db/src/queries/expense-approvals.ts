import type { Database, DatabaseOrTransaction } from "@db/client";
import {
  expenseApprovals,
  transactions,
  users,
  type expenseApprovalStatusEnum,
} from "@db/schema";
import { and, desc, eq, gte, inArray, lte, sql } from "drizzle-orm";
import type { SQL } from "drizzle-orm/sql/sql";
import { createActivity } from "./activities";

/**
 * Expense approval type returned from database queries
 * Uses Drizzle's inferred select type for type safety
 */
export type ExpenseApproval = typeof expenseApprovals.$inferSelect;

export type ExpenseApprovalStatus =
  (typeof expenseApprovalStatusEnum.enumValues)[number];

// ============================================================================
// Query Functions
// ============================================================================

export type GetExpenseApprovalsParams = {
  teamId: string;
  cursor?: string | null;
  pageSize?: number;
  status?: ExpenseApprovalStatus | ExpenseApprovalStatus[] | null;
  requesterId?: string | null;
  approverId?: string | null;
  startDate?: string | null;
  endDate?: string | null;
};

/**
 * Get expense approvals with filtering and pagination
 */
export async function getExpenseApprovals(
  db: Database,
  params: GetExpenseApprovalsParams,
) {
  const {
    teamId,
    cursor,
    pageSize = 20,
    status,
    requesterId,
    approverId,
    startDate,
    endDate,
  } = params;

  const offset = cursor ? Number.parseInt(cursor, 10) : 0;

  const whereConditions: SQL[] = [eq(expenseApprovals.teamId, teamId)];

  // Filter by status
  if (status) {
    if (Array.isArray(status)) {
      whereConditions.push(inArray(expenseApprovals.status, status));
    } else {
      whereConditions.push(eq(expenseApprovals.status, status));
    }
  }

  // Filter by requester
  if (requesterId) {
    whereConditions.push(eq(expenseApprovals.requesterId, requesterId));
  }

  // Filter by approver
  if (approverId) {
    whereConditions.push(eq(expenseApprovals.approverId, approverId));
  }

  // Date range filters
  if (startDate) {
    whereConditions.push(gte(expenseApprovals.createdAt, startDate));
  }
  if (endDate) {
    whereConditions.push(lte(expenseApprovals.createdAt, endDate));
  }

  const data = await db
    .select({
      id: expenseApprovals.id,
      transactionId: expenseApprovals.transactionId,
      teamId: expenseApprovals.teamId,
      requesterId: expenseApprovals.requesterId,
      approverId: expenseApprovals.approverId,
      status: expenseApprovals.status,
      submittedAt: expenseApprovals.submittedAt,
      approvedAt: expenseApprovals.approvedAt,
      rejectedAt: expenseApprovals.rejectedAt,
      paidAt: expenseApprovals.paidAt,
      rejectionReason: expenseApprovals.rejectionReason,
      amount: expenseApprovals.amount,
      currency: expenseApprovals.currency,
      note: expenseApprovals.note,
      metadata: expenseApprovals.metadata,
      createdAt: expenseApprovals.createdAt,
      updatedAt: expenseApprovals.updatedAt,
      // Requester info
      requester: {
        id: sql<string>`requester.id`.as("requester_id"),
        fullName: sql<string | null>`requester.full_name`.as(
          "requester_full_name",
        ),
        avatarUrl: sql<string | null>`requester.avatar_url`.as(
          "requester_avatar_url",
        ),
        email: sql<string | null>`requester.email`.as("requester_email"),
      },
      // Approver info
      approver: {
        id: sql<string | null>`approver.id`.as("approver_id"),
        fullName: sql<string | null>`approver.full_name`.as(
          "approver_full_name",
        ),
        avatarUrl: sql<string | null>`approver.avatar_url`.as(
          "approver_avatar_url",
        ),
        email: sql<string | null>`approver.email`.as("approver_email"),
      },
      // Transaction info
      transaction: {
        id: sql<string | null>`${transactions.id}`.as("transaction_id"),
        name: sql<string | null>`${transactions.name}`.as("transaction_name"),
        date: sql<string | null>`${transactions.date}`.as("transaction_date"),
      },
    })
    .from(expenseApprovals)
    .leftJoin(
      sql`${users} AS requester`,
      sql`requester.id = ${expenseApprovals.requesterId}`,
    )
    .leftJoin(
      sql`${users} AS approver`,
      sql`approver.id = ${expenseApprovals.approverId}`,
    )
    .leftJoin(
      transactions,
      eq(expenseApprovals.transactionId, transactions.id),
    )
    .where(and(...whereConditions))
    .orderBy(desc(expenseApprovals.createdAt))
    .limit(pageSize)
    .offset(offset);

  const nextCursor =
    data && data.length === pageSize
      ? (offset + pageSize).toString()
      : undefined;

  return {
    meta: {
      cursor: nextCursor ?? null,
      hasPreviousPage: offset > 0,
      hasNextPage: data && data.length === pageSize,
    },
    data,
  };
}

export type GetExpenseApprovalByIdParams = {
  id: string;
  teamId: string;
};

/**
 * Get a single expense approval by ID
 */
export async function getExpenseApprovalById(
  db: Database,
  params: GetExpenseApprovalByIdParams,
) {
  const [result] = await db
    .select({
      id: expenseApprovals.id,
      transactionId: expenseApprovals.transactionId,
      teamId: expenseApprovals.teamId,
      requesterId: expenseApprovals.requesterId,
      approverId: expenseApprovals.approverId,
      status: expenseApprovals.status,
      submittedAt: expenseApprovals.submittedAt,
      approvedAt: expenseApprovals.approvedAt,
      rejectedAt: expenseApprovals.rejectedAt,
      paidAt: expenseApprovals.paidAt,
      rejectionReason: expenseApprovals.rejectionReason,
      amount: expenseApprovals.amount,
      currency: expenseApprovals.currency,
      note: expenseApprovals.note,
      metadata: expenseApprovals.metadata,
      createdAt: expenseApprovals.createdAt,
      updatedAt: expenseApprovals.updatedAt,
      // Requester info
      requester: {
        id: sql<string>`requester.id`.as("requester_id"),
        fullName: sql<string | null>`requester.full_name`.as(
          "requester_full_name",
        ),
        avatarUrl: sql<string | null>`requester.avatar_url`.as(
          "requester_avatar_url",
        ),
        email: sql<string | null>`requester.email`.as("requester_email"),
      },
      // Approver info
      approver: {
        id: sql<string | null>`approver.id`.as("approver_id"),
        fullName: sql<string | null>`approver.full_name`.as(
          "approver_full_name",
        ),
        avatarUrl: sql<string | null>`approver.avatar_url`.as(
          "approver_avatar_url",
        ),
        email: sql<string | null>`approver.email`.as("approver_email"),
      },
      // Transaction info
      transaction: {
        id: sql<string | null>`${transactions.id}`.as("transaction_id"),
        name: sql<string | null>`${transactions.name}`.as("transaction_name"),
        date: sql<string | null>`${transactions.date}`.as("transaction_date"),
        amount: sql<number | null>`${transactions.amount}`.as(
          "transaction_amount",
        ),
        currency: sql<string | null>`${transactions.currency}`.as(
          "transaction_currency",
        ),
      },
    })
    .from(expenseApprovals)
    .leftJoin(
      sql`${users} AS requester`,
      sql`requester.id = ${expenseApprovals.requesterId}`,
    )
    .leftJoin(
      sql`${users} AS approver`,
      sql`approver.id = ${expenseApprovals.approverId}`,
    )
    .leftJoin(
      transactions,
      eq(expenseApprovals.transactionId, transactions.id),
    )
    .where(
      and(
        eq(expenseApprovals.id, params.id),
        eq(expenseApprovals.teamId, params.teamId),
      ),
    )
    .limit(1);

  return result ?? null;
}

// ============================================================================
// Mutation Functions
// ============================================================================

export type CreateExpenseApprovalParams = {
  teamId: string;
  requesterId: string;
  transactionId?: string;
  amount: number;
  currency: string;
  note?: string;
  metadata?: Record<string, any>;
};

/**
 * Create a new expense approval request (in draft status)
 */
export async function createExpenseApproval(
  db: DatabaseOrTransaction,
  params: CreateExpenseApprovalParams,
) {
  const [result] = await db
    .insert(expenseApprovals)
    .values({
      teamId: params.teamId,
      requesterId: params.requesterId,
      transactionId: params.transactionId,
      amount: params.amount,
      currency: params.currency,
      note: params.note,
      metadata: params.metadata,
      status: "draft",
    })
    .returning();

  return result;
}

export type SubmitExpenseApprovalParams = {
  id: string;
  teamId: string;
  userId: string;
};

/**
 * Submit an expense approval for review (draft -> pending)
 */
export async function submitExpenseApproval(
  db: DatabaseOrTransaction,
  params: SubmitExpenseApprovalParams,
) {
  const [result] = await db
    .update(expenseApprovals)
    .set({
      status: "pending",
      submittedAt: new Date().toISOString(),
    })
    .where(
      and(
        eq(expenseApprovals.id, params.id),
        eq(expenseApprovals.teamId, params.teamId),
        eq(expenseApprovals.status, "draft"),
      ),
    )
    .returning();

  if (result) {
    // Create activity for expense submission
    await createActivity(db, {
      teamId: params.teamId,
      userId: params.userId,
      type: "expense_submitted",
      source: "user",
      priority: 3, // Important notification
      metadata: {
        expenseApprovalId: result.id,
        amount: result.amount,
        currency: result.currency,
      },
    });
  }

  return result ?? null;
}

export type ApproveExpenseParams = {
  id: string;
  teamId: string;
  approverId: string;
};

/**
 * Approve an expense (pending -> approved)
 */
export async function approveExpense(
  db: DatabaseOrTransaction,
  params: ApproveExpenseParams,
) {
  const [result] = await db
    .update(expenseApprovals)
    .set({
      status: "approved",
      approverId: params.approverId,
      approvedAt: new Date().toISOString(),
    })
    .where(
      and(
        eq(expenseApprovals.id, params.id),
        eq(expenseApprovals.teamId, params.teamId),
        eq(expenseApprovals.status, "pending"),
      ),
    )
    .returning();

  if (result) {
    // Create activity for expense approval
    await createActivity(db, {
      teamId: params.teamId,
      userId: params.approverId,
      type: "expense_approved",
      source: "user",
      priority: 3,
      metadata: {
        expenseApprovalId: result.id,
        amount: result.amount,
        currency: result.currency,
        requesterId: result.requesterId,
      },
    });
  }

  return result ?? null;
}

export type RejectExpenseParams = {
  id: string;
  teamId: string;
  approverId: string;
  rejectionReason?: string;
};

/**
 * Reject an expense (pending -> rejected)
 */
export async function rejectExpense(
  db: DatabaseOrTransaction,
  params: RejectExpenseParams,
) {
  const [result] = await db
    .update(expenseApprovals)
    .set({
      status: "rejected",
      approverId: params.approverId,
      rejectedAt: new Date().toISOString(),
      rejectionReason: params.rejectionReason,
    })
    .where(
      and(
        eq(expenseApprovals.id, params.id),
        eq(expenseApprovals.teamId, params.teamId),
        eq(expenseApprovals.status, "pending"),
      ),
    )
    .returning();

  if (result) {
    // Create activity for expense rejection
    await createActivity(db, {
      teamId: params.teamId,
      userId: params.approverId,
      type: "expense_rejected",
      source: "user",
      priority: 3,
      metadata: {
        expenseApprovalId: result.id,
        amount: result.amount,
        currency: result.currency,
        requesterId: result.requesterId,
        rejectionReason: params.rejectionReason,
      },
    });
  }

  return result ?? null;
}

export type MarkExpensePaidParams = {
  id: string;
  teamId: string;
  userId: string;
};

/**
 * Mark an approved expense as paid (approved -> paid)
 */
export async function markExpensePaid(
  db: DatabaseOrTransaction,
  params: MarkExpensePaidParams,
) {
  const [result] = await db
    .update(expenseApprovals)
    .set({
      status: "paid",
      paidAt: new Date().toISOString(),
    })
    .where(
      and(
        eq(expenseApprovals.id, params.id),
        eq(expenseApprovals.teamId, params.teamId),
        eq(expenseApprovals.status, "approved"),
      ),
    )
    .returning();

  if (result) {
    // Create activity for expense payment
    await createActivity(db, {
      teamId: params.teamId,
      userId: params.userId,
      type: "expense_paid",
      source: "user",
      priority: 5,
      metadata: {
        expenseApprovalId: result.id,
        amount: result.amount,
        currency: result.currency,
        requesterId: result.requesterId,
      },
    });
  }

  return result ?? null;
}

export type UpdateExpenseApprovalParams = {
  id: string;
  teamId: string;
  note?: string | null;
  amount?: number;
  currency?: string;
  transactionId?: string | null;
  metadata?: Record<string, any>;
};

/**
 * Update an expense approval (only in draft status)
 */
export async function updateExpenseApproval(
  db: Database,
  params: UpdateExpenseApprovalParams,
) {
  const { id, teamId, ...dataToUpdate } = params;

  const [result] = await db
    .update(expenseApprovals)
    .set(dataToUpdate)
    .where(
      and(
        eq(expenseApprovals.id, id),
        eq(expenseApprovals.teamId, teamId),
        eq(expenseApprovals.status, "draft"), // Can only update drafts
      ),
    )
    .returning();

  return result ?? null;
}

export type DeleteExpenseApprovalParams = {
  id: string;
  teamId: string;
};

/**
 * Delete an expense approval (only in draft status)
 */
export async function deleteExpenseApproval(
  db: Database,
  params: DeleteExpenseApprovalParams,
) {
  const [result] = await db
    .delete(expenseApprovals)
    .where(
      and(
        eq(expenseApprovals.id, params.id),
        eq(expenseApprovals.teamId, params.teamId),
        eq(expenseApprovals.status, "draft"), // Can only delete drafts
      ),
    )
    .returning({
      id: expenseApprovals.id,
    });

  return result ?? null;
}

// ============================================================================
// Count Functions
// ============================================================================

export type GetPendingApprovalsCountParams = {
  teamId: string;
  approverId?: string;
};

/**
 * Get count of pending expense approvals
 */
export async function getPendingApprovalsCount(
  db: Database,
  params: GetPendingApprovalsCountParams,
) {
  const whereConditions: SQL[] = [
    eq(expenseApprovals.teamId, params.teamId),
    eq(expenseApprovals.status, "pending"),
  ];

  // If approverId is provided, we could filter by approver role
  // For now, we return all pending approvals for the team

  const [result] = await db
    .select({
      count: sql<number>`COUNT(*)`.as("count"),
    })
    .from(expenseApprovals)
    .where(and(...whereConditions));

  return result?.count ?? 0;
}

export type GetExpenseApprovalsByRequesterParams = {
  teamId: string;
  requesterId: string;
  status?: ExpenseApprovalStatus | ExpenseApprovalStatus[] | null;
};

/**
 * Get expense approvals by requester
 */
export async function getExpenseApprovalsByRequester(
  db: Database,
  params: GetExpenseApprovalsByRequesterParams,
) {
  const whereConditions: SQL[] = [
    eq(expenseApprovals.teamId, params.teamId),
    eq(expenseApprovals.requesterId, params.requesterId),
  ];

  if (params.status) {
    if (Array.isArray(params.status)) {
      whereConditions.push(inArray(expenseApprovals.status, params.status));
    } else {
      whereConditions.push(eq(expenseApprovals.status, params.status));
    }
  }

  return db
    .select()
    .from(expenseApprovals)
    .where(and(...whereConditions))
    .orderBy(desc(expenseApprovals.createdAt));
}
