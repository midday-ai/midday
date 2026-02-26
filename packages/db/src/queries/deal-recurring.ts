import type { Database, DatabaseOrTransaction } from "@db/client";
import {
  merchants,
  dealRecurring,
  dealRecurringStatusEnum,
  deals,
  teams,
} from "@db/schema";
import {
  type DealRecurringEndType,
  type DealRecurringFrequency,
  type RecurringDealParams,
  advanceToFutureDate,
  calculateFirstScheduledDate,
  calculateNextScheduledDate,
  calculateUpcomingDates,
  shouldMarkCompleted,
} from "@db/utils/deal-recurring";
import { and, desc, eq, gt, inArray, isNull, lte, or, sql } from "drizzle-orm";

export type CreateDealRecurringParams = {
  teamId: string;
  userId: string;
  merchantId?: string | null;
  merchantName?: string | null;
  frequency: DealRecurringFrequency;
  frequencyDay?: number | null;
  frequencyWeek?: number | null;
  frequencyInterval?: number | null;
  endType: DealRecurringEndType;
  endDate?: string | null;
  endCount?: number | null;
  timezone: string;
  dueDateOffset?: number;
  amount?: number | null;
  currency?: string | null;
  lineItems?: unknown;
  template?: unknown;
  paymentDetails?: unknown;
  fromDetails?: unknown;
  noteDetails?: unknown;
  discount?: number | null;
  subtotal?: number | null;
  topBlock?: unknown;
  bottomBlock?: unknown;
  templateId?: string | null;
  /**
   * Optional issue date for the first deal.
   * If provided and in the future, the first deal will be scheduled for this date.
   * If not provided or in the past, the first deal is generated immediately.
   */
  issueDate?: string | null;
};

export async function createDealRecurring(
  db: DatabaseOrTransaction,
  params: CreateDealRecurringParams,
) {
  const {
    teamId,
    userId,
    merchantId,
    merchantName,
    frequency,
    frequencyDay,
    frequencyWeek,
    frequencyInterval,
    endType,
    endDate,
    endCount,
    timezone,
    dueDateOffset = 30,
    amount,
    currency,
    lineItems,
    template,
    paymentDetails,
    fromDetails,
    noteDetails,
    discount,
    subtotal,
    topBlock,
    bottomBlock,
    templateId,
    issueDate,
  } = params;

  // Calculate the first scheduled date based on issue date
  // If issue date is in the future, schedule for that date; otherwise generate immediately
  const now = new Date();
  const recurringParams: RecurringDealParams = {
    frequency,
    frequencyDay: frequencyDay ?? null,
    frequencyWeek: frequencyWeek ?? null,
    frequencyInterval: frequencyInterval ?? null,
    timezone,
  };

  // Use provided issue date or default to now
  const issueDateParsed = issueDate ? new Date(issueDate) : now;
  const firstScheduledAt = calculateFirstScheduledDate(
    recurringParams,
    issueDateParsed,
    now,
  );

  const [result] = await db
    .insert(dealRecurring)
    .values({
      teamId,
      userId,
      merchantId,
      merchantName,
      frequency,
      frequencyDay,
      frequencyWeek,
      frequencyInterval,
      endType,
      endDate,
      endCount,
      timezone,
      dueDateOffset,
      amount,
      currency,
      lineItems,
      template,
      paymentDetails,
      fromDetails,
      noteDetails,
      discount,
      subtotal,
      topBlock,
      bottomBlock,
      templateId,
      status: "active",
      dealsGenerated: 0,
      nextScheduledAt: firstScheduledAt.toISOString(),
    })
    .returning();

  return result;
}

export type UpdateDealRecurringParams = {
  id: string;
  teamId: string;
  merchantId?: string | null;
  merchantName?: string | null;
  frequency?: DealRecurringFrequency;
  frequencyDay?: number | null;
  frequencyWeek?: number | null;
  frequencyInterval?: number | null;
  endType?: DealRecurringEndType;
  endDate?: string | null;
  endCount?: number | null;
  timezone?: string;
  dueDateOffset?: number;
  amount?: number | null;
  currency?: string | null;
  lineItems?: unknown;
  template?: unknown;
  paymentDetails?: unknown;
  fromDetails?: unknown;
  noteDetails?: unknown;
  discount?: number | null;
  subtotal?: number | null;
  topBlock?: unknown;
  bottomBlock?: unknown;
  templateId?: string | null;
  status?: "active" | "paused" | "completed" | "canceled";
  dealsGenerated?: number;
  // Optional explicit scheduling fields (used when linking existing deal)
  nextScheduledAt?: string;
  lastGeneratedAt?: string;
};

export async function updateDealRecurring(
  db: DatabaseOrTransaction,
  params: UpdateDealRecurringParams,
) {
  const {
    id,
    teamId,
    nextScheduledAt: explicitNextScheduledAt,
    lastGeneratedAt: explicitLastGeneratedAt,
    ...updateData
  } = params;

  // Check if frequency-related fields are being updated
  const frequencyFieldsChanged =
    params.frequency !== undefined ||
    params.frequencyDay !== undefined ||
    params.frequencyWeek !== undefined ||
    params.frequencyInterval !== undefined;

  // Check if end type or condition fields are being updated
  const endConditionsChanged =
    params.endType !== undefined ||
    params.endDate !== undefined ||
    params.endCount !== undefined;

  // If explicit nextScheduledAt is provided, use it; otherwise auto-calculate if frequency changed
  let nextScheduledAt: string | undefined = explicitNextScheduledAt;

  // Fetch current record if we need to merge/validate
  let current:
    | (typeof dealRecurring.$inferSelect & Record<string, unknown>)
    | null = null;

  if (frequencyFieldsChanged || endConditionsChanged) {
    const [fetchedCurrent] = await db
      .select()
      .from(dealRecurring)
      .where(
        and(eq(dealRecurring.id, id), eq(dealRecurring.teamId, teamId)),
      );
    current = fetchedCurrent ?? null;
  }

  // Validate merged end conditions
  if (current && endConditionsChanged) {
    const mergedEndType = params.endType ?? current.endType;
    const mergedEndDate =
      params.endDate !== undefined ? params.endDate : current.endDate;
    const mergedEndCount =
      params.endCount !== undefined ? params.endCount : current.endCount;

    // Validate: endDate required when endType is 'on_date'
    if (mergedEndType === "on_date" && !mergedEndDate) {
      throw new Error("endDate is required when endType is 'on_date'");
    }

    // Validate: endCount required when endType is 'after_count'
    if (mergedEndType === "after_count" && !mergedEndCount) {
      throw new Error("endCount is required when endType is 'after_count'");
    }
  }

  // Calculate nextScheduledAt if frequency changed and series is active
  if (!nextScheduledAt && frequencyFieldsChanged && current) {
    if (current.status === "active") {
      const recurringParams: RecurringDealParams = {
        frequency: params.frequency ?? current.frequency,
        frequencyDay:
          params.frequencyDay !== undefined
            ? params.frequencyDay
            : current.frequencyDay,
        frequencyWeek:
          params.frequencyWeek !== undefined
            ? params.frequencyWeek
            : current.frequencyWeek,
        frequencyInterval:
          params.frequencyInterval !== undefined
            ? params.frequencyInterval
            : current.frequencyInterval,
        timezone: params.timezone ?? current.timezone,
      };

      const nextDate = calculateNextScheduledDate(recurringParams, new Date());
      nextScheduledAt = nextDate.toISOString();
    }
  }

  const [result] = await db
    .update(dealRecurring)
    .set({
      ...updateData,
      ...(nextScheduledAt && { nextScheduledAt }),
      ...(explicitLastGeneratedAt && {
        lastGeneratedAt: explicitLastGeneratedAt,
      }),
      updatedAt: new Date().toISOString(),
    })
    .where(
      and(eq(dealRecurring.id, id), eq(dealRecurring.teamId, teamId)),
    )
    .returning();

  return result;
}

export type GetDealRecurringByIdParams = {
  id: string;
  teamId: string;
};

export async function getDealRecurringById(
  db: Database,
  params: GetDealRecurringByIdParams,
) {
  const { id, teamId } = params;

  const [result] = await db
    .select({
      id: dealRecurring.id,
      createdAt: dealRecurring.createdAt,
      updatedAt: dealRecurring.updatedAt,
      teamId: dealRecurring.teamId,
      userId: dealRecurring.userId,
      merchantId: dealRecurring.merchantId,
      frequency: dealRecurring.frequency,
      frequencyDay: dealRecurring.frequencyDay,
      frequencyWeek: dealRecurring.frequencyWeek,
      frequencyInterval: dealRecurring.frequencyInterval,
      endType: dealRecurring.endType,
      endDate: dealRecurring.endDate,
      endCount: dealRecurring.endCount,
      status: dealRecurring.status,
      dealsGenerated: dealRecurring.dealsGenerated,
      nextScheduledAt: dealRecurring.nextScheduledAt,
      lastGeneratedAt: dealRecurring.lastGeneratedAt,
      timezone: dealRecurring.timezone,
      dueDateOffset: dealRecurring.dueDateOffset,
      amount: dealRecurring.amount,
      currency: dealRecurring.currency,
      lineItems: dealRecurring.lineItems,
      template: dealRecurring.template,
      paymentDetails: dealRecurring.paymentDetails,
      fromDetails: dealRecurring.fromDetails,
      noteDetails: dealRecurring.noteDetails,
      merchantName: dealRecurring.merchantName,
      discount: dealRecurring.discount,
      subtotal: dealRecurring.subtotal,
      topBlock: dealRecurring.topBlock,
      bottomBlock: dealRecurring.bottomBlock,
      templateId: dealRecurring.templateId,
      merchant: {
        id: merchants.id,
        name: merchants.name,
        email: merchants.email,
        website: merchants.website,
      },
    })
    .from(dealRecurring)
    .leftJoin(merchants, eq(dealRecurring.merchantId, merchants.id))
    .where(
      and(eq(dealRecurring.id, id), eq(dealRecurring.teamId, teamId)),
    );

  if (!result) {
    return null;
  }

  return result;
}

export type GetDealRecurringListParams = {
  teamId: string;
  status?: ("active" | "paused" | "completed" | "canceled")[];
  merchantId?: string;
  cursor?: string | null;
  pageSize?: number;
};

export async function getDealRecurringList(
  db: Database,
  params: GetDealRecurringListParams,
) {
  const { teamId, status, merchantId, cursor, pageSize = 25 } = params;

  const conditions = [eq(dealRecurring.teamId, teamId)];

  if (status && status.length > 0) {
    const validStatuses = status.filter((s) =>
      dealRecurringStatusEnum.enumValues.includes(s),
    );
    if (validStatuses.length > 0) {
      conditions.push(inArray(dealRecurring.status, validStatuses));
    }
  }

  if (merchantId) {
    conditions.push(eq(dealRecurring.merchantId, merchantId));
  }

  const offset = cursor ? Number.parseInt(cursor, 10) : 0;

  const data = await db
    .select({
      id: dealRecurring.id,
      createdAt: dealRecurring.createdAt,
      merchantId: dealRecurring.merchantId,
      merchantName: dealRecurring.merchantName,
      frequency: dealRecurring.frequency,
      frequencyDay: dealRecurring.frequencyDay,
      frequencyWeek: dealRecurring.frequencyWeek,
      endType: dealRecurring.endType,
      endCount: dealRecurring.endCount,
      status: dealRecurring.status,
      dealsGenerated: dealRecurring.dealsGenerated,
      nextScheduledAt: dealRecurring.nextScheduledAt,
      amount: dealRecurring.amount,
      currency: dealRecurring.currency,
      merchant: {
        id: merchants.id,
        name: merchants.name,
        email: merchants.email,
      },
    })
    .from(dealRecurring)
    .leftJoin(merchants, eq(dealRecurring.merchantId, merchants.id))
    .where(and(...conditions))
    .orderBy(desc(dealRecurring.createdAt))
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

/**
 * Default batch size for processing recurring deals
 * Prevents overwhelming the system when many deals are due at once
 */
const DEFAULT_BATCH_SIZE = 50;

/**
 * Get recurring deals that are due for generation
 * Used by the scheduler to find deals that need to be generated
 *
 * @param db - Database instance
 * @param options.limit - Maximum number of records to return (default: 50)
 * @returns Object with data array and hasMore flag for pagination awareness
 */
export async function getDueDealRecurring(
  db: Database,
  options?: { limit?: number },
) {
  const now = new Date().toISOString();
  const limit = options?.limit ?? DEFAULT_BATCH_SIZE;

  // Fetch limit + 1 to check if there are more records
  const data = await db
    .select({
      id: dealRecurring.id,
      teamId: dealRecurring.teamId,
      userId: dealRecurring.userId,
      merchantId: dealRecurring.merchantId,
      merchantName: dealRecurring.merchantName,
      frequency: dealRecurring.frequency,
      frequencyDay: dealRecurring.frequencyDay,
      frequencyWeek: dealRecurring.frequencyWeek,
      frequencyInterval: dealRecurring.frequencyInterval,
      endType: dealRecurring.endType,
      endDate: dealRecurring.endDate,
      endCount: dealRecurring.endCount,
      dealsGenerated: dealRecurring.dealsGenerated,
      nextScheduledAt: dealRecurring.nextScheduledAt,
      timezone: dealRecurring.timezone,
      dueDateOffset: dealRecurring.dueDateOffset,
      amount: dealRecurring.amount,
      currency: dealRecurring.currency,
      lineItems: dealRecurring.lineItems,
      template: dealRecurring.template,
      paymentDetails: dealRecurring.paymentDetails,
      fromDetails: dealRecurring.fromDetails,
      noteDetails: dealRecurring.noteDetails,
      discount: dealRecurring.discount,
      subtotal: dealRecurring.subtotal,
      topBlock: dealRecurring.topBlock,
      bottomBlock: dealRecurring.bottomBlock,
      templateId: dealRecurring.templateId,
    })
    .from(dealRecurring)
    .where(
      and(
        eq(dealRecurring.status, "active"),
        lte(dealRecurring.nextScheduledAt, now),
      ),
    )
    // Order by nextScheduledAt to process oldest first (fairness)
    .orderBy(dealRecurring.nextScheduledAt)
    .limit(limit + 1);

  const hasMore = data.length > limit;
  const records = hasMore ? data.slice(0, limit) : data;

  return {
    data: records,
    hasMore,
  };
}

/**
 * Mark a recurring deal as generated and update the next scheduled date
 * This should be called after successfully generating a deal
 */
export type MarkDealGeneratedParams = {
  id: string;
  teamId: string;
};

export async function markDealGenerated(
  db: DatabaseOrTransaction,
  params: MarkDealGeneratedParams,
) {
  const { id, teamId } = params;

  // Get current recurring deal data
  const [current] = await db
    .select()
    .from(dealRecurring)
    .where(
      and(eq(dealRecurring.id, id), eq(dealRecurring.teamId, teamId)),
    );

  if (!current) {
    return null;
  }

  const now = new Date();
  const newDealsGenerated = current.dealsGenerated + 1;

  // Calculate next scheduled date
  const recurringParams: RecurringDealParams = {
    frequency: current.frequency,
    frequencyDay: current.frequencyDay,
    frequencyWeek: current.frequencyWeek,
    frequencyInterval: current.frequencyInterval,
    timezone: current.timezone,
  };

  // Use the original scheduled time as the base to preserve the intended schedule pattern
  // (e.g., biweekly deals stay on the same weekday, monthly on the same date)
  const baseDate = current.nextScheduledAt
    ? new Date(current.nextScheduledAt)
    : now;

  const initialNextDate = calculateNextScheduledDate(recurringParams, baseDate);

  // Advance to future if scheduler ran late (prevents catch-up loop)
  const { date: nextScheduledAt } = advanceToFutureDate(
    recurringParams,
    initialNextDate,
    now,
  );

  // Check if series should be completed
  const isCompleted = shouldMarkCompleted(
    current.endType,
    current.endDate ? new Date(current.endDate) : null,
    current.endCount,
    newDealsGenerated,
    nextScheduledAt,
  );

  const [result] = await db
    .update(dealRecurring)
    .set({
      dealsGenerated: newDealsGenerated,
      consecutiveFailures: 0, // Reset failures on successful generation
      lastGeneratedAt: now.toISOString(),
      nextScheduledAt: isCompleted ? null : nextScheduledAt.toISOString(),
      status: isCompleted ? "completed" : "active",
      updatedAt: now.toISOString(),
    })
    .where(
      and(eq(dealRecurring.id, id), eq(dealRecurring.teamId, teamId)),
    )
    .returning();

  return result;
}

/**
 * Maximum consecutive failures before auto-pausing
 */
const MAX_CONSECUTIVE_FAILURES = 3;

/**
 * Record a failure for a recurring deal series
 * Auto-pauses after MAX_CONSECUTIVE_FAILURES
 * @returns Object with updated record and whether it was auto-paused
 */
export async function recordDealGenerationFailure(
  db: Database,
  params: { id: string; teamId: string },
): Promise<{
  result: typeof dealRecurring.$inferSelect | null;
  autoPaused: boolean;
}> {
  const { id, teamId } = params;

  // Get current data
  const [current] = await db
    .select()
    .from(dealRecurring)
    .where(
      and(eq(dealRecurring.id, id), eq(dealRecurring.teamId, teamId)),
    );

  if (!current) {
    return { result: null, autoPaused: false };
  }

  const newFailureCount = current.consecutiveFailures + 1;
  const shouldAutoPause = newFailureCount >= MAX_CONSECUTIVE_FAILURES;

  const [result] = await db
    .update(dealRecurring)
    .set({
      consecutiveFailures: newFailureCount,
      status: shouldAutoPause ? "paused" : current.status,
      updatedAt: new Date().toISOString(),
    })
    .where(
      and(eq(dealRecurring.id, id), eq(dealRecurring.teamId, teamId)),
    )
    .returning();

  return { result: result ?? null, autoPaused: shouldAutoPause };
}

/**
 * Pause a recurring deal series
 */
export async function pauseDealRecurring(
  db: DatabaseOrTransaction,
  params: { id: string; teamId: string },
) {
  const { id, teamId } = params;

  const [result] = await db
    .update(dealRecurring)
    .set({
      status: "paused",
      updatedAt: new Date().toISOString(),
    })
    .where(
      and(eq(dealRecurring.id, id), eq(dealRecurring.teamId, teamId)),
    )
    .returning();

  return result;
}

/**
 * Resume a paused recurring deal series
 * Validates that the series hasn't already completed before resuming
 */
export async function resumeDealRecurring(
  db: Database,
  params: { id: string; teamId: string },
) {
  const { id, teamId } = params;

  // Get current data to recalculate next scheduled date
  const [current] = await db
    .select()
    .from(dealRecurring)
    .where(
      and(eq(dealRecurring.id, id), eq(dealRecurring.teamId, teamId)),
    );

  if (!current || current.status !== "paused") {
    return null;
  }

  // Calculate next scheduled date from now
  const now = new Date();
  const recurringParams: RecurringDealParams = {
    frequency: current.frequency,
    frequencyDay: current.frequencyDay,
    frequencyWeek: current.frequencyWeek,
    frequencyInterval: current.frequencyInterval,
    timezone: current.timezone,
  };

  const nextScheduledAt = calculateNextScheduledDate(recurringParams, now);

  // Check if series should actually be completed (end conditions may have been met while paused)
  const isCompleted = shouldMarkCompleted(
    current.endType,
    current.endDate ? new Date(current.endDate) : null,
    current.endCount,
    current.dealsGenerated,
    nextScheduledAt,
  );

  if (isCompleted) {
    // Mark as completed instead of resuming
    const [result] = await db
      .update(dealRecurring)
      .set({
        status: "completed",
        nextScheduledAt: null,
        updatedAt: now.toISOString(),
      })
      .where(
        and(eq(dealRecurring.id, id), eq(dealRecurring.teamId, teamId)),
      )
      .returning();

    return result;
  }

  const [result] = await db
    .update(dealRecurring)
    .set({
      status: "active",
      consecutiveFailures: 0, // Reset failures on resume
      nextScheduledAt: nextScheduledAt.toISOString(),
      updatedAt: now.toISOString(),
    })
    .where(
      and(eq(dealRecurring.id, id), eq(dealRecurring.teamId, teamId)),
    )
    .returning();

  return result;
}

/**
 * Delete a recurring deal series (soft delete by setting status to canceled)
 * Generated deals are kept
 */
export async function deleteDealRecurring(
  db: DatabaseOrTransaction,
  params: { id: string; teamId: string },
) {
  const { id, teamId } = params;

  const [result] = await db
    .update(dealRecurring)
    .set({
      status: "canceled",
      nextScheduledAt: null,
      updatedAt: new Date().toISOString(),
    })
    .where(
      and(eq(dealRecurring.id, id), eq(dealRecurring.teamId, teamId)),
    )
    .returning();

  return result;
}

/**
 * Get upcoming deal preview for a recurring series
 */
export type GetUpcomingDealsParams = {
  id: string;
  teamId: string;
  limit?: number;
};

export async function getUpcomingDeals(
  db: Database,
  params: GetUpcomingDealsParams,
) {
  const { id, teamId, limit = 10 } = params;

  const recurring = await getDealRecurringById(db, { id, teamId });

  if (!recurring) {
    return null;
  }

  const recurringParams: RecurringDealParams = {
    frequency: recurring.frequency,
    frequencyDay: recurring.frequencyDay,
    frequencyWeek: recurring.frequencyWeek,
    frequencyInterval: recurring.frequencyInterval,
    timezone: recurring.timezone,
  };

  const startDate = recurring.nextScheduledAt
    ? new Date(recurring.nextScheduledAt)
    : new Date();

  return calculateUpcomingDates(
    recurringParams,
    startDate,
    recurring.amount ?? 0,
    recurring.currency ?? "USD",
    recurring.endType,
    recurring.endDate ? new Date(recurring.endDate) : null,
    recurring.endCount,
    recurring.dealsGenerated,
    limit,
  );
}

/**
 * Check if a deal already exists for a recurring series and sequence number
 * Used for idempotency
 *
 * Returns:
 * - null if no deal exists for this sequence
 * - { id, status, dealNumber } if a deal exists
 *
 * This allows the caller to decide whether to:
 * - Create a new deal (if null)
 * - Send an existing draft (if status is 'draft')
 * - Skip entirely (if already sent/paid)
 */
export async function checkDealExists(
  db: Database,
  params: { dealRecurringId: string; recurringSequence: number },
) {
  const { dealRecurringId, recurringSequence } = params;

  const [result] = await db
    .select({
      id: deals.id,
      status: deals.status,
      dealNumber: deals.dealNumber,
    })
    .from(deals)
    .where(
      and(
        eq(deals.dealRecurringId, dealRecurringId),
        eq(deals.recurringSequence, recurringSequence),
      ),
    )
    .limit(1);

  return result ?? null;
}

/**
 * Get recurring deal info for a deal (for display in deal details)
 */
export async function getDealRecurringInfo(
  db: Database,
  params: { dealId: string },
) {
  const { dealId } = params;

  const [deal] = await db
    .select({
      dealRecurringId: deals.dealRecurringId,
      recurringSequence: deals.recurringSequence,
    })
    .from(deals)
    .where(eq(deals.id, dealId));

  if (!deal?.dealRecurringId) {
    return null;
  }

  const [recurring] = await db
    .select({
      frequency: dealRecurring.frequency,
      frequencyDay: dealRecurring.frequencyDay,
      frequencyWeek: dealRecurring.frequencyWeek,
      endType: dealRecurring.endType,
      endCount: dealRecurring.endCount,
      dealsGenerated: dealRecurring.dealsGenerated,
      nextScheduledAt: dealRecurring.nextScheduledAt,
      status: dealRecurring.status,
    })
    .from(dealRecurring)
    .where(eq(dealRecurring.id, deal.dealRecurringId));

  if (!recurring) {
    return null;
  }

  return {
    recurringId: deal.dealRecurringId,
    sequence: deal.recurringSequence,
    totalCount: recurring.endType === "after_count" ? recurring.endCount : null,
    frequency: recurring.frequency,
    frequencyDay: recurring.frequencyDay,
    frequencyWeek: recurring.frequencyWeek,
    nextScheduledAt: recurring.nextScheduledAt,
    status: recurring.status,
  };
}

/**
 * Get recurring deals that are upcoming within the specified hours
 * and haven't had their upcoming notification sent yet
 * Used by the scheduler to send 24-hour advance notifications
 *
 * @param db - Database instance
 * @param hoursAhead - Hours to look ahead (default: 24)
 * @param options.limit - Maximum number of records to return (default: 100)
 * @returns Object with data array and hasMore flag
 */
export async function getUpcomingDueRecurring(
  db: Database,
  hoursAhead = 24,
  options?: { limit?: number },
) {
  const now = new Date();
  const futureDate = new Date(now.getTime() + hoursAhead * 60 * 60 * 1000);
  const limit = options?.limit ?? 100;

  // Find active series due within hoursAhead that haven't had notification sent
  // for this specific upcoming cycle
  const data = await db
    .select({
      id: dealRecurring.id,
      teamId: dealRecurring.teamId,
      userId: dealRecurring.userId,
      merchantId: dealRecurring.merchantId,
      merchantName: dealRecurring.merchantName,
      frequency: dealRecurring.frequency,
      nextScheduledAt: dealRecurring.nextScheduledAt,
      amount: dealRecurring.amount,
      currency: dealRecurring.currency,
      upcomingNotificationSentAt: dealRecurring.upcomingNotificationSentAt,
    })
    .from(dealRecurring)
    .where(
      and(
        eq(dealRecurring.status, "active"),
        // Due within the look-ahead window
        gt(dealRecurring.nextScheduledAt, now.toISOString()),
        lte(dealRecurring.nextScheduledAt, futureDate.toISOString()),
        // Notification not sent yet, or was sent for a previous cycle
        // (upcomingNotificationSentAt < nextScheduledAt - 24h means it was for a previous cycle)
        or(
          isNull(dealRecurring.upcomingNotificationSentAt),
          lte(
            dealRecurring.upcomingNotificationSentAt,
            // If notification was sent more than hoursAhead before current nextScheduledAt,
            // it was for a previous cycle
            sql`${dealRecurring.nextScheduledAt}::timestamptz - interval '${sql.raw(String(hoursAhead + 1))} hours'`,
          ),
        ),
      ),
    )
    .orderBy(dealRecurring.nextScheduledAt)
    .limit(limit + 1);

  const hasMore = data.length > limit;
  const records = hasMore ? data.slice(0, limit) : data;

  return {
    data: records,
    hasMore,
  };
}

/**
 * Mark that the upcoming notification has been sent for a recurring deal series
 */
export async function markUpcomingNotificationSent(
  db: Database,
  params: { id: string; teamId: string },
) {
  const { id, teamId } = params;

  const [result] = await db
    .update(dealRecurring)
    .set({
      upcomingNotificationSentAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    .where(
      and(eq(dealRecurring.id, id), eq(dealRecurring.teamId, teamId)),
    )
    .returning();

  return result;
}
