import { UTCDate } from "@date-fns/utc";
import { addMonths, endOfMonth, format, parseISO } from "date-fns";
import { and, desc, eq, gt, inArray, isNull, lte, or, sql } from "drizzle-orm";
import type { Database, DatabaseOrTransaction } from "../client";
import {
  customers,
  invoiceRecurring,
  invoiceRecurringStatusEnum,
  invoices,
} from "../schema";
import {
  advanceToFutureDate,
  calculateFirstScheduledDate,
  calculateNextScheduledDate,
  calculateUpcomingDates,
  type InvoiceRecurringEndType,
  type InvoiceRecurringFrequency,
  type RecurringInvoiceParams,
  shouldMarkCompleted,
} from "../utils/invoice-recurring";

export type CreateInvoiceRecurringParams = {
  teamId: string;
  userId: string;
  customerId?: string | null;
  customerName?: string | null;
  frequency: InvoiceRecurringFrequency;
  frequencyDay?: number | null;
  frequencyWeek?: number | null;
  frequencyInterval?: number | null;
  endType: InvoiceRecurringEndType;
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
  vat?: number | null;
  tax?: number | null;
  discount?: number | null;
  subtotal?: number | null;
  topBlock?: unknown;
  bottomBlock?: unknown;
  templateId?: string | null;
  /**
   * Optional issue date for the first invoice.
   * If provided and in the future, the first invoice will be scheduled for this date.
   * If not provided or in the past, the first invoice is generated immediately.
   */
  issueDate?: string | null;
};

export async function createInvoiceRecurring(
  db: DatabaseOrTransaction,
  params: CreateInvoiceRecurringParams,
) {
  const {
    teamId,
    userId,
    customerId,
    customerName,
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
    vat,
    tax,
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
  const recurringParams: RecurringInvoiceParams = {
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
    .insert(invoiceRecurring)
    .values({
      teamId,
      userId,
      customerId,
      customerName,
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
      vat,
      tax,
      discount,
      subtotal,
      topBlock,
      bottomBlock,
      templateId,
      status: "active",
      invoicesGenerated: 0,
      nextScheduledAt: firstScheduledAt.toISOString(),
    })
    .returning();

  return result;
}

export type UpdateInvoiceRecurringParams = {
  id: string;
  teamId: string;
  customerId?: string | null;
  customerName?: string | null;
  frequency?: InvoiceRecurringFrequency;
  frequencyDay?: number | null;
  frequencyWeek?: number | null;
  frequencyInterval?: number | null;
  endType?: InvoiceRecurringEndType;
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
  vat?: number | null;
  tax?: number | null;
  discount?: number | null;
  subtotal?: number | null;
  topBlock?: unknown;
  bottomBlock?: unknown;
  templateId?: string | null;
  status?: "active" | "paused" | "completed" | "canceled";
  invoicesGenerated?: number;
  // Optional explicit scheduling fields (used when linking existing invoice)
  nextScheduledAt?: string;
  lastGeneratedAt?: string;
};

export async function updateInvoiceRecurring(
  db: DatabaseOrTransaction,
  params: UpdateInvoiceRecurringParams,
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
    | (typeof invoiceRecurring.$inferSelect & Record<string, unknown>)
    | null = null;

  if (frequencyFieldsChanged || endConditionsChanged) {
    const [fetchedCurrent] = await db
      .select()
      .from(invoiceRecurring)
      .where(
        and(eq(invoiceRecurring.id, id), eq(invoiceRecurring.teamId, teamId)),
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
      const recurringParams: RecurringInvoiceParams = {
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
    .update(invoiceRecurring)
    .set({
      ...updateData,
      ...(nextScheduledAt && { nextScheduledAt }),
      ...(explicitLastGeneratedAt && {
        lastGeneratedAt: explicitLastGeneratedAt,
      }),
      updatedAt: new Date().toISOString(),
    })
    .where(
      and(eq(invoiceRecurring.id, id), eq(invoiceRecurring.teamId, teamId)),
    )
    .returning();

  return result;
}

export type GetInvoiceRecurringByIdParams = {
  id: string;
  teamId: string;
};

export async function getInvoiceRecurringById(
  db: Database,
  params: GetInvoiceRecurringByIdParams,
) {
  const { id, teamId } = params;

  const [result] = await db
    .select({
      id: invoiceRecurring.id,
      createdAt: invoiceRecurring.createdAt,
      updatedAt: invoiceRecurring.updatedAt,
      teamId: invoiceRecurring.teamId,
      userId: invoiceRecurring.userId,
      customerId: invoiceRecurring.customerId,
      frequency: invoiceRecurring.frequency,
      frequencyDay: invoiceRecurring.frequencyDay,
      frequencyWeek: invoiceRecurring.frequencyWeek,
      frequencyInterval: invoiceRecurring.frequencyInterval,
      endType: invoiceRecurring.endType,
      endDate: invoiceRecurring.endDate,
      endCount: invoiceRecurring.endCount,
      status: invoiceRecurring.status,
      invoicesGenerated: invoiceRecurring.invoicesGenerated,
      nextScheduledAt: invoiceRecurring.nextScheduledAt,
      lastGeneratedAt: invoiceRecurring.lastGeneratedAt,
      timezone: invoiceRecurring.timezone,
      dueDateOffset: invoiceRecurring.dueDateOffset,
      amount: invoiceRecurring.amount,
      currency: invoiceRecurring.currency,
      lineItems: invoiceRecurring.lineItems,
      template: invoiceRecurring.template,
      paymentDetails: invoiceRecurring.paymentDetails,
      fromDetails: invoiceRecurring.fromDetails,
      noteDetails: invoiceRecurring.noteDetails,
      customerName: invoiceRecurring.customerName,
      vat: invoiceRecurring.vat,
      tax: invoiceRecurring.tax,
      discount: invoiceRecurring.discount,
      subtotal: invoiceRecurring.subtotal,
      topBlock: invoiceRecurring.topBlock,
      bottomBlock: invoiceRecurring.bottomBlock,
      templateId: invoiceRecurring.templateId,
      customer: {
        id: customers.id,
        name: customers.name,
        email: customers.email,
        website: customers.website,
      },
    })
    .from(invoiceRecurring)
    .leftJoin(customers, eq(invoiceRecurring.customerId, customers.id))
    .where(
      and(eq(invoiceRecurring.id, id), eq(invoiceRecurring.teamId, teamId)),
    );

  if (!result) {
    return null;
  }

  return result;
}

export type GetInvoiceRecurringListParams = {
  teamId: string;
  status?: ("active" | "paused" | "completed" | "canceled")[];
  customerId?: string;
  cursor?: string | null;
  pageSize?: number;
};

export async function getInvoiceRecurringList(
  db: Database,
  params: GetInvoiceRecurringListParams,
) {
  const { teamId, status, customerId, cursor, pageSize = 25 } = params;

  const conditions = [eq(invoiceRecurring.teamId, teamId)];

  if (status && status.length > 0) {
    const validStatuses = status.filter((s) =>
      invoiceRecurringStatusEnum.enumValues.includes(s),
    );
    if (validStatuses.length > 0) {
      conditions.push(inArray(invoiceRecurring.status, validStatuses));
    }
  }

  if (customerId) {
    conditions.push(eq(invoiceRecurring.customerId, customerId));
  }

  const offset = cursor ? Number.parseInt(cursor, 10) : 0;

  const data = await db
    .select({
      id: invoiceRecurring.id,
      createdAt: invoiceRecurring.createdAt,
      customerId: invoiceRecurring.customerId,
      customerName: invoiceRecurring.customerName,
      frequency: invoiceRecurring.frequency,
      frequencyDay: invoiceRecurring.frequencyDay,
      frequencyWeek: invoiceRecurring.frequencyWeek,
      endType: invoiceRecurring.endType,
      endCount: invoiceRecurring.endCount,
      status: invoiceRecurring.status,
      invoicesGenerated: invoiceRecurring.invoicesGenerated,
      nextScheduledAt: invoiceRecurring.nextScheduledAt,
      amount: invoiceRecurring.amount,
      currency: invoiceRecurring.currency,
      customer: {
        id: customers.id,
        name: customers.name,
        email: customers.email,
      },
    })
    .from(invoiceRecurring)
    .leftJoin(customers, eq(invoiceRecurring.customerId, customers.id))
    .where(and(...conditions))
    .orderBy(desc(invoiceRecurring.createdAt))
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
 * Default batch size for processing recurring invoices
 * Prevents overwhelming the system when many invoices are due at once
 */
const DEFAULT_BATCH_SIZE = 50;

/**
 * Get recurring invoices that are due for generation
 * Used by the scheduler to find invoices that need to be generated
 *
 * @param db - Database instance
 * @param options.limit - Maximum number of records to return (default: 50)
 * @returns Object with data array and hasMore flag for pagination awareness
 */
export async function getDueInvoiceRecurring(
  db: Database,
  options?: { limit?: number },
) {
  const now = new Date().toISOString();
  const limit = options?.limit ?? DEFAULT_BATCH_SIZE;

  // Fetch limit + 1 to check if there are more records
  const data = await db
    .select({
      id: invoiceRecurring.id,
      teamId: invoiceRecurring.teamId,
      userId: invoiceRecurring.userId,
      customerId: invoiceRecurring.customerId,
      customerName: invoiceRecurring.customerName,
      frequency: invoiceRecurring.frequency,
      frequencyDay: invoiceRecurring.frequencyDay,
      frequencyWeek: invoiceRecurring.frequencyWeek,
      frequencyInterval: invoiceRecurring.frequencyInterval,
      endType: invoiceRecurring.endType,
      endDate: invoiceRecurring.endDate,
      endCount: invoiceRecurring.endCount,
      invoicesGenerated: invoiceRecurring.invoicesGenerated,
      nextScheduledAt: invoiceRecurring.nextScheduledAt,
      timezone: invoiceRecurring.timezone,
      dueDateOffset: invoiceRecurring.dueDateOffset,
      amount: invoiceRecurring.amount,
      currency: invoiceRecurring.currency,
      lineItems: invoiceRecurring.lineItems,
      template: invoiceRecurring.template,
      paymentDetails: invoiceRecurring.paymentDetails,
      fromDetails: invoiceRecurring.fromDetails,
      noteDetails: invoiceRecurring.noteDetails,
      vat: invoiceRecurring.vat,
      tax: invoiceRecurring.tax,
      discount: invoiceRecurring.discount,
      subtotal: invoiceRecurring.subtotal,
      topBlock: invoiceRecurring.topBlock,
      bottomBlock: invoiceRecurring.bottomBlock,
      templateId: invoiceRecurring.templateId,
    })
    .from(invoiceRecurring)
    .where(
      and(
        eq(invoiceRecurring.status, "active"),
        lte(invoiceRecurring.nextScheduledAt, now),
      ),
    )
    // Order by nextScheduledAt to process oldest first (fairness)
    .orderBy(invoiceRecurring.nextScheduledAt)
    .limit(limit + 1);

  const hasMore = data.length > limit;
  const records = hasMore ? data.slice(0, limit) : data;

  return {
    data: records,
    hasMore,
  };
}

/**
 * Mark a recurring invoice as generated and update the next scheduled date
 * This should be called after successfully generating an invoice
 */
export type MarkInvoiceGeneratedParams = {
  id: string;
  teamId: string;
};

export async function markInvoiceGenerated(
  db: DatabaseOrTransaction,
  params: MarkInvoiceGeneratedParams,
) {
  const { id, teamId } = params;

  // Get current recurring invoice data
  const [current] = await db
    .select()
    .from(invoiceRecurring)
    .where(
      and(eq(invoiceRecurring.id, id), eq(invoiceRecurring.teamId, teamId)),
    );

  if (!current) {
    return null;
  }

  const now = new Date();
  const newInvoicesGenerated = current.invoicesGenerated + 1;

  // Calculate next scheduled date
  const recurringParams: RecurringInvoiceParams = {
    frequency: current.frequency,
    frequencyDay: current.frequencyDay,
    frequencyWeek: current.frequencyWeek,
    frequencyInterval: current.frequencyInterval,
    timezone: current.timezone,
  };

  // Use the original scheduled time as the base to preserve the intended schedule pattern
  // (e.g., biweekly invoices stay on the same weekday, monthly on the same date)
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
    newInvoicesGenerated,
    nextScheduledAt,
  );

  const [result] = await db
    .update(invoiceRecurring)
    .set({
      invoicesGenerated: newInvoicesGenerated,
      consecutiveFailures: 0, // Reset failures on successful generation
      lastGeneratedAt: now.toISOString(),
      nextScheduledAt: isCompleted ? null : nextScheduledAt.toISOString(),
      status: isCompleted ? "completed" : "active",
      updatedAt: now.toISOString(),
    })
    .where(
      and(eq(invoiceRecurring.id, id), eq(invoiceRecurring.teamId, teamId)),
    )
    .returning();

  return result;
}

/**
 * Maximum consecutive failures before auto-pausing
 */
const MAX_CONSECUTIVE_FAILURES = 3;

/**
 * Record a failure for a recurring invoice series
 * Auto-pauses after MAX_CONSECUTIVE_FAILURES
 * @returns Object with updated record and whether it was auto-paused
 */
export async function recordInvoiceGenerationFailure(
  db: Database,
  params: { id: string; teamId: string },
): Promise<{
  result: typeof invoiceRecurring.$inferSelect | null;
  autoPaused: boolean;
}> {
  const { id, teamId } = params;

  // Get current data
  const [current] = await db
    .select()
    .from(invoiceRecurring)
    .where(
      and(eq(invoiceRecurring.id, id), eq(invoiceRecurring.teamId, teamId)),
    );

  if (!current) {
    return { result: null, autoPaused: false };
  }

  const newFailureCount = current.consecutiveFailures + 1;
  const shouldAutoPause = newFailureCount >= MAX_CONSECUTIVE_FAILURES;

  const [result] = await db
    .update(invoiceRecurring)
    .set({
      consecutiveFailures: newFailureCount,
      status: shouldAutoPause ? "paused" : current.status,
      updatedAt: new Date().toISOString(),
    })
    .where(
      and(eq(invoiceRecurring.id, id), eq(invoiceRecurring.teamId, teamId)),
    )
    .returning();

  return { result: result ?? null, autoPaused: shouldAutoPause };
}

/**
 * Pause a recurring invoice series
 */
export async function pauseInvoiceRecurring(
  db: DatabaseOrTransaction,
  params: { id: string; teamId: string },
) {
  const { id, teamId } = params;

  const [result] = await db
    .update(invoiceRecurring)
    .set({
      status: "paused",
      updatedAt: new Date().toISOString(),
    })
    .where(
      and(eq(invoiceRecurring.id, id), eq(invoiceRecurring.teamId, teamId)),
    )
    .returning();

  return result;
}

/**
 * Resume a paused recurring invoice series
 * Validates that the series hasn't already completed before resuming
 */
export async function resumeInvoiceRecurring(
  db: Database,
  params: { id: string; teamId: string },
) {
  const { id, teamId } = params;

  // Get current data to recalculate next scheduled date
  const [current] = await db
    .select()
    .from(invoiceRecurring)
    .where(
      and(eq(invoiceRecurring.id, id), eq(invoiceRecurring.teamId, teamId)),
    );

  if (!current || current.status !== "paused") {
    return null;
  }

  // Calculate next scheduled date from now
  const now = new Date();
  const recurringParams: RecurringInvoiceParams = {
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
    current.invoicesGenerated,
    nextScheduledAt,
  );

  if (isCompleted) {
    // Mark as completed instead of resuming
    const [result] = await db
      .update(invoiceRecurring)
      .set({
        status: "completed",
        nextScheduledAt: null,
        updatedAt: now.toISOString(),
      })
      .where(
        and(eq(invoiceRecurring.id, id), eq(invoiceRecurring.teamId, teamId)),
      )
      .returning();

    return result;
  }

  const [result] = await db
    .update(invoiceRecurring)
    .set({
      status: "active",
      consecutiveFailures: 0, // Reset failures on resume
      nextScheduledAt: nextScheduledAt.toISOString(),
      updatedAt: now.toISOString(),
    })
    .where(
      and(eq(invoiceRecurring.id, id), eq(invoiceRecurring.teamId, teamId)),
    )
    .returning();

  return result;
}

/**
 * Delete a recurring invoice series (soft delete by setting status to canceled)
 * Generated invoices are kept
 */
export async function deleteInvoiceRecurring(
  db: DatabaseOrTransaction,
  params: { id: string; teamId: string },
) {
  const { id, teamId } = params;

  const [result] = await db
    .update(invoiceRecurring)
    .set({
      status: "canceled",
      nextScheduledAt: null,
      updatedAt: new Date().toISOString(),
    })
    .where(
      and(eq(invoiceRecurring.id, id), eq(invoiceRecurring.teamId, teamId)),
    )
    .returning();

  return result;
}

/**
 * Get upcoming invoice preview for a recurring series
 */
export type GetUpcomingInvoicesParams = {
  id: string;
  teamId: string;
  limit?: number;
};

export async function getUpcomingInvoices(
  db: Database,
  params: GetUpcomingInvoicesParams,
) {
  const { id, teamId, limit = 10 } = params;

  const recurring = await getInvoiceRecurringById(db, { id, teamId });

  if (!recurring) {
    return null;
  }

  const recurringParams: RecurringInvoiceParams = {
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
    recurring.invoicesGenerated,
    limit,
  );
}

/**
 * Check if an invoice already exists for a recurring series and sequence number
 * Used for idempotency
 *
 * Returns:
 * - null if no invoice exists for this sequence
 * - { id, status, invoiceNumber } if an invoice exists
 *
 * This allows the caller to decide whether to:
 * - Create a new invoice (if null)
 * - Send an existing draft (if status is 'draft')
 * - Skip entirely (if already sent/paid)
 */
export async function checkInvoiceExists(
  db: Database,
  params: { invoiceRecurringId: string; recurringSequence: number },
) {
  const { invoiceRecurringId, recurringSequence } = params;

  const [result] = await db
    .select({
      id: invoices.id,
      status: invoices.status,
      invoiceNumber: invoices.invoiceNumber,
    })
    .from(invoices)
    .where(
      and(
        eq(invoices.invoiceRecurringId, invoiceRecurringId),
        eq(invoices.recurringSequence, recurringSequence),
      ),
    )
    .limit(1);

  return result ?? null;
}

/**
 * Get recurring invoice info for an invoice (for display in invoice details)
 */
export async function getInvoiceRecurringInfo(
  db: Database,
  params: { invoiceId: string },
) {
  const { invoiceId } = params;

  const [invoice] = await db
    .select({
      invoiceRecurringId: invoices.invoiceRecurringId,
      recurringSequence: invoices.recurringSequence,
    })
    .from(invoices)
    .where(eq(invoices.id, invoiceId));

  if (!invoice?.invoiceRecurringId) {
    return null;
  }

  const [recurring] = await db
    .select({
      frequency: invoiceRecurring.frequency,
      frequencyDay: invoiceRecurring.frequencyDay,
      frequencyWeek: invoiceRecurring.frequencyWeek,
      endType: invoiceRecurring.endType,
      endCount: invoiceRecurring.endCount,
      invoicesGenerated: invoiceRecurring.invoicesGenerated,
      nextScheduledAt: invoiceRecurring.nextScheduledAt,
      status: invoiceRecurring.status,
    })
    .from(invoiceRecurring)
    .where(eq(invoiceRecurring.id, invoice.invoiceRecurringId));

  if (!recurring) {
    return null;
  }

  return {
    recurringId: invoice.invoiceRecurringId,
    sequence: invoice.recurringSequence,
    totalCount: recurring.endType === "after_count" ? recurring.endCount : null,
    frequency: recurring.frequency,
    frequencyDay: recurring.frequencyDay,
    frequencyWeek: recurring.frequencyWeek,
    nextScheduledAt: recurring.nextScheduledAt,
    status: recurring.status,
  };
}

/**
 * Get recurring invoices that are upcoming within the specified hours
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
      id: invoiceRecurring.id,
      teamId: invoiceRecurring.teamId,
      userId: invoiceRecurring.userId,
      customerId: invoiceRecurring.customerId,
      customerName: invoiceRecurring.customerName,
      frequency: invoiceRecurring.frequency,
      nextScheduledAt: invoiceRecurring.nextScheduledAt,
      amount: invoiceRecurring.amount,
      currency: invoiceRecurring.currency,
      upcomingNotificationSentAt: invoiceRecurring.upcomingNotificationSentAt,
    })
    .from(invoiceRecurring)
    .where(
      and(
        eq(invoiceRecurring.status, "active"),
        // Due within the look-ahead window
        gt(invoiceRecurring.nextScheduledAt, now.toISOString()),
        lte(invoiceRecurring.nextScheduledAt, futureDate.toISOString()),
        // Notification not sent yet, or was sent for a previous cycle
        // (upcomingNotificationSentAt < nextScheduledAt - 24h means it was for a previous cycle)
        or(
          isNull(invoiceRecurring.upcomingNotificationSentAt),
          lte(
            invoiceRecurring.upcomingNotificationSentAt,
            // If notification was sent more than hoursAhead before current nextScheduledAt,
            // it was for a previous cycle
            sql`${invoiceRecurring.nextScheduledAt}::timestamptz - interval '${sql.raw(String(hoursAhead + 1))} hours'`,
          ),
        ),
      ),
    )
    .orderBy(invoiceRecurring.nextScheduledAt)
    .limit(limit + 1);

  const hasMore = data.length > limit;
  const records = hasMore ? data.slice(0, limit) : data;

  return {
    data: records,
    hasMore,
  };
}

/**
 * Get upcoming recurring invoices for a specific team before a given date
 * Used by insights to show upcoming recurring invoices for a team
 *
 * @param db - Database instance
 * @param params.teamId - Team ID to filter by
 * @param params.before - Only include invoices scheduled before this date
 * @param params.limit - Maximum number of records to return (default: 10)
 * @returns Array of upcoming recurring invoices for the team
 */
export async function getUpcomingDueRecurringByTeam(
  db: Database,
  params: {
    teamId: string;
    before: Date;
    limit?: number;
  },
) {
  const { teamId, before, limit = 10 } = params;
  const now = new Date();

  const data = await db
    .select({
      id: invoiceRecurring.id,
      teamId: invoiceRecurring.teamId,
      customerId: invoiceRecurring.customerId,
      customerName: invoiceRecurring.customerName,
      frequency: invoiceRecurring.frequency,
      nextScheduledAt: invoiceRecurring.nextScheduledAt,
      amount: invoiceRecurring.amount,
      currency: invoiceRecurring.currency,
    })
    .from(invoiceRecurring)
    .where(
      and(
        eq(invoiceRecurring.teamId, teamId),
        eq(invoiceRecurring.status, "active"),
        gt(invoiceRecurring.nextScheduledAt, now.toISOString()),
        lte(invoiceRecurring.nextScheduledAt, before.toISOString()),
      ),
    )
    .orderBy(invoiceRecurring.nextScheduledAt)
    .limit(limit);

  return data;
}

/**
 * Mark that the upcoming notification has been sent for a recurring invoice series
 */
export async function markUpcomingNotificationSent(
  db: Database,
  params: { id: string; teamId: string },
) {
  const { id, teamId } = params;

  const [result] = await db
    .update(invoiceRecurring)
    .set({
      upcomingNotificationSentAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    .where(
      and(eq(invoiceRecurring.id, id), eq(invoiceRecurring.teamId, teamId)),
    )
    .returning();

  return result;
}

/**
 * Calculate the maximum number of invoices that could occur in a given forecast period
 * based on the recurring invoice frequency.
 *
 * This converts forecastMonths into an invoice count limit, accounting for how many
 * invoices each frequency type generates per month.
 *
 * @param frequency - The recurring invoice frequency
 * @param frequencyInterval - Custom interval in days (for 'custom' frequency)
 * @param forecastMonths - Number of months to forecast
 * @returns Maximum number of invoices to calculate
 */
function calculateInvoiceLimitForPeriod(
  frequency: InvoiceRecurringFrequency,
  frequencyInterval: number | null,
  forecastMonths: number,
): number {
  // Add a buffer to ensure we don't miss edge cases at period boundaries
  const buffer = 2;

  switch (frequency) {
    case "weekly":
      // ~4.33 weeks per month
      return Math.ceil(forecastMonths * 4.33) + buffer;

    case "biweekly":
      // ~2.17 invoices per month (every 2 weeks)
      return Math.ceil(forecastMonths * 2.17) + buffer;

    case "monthly_date":
    case "monthly_weekday":
    case "monthly_last_day":
      // 1 invoice per month
      return forecastMonths + buffer;

    case "quarterly":
      // 1 invoice per 3 months
      return Math.ceil(forecastMonths / 3) + buffer;

    case "semi_annual":
      // 1 invoice per 6 months
      return Math.ceil(forecastMonths / 6) + buffer;

    case "annual":
      // 1 invoice per 12 months
      return Math.ceil(forecastMonths / 12) + buffer;

    case "custom":
      // frequencyInterval is in days
      if (frequencyInterval && frequencyInterval > 0) {
        // Average 30.44 days per month
        const invoicesPerMonth = 30.44 / frequencyInterval;
        return Math.ceil(forecastMonths * invoicesPerMonth) + buffer;
      }
      // Fallback if interval is not set
      return forecastMonths + buffer;

    default:
      // Default to monthly as a safe fallback
      return forecastMonths + buffer;
  }
}

/**
 * Project active recurring invoices into future months for revenue forecasting.
 *
 * This function queries all active recurring invoices and uses calculateUpcomingDates()
 * to project when they will generate invoices in the forecast period.
 *
 * @param db - Database connection
 * @param params - Parameters including teamId and forecastMonths
 * @returns Map of month keys (yyyy-MM) to projected amounts and counts
 */
export type GetRecurringInvoiceProjectionParams = {
  teamId: string;
  forecastMonths: number;
  currency?: string;
};

export type RecurringInvoiceProjectionResult = Map<
  string,
  { amount: number; count: number }
>;

export async function getRecurringInvoiceProjection(
  db: Database,
  params: GetRecurringInvoiceProjectionParams,
): Promise<RecurringInvoiceProjectionResult> {
  const { teamId, forecastMonths, currency } = params;

  // Build query conditions
  const conditions = [
    eq(invoiceRecurring.teamId, teamId),
    eq(invoiceRecurring.status, "active"),
  ];

  // Filter by currency when provided to avoid mixing currencies without conversion
  if (currency) {
    conditions.push(eq(invoiceRecurring.currency, currency));
  }

  // Get all active recurring invoices
  const activeRecurring = await db
    .select({
      id: invoiceRecurring.id,
      amount: invoiceRecurring.amount,
      currency: invoiceRecurring.currency,
      frequency: invoiceRecurring.frequency,
      frequencyDay: invoiceRecurring.frequencyDay,
      frequencyWeek: invoiceRecurring.frequencyWeek,
      frequencyInterval: invoiceRecurring.frequencyInterval,
      nextScheduledAt: invoiceRecurring.nextScheduledAt,
      endType: invoiceRecurring.endType,
      endDate: invoiceRecurring.endDate,
      endCount: invoiceRecurring.endCount,
      invoicesGenerated: invoiceRecurring.invoicesGenerated,
      timezone: invoiceRecurring.timezone,
    })
    .from(invoiceRecurring)
    .where(and(...conditions));

  // Project each recurring invoice into forecast months
  const projection: RecurringInvoiceProjectionResult = new Map();

  // Calculate end date for the forecast period (used to filter results)
  // Use endOfMonth to match getRevenueForecast in reports.ts, which covers through
  // the last day of each forecast month. Without this, invoices scheduled for
  // later in the last forecast month would be incorrectly excluded.
  const forecastEndDate = endOfMonth(addMonths(new UTCDate(), forecastMonths));

  for (const recurring of activeRecurring) {
    // Skip if no next scheduled date or no amount
    if (!recurring.nextScheduledAt || !recurring.amount) {
      continue;
    }

    const recurringParams: RecurringInvoiceParams = {
      frequency: recurring.frequency,
      frequencyDay: recurring.frequencyDay,
      frequencyWeek: recurring.frequencyWeek,
      frequencyInterval: recurring.frequencyInterval,
      timezone: recurring.timezone,
    };

    // Calculate the maximum number of invoices that could occur in the forecast period
    // based on the frequency. This is the 'limit' parameter for calculateUpcomingDates,
    // which controls how many invoices to return (not the time period).
    const invoiceLimitForPeriod = calculateInvoiceLimitForPeriod(
      recurring.frequency,
      recurring.frequencyInterval,
      forecastMonths,
    );

    // Calculate upcoming invoice dates
    const upcoming = calculateUpcomingDates(
      recurringParams,
      new Date(recurring.nextScheduledAt),
      recurring.amount,
      recurring.currency ?? "USD",
      recurring.endType,
      recurring.endDate ? new Date(recurring.endDate) : null,
      recurring.endCount,
      recurring.invoicesGenerated,
      invoiceLimitForPeriod,
    );

    // Group by month, filtering to only include invoices within the forecast period
    for (const invoice of upcoming.invoices) {
      const invoiceDate = parseISO(invoice.date);

      // Skip invoices beyond the forecast period
      if (invoiceDate > forecastEndDate) {
        continue;
      }

      const monthKey = format(invoiceDate, "yyyy-MM");
      const existing = projection.get(monthKey) || { amount: 0, count: 0 };
      projection.set(monthKey, {
        amount: existing.amount + invoice.amount,
        count: existing.count + 1,
      });
    }
  }

  return projection;
}
