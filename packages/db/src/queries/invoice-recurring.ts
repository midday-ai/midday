import type { Database } from "@db/client";
import {
  customers,
  invoiceRecurring,
  invoiceRecurringStatusEnum,
  invoices,
  teams,
} from "@db/schema";
import {
  type InvoiceRecurringEndType,
  type InvoiceRecurringFrequency,
  type RecurringInvoiceParams,
  calculateFirstScheduledDate,
  calculateNextScheduledDate,
  calculateUpcomingDates,
  shouldMarkCompleted,
} from "@db/utils/invoice-recurring";
import { and, desc, eq, inArray, lte, sql } from "drizzle-orm";

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
};

export async function createInvoiceRecurring(
  db: Database,
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
  } = params;

  // Calculate the first scheduled date (now - first invoice is immediate)
  const now = new Date();
  const recurringParams: RecurringInvoiceParams = {
    frequency,
    frequencyDay: frequencyDay ?? null,
    frequencyWeek: frequencyWeek ?? null,
    frequencyInterval: frequencyInterval ?? null,
    timezone,
  };

  const firstScheduledAt = calculateFirstScheduledDate(recurringParams, now);

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
};

export async function updateInvoiceRecurring(
  db: Database,
  params: UpdateInvoiceRecurringParams,
) {
  const { id, teamId, ...updateData } = params;

  // Check if frequency-related fields are being updated
  const frequencyFieldsChanged =
    params.frequency !== undefined ||
    params.frequencyDay !== undefined ||
    params.frequencyWeek !== undefined ||
    params.frequencyInterval !== undefined;

  // If frequency changed, we need to recalculate nextScheduledAt
  let nextScheduledAt: string | undefined;

  if (frequencyFieldsChanged) {
    // Get current record to merge with updates
    const [current] = await db
      .select()
      .from(invoiceRecurring)
      .where(
        and(eq(invoiceRecurring.id, id), eq(invoiceRecurring.teamId, teamId)),
      );

    // Only recalculate if the series is active
    if (current && current.status === "active") {
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
 * Get all recurring invoices that are due for generation
 * Used by the scheduler to find invoices that need to be generated
 */
export async function getDueInvoiceRecurring(db: Database) {
  const now = new Date().toISOString();

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
    );

  return data;
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
  db: Database,
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

  const nextScheduledAt = calculateNextScheduledDate(recurringParams, now);

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
 * Pause a recurring invoice series
 */
export async function pauseInvoiceRecurring(
  db: Database,
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

  const [result] = await db
    .update(invoiceRecurring)
    .set({
      status: "active",
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
  db: Database,
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
 */
export async function checkInvoiceExists(
  db: Database,
  params: { invoiceRecurringId: string; recurringSequence: number },
) {
  const { invoiceRecurringId, recurringSequence } = params;

  const [result] = await db
    .select({ id: invoices.id })
    .from(invoices)
    .where(
      and(
        eq(invoices.invoiceRecurringId, invoiceRecurringId),
        eq(invoices.recurringSequence, recurringSequence),
      ),
    )
    .limit(1);

  return !!result;
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
