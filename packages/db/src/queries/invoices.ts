import { UTCDate } from "@date-fns/utc";
import { buildSearchQuery } from "@midday/db/utils/search-query";
import { generateToken } from "@midday/invoice/token";
import type { EditorDoc, LineItem } from "@midday/invoice/types";
import camelcaseKeys from "camelcase-keys";
import {
  addMonths,
  eachMonthOfInterval,
  endOfMonth,
  format,
  parseISO,
  startOfMonth,
} from "date-fns";
import {
  and,
  asc,
  count,
  desc,
  eq,
  gte,
  ilike,
  inArray,
  isNotNull,
  isNull,
  lte,
  or,
  sql,
} from "drizzle-orm";
import type { SQL } from "drizzle-orm/sql/sql";
import { v4 as uuidv4 } from "uuid";
import type { Database, DatabaseOrTransaction } from "../client";
import {
  type activityTypeEnum,
  customers,
  exchangeRates,
  invoiceRecurring,
  invoiceStatusEnum,
  invoices,
  invoiceTemplates,
  teams,
  trackerEntries,
  trackerProjects,
  users,
} from "../schema";
import { logActivity } from "../utils/log-activity";

export type Template = {
  id?: string; // Reference to invoice_templates table
  name?: string; // Template name for display
  isDefault?: boolean; // Whether this is the default template
  customerLabel: string;
  title: string;
  fromLabel: string;
  invoiceNoLabel: string;
  issueDateLabel: string;
  dueDateLabel: string;
  descriptionLabel: string;
  priceLabel: string;
  quantityLabel: string;
  totalLabel: string;
  totalSummaryLabel: string;
  vatLabel: string;
  subtotalLabel: string;
  taxLabel: string;
  discountLabel: string;
  timezone: string;
  paymentLabel: string;
  noteLabel: string;
  logoUrl: string | null;
  currency: string;
  paymentDetails: EditorDoc | null;
  fromDetails: EditorDoc | null;
  noteDetails: EditorDoc | null;
  dateFormat: string;
  includeVat: boolean;
  includeTax: boolean;
  includeDiscount: boolean;
  includeDecimals: boolean;
  includeUnits: boolean;
  includeQr: boolean;
  taxRate: number;
  vatRate: number;
  size: "a4" | "letter";
  deliveryType: "create" | "create_and_send" | "scheduled";
  locale: string;
  paymentEnabled?: boolean;
  paymentTermsDays?: number;
};

export type GetInvoicesParams = {
  teamId: string;
  cursor?: string | null;
  pageSize?: number;
  q?: string | null;
  statuses?: string[] | null;
  customers?: string[] | null;
  start?: string | null;
  end?: string | null;
  sort?: string[] | null;
  ids?: string[] | null;
  recurringIds?: string[] | null;
  recurring?: boolean | null;
};

export async function getInvoices(db: Database, params: GetInvoicesParams) {
  const {
    teamId,
    sort,
    cursor,
    pageSize = 25,
    q,
    statuses,
    start,
    end,
    customers: customerIds,
    ids,
    recurringIds,
    recurring,
  } = params;

  const whereConditions: SQL[] = [eq(invoices.teamId, teamId)];

  // Apply IDs filter
  if (ids && ids.length > 0) {
    whereConditions.push(inArray(invoices.id, ids));
  }

  // Apply recurring series IDs filter (shows all invoices from these recurring series)
  if (recurringIds && recurringIds.length > 0) {
    whereConditions.push(inArray(invoices.invoiceRecurringId, recurringIds));
  }

  // Apply recurring filter (shows all invoices that are/aren't part of a recurring series)
  if (recurring === true) {
    whereConditions.push(isNotNull(invoices.invoiceRecurringId));
  } else if (recurring === false) {
    whereConditions.push(isNull(invoices.invoiceRecurringId));
  }

  // Apply status filter
  if (statuses && statuses.length > 0) {
    // Cast the statuses array to the correct enum type
    const validStatuses = statuses.filter((status) =>
      invoiceStatusEnum.enumValues.includes(
        status as (typeof invoiceStatusEnum.enumValues)[number],
      ),
    ) as (typeof invoiceStatusEnum.enumValues)[number][];

    if (validStatuses.length > 0) {
      whereConditions.push(inArray(invoices.status, validStatuses));
    }
  }

  // Apply date range filter
  if (start && end) {
    whereConditions.push(gte(invoices.dueDate, start));
    whereConditions.push(lte(invoices.dueDate, end));
  }

  // Apply customer filter
  if (customerIds && customerIds.length > 0) {
    whereConditions.push(inArray(invoices.customerId, customerIds));
  }

  // Apply search query filter
  if (q) {
    // If the query is a number, search by amount
    if (!Number.isNaN(Number.parseInt(q, 10))) {
      whereConditions.push(
        sql`${invoices.amount}::text = ${Number(q).toString()}`,
      );
    } else {
      const query = buildSearchQuery(q);

      // Search using full-text search, invoiceNumber, or customerName
      whereConditions.push(
        sql`(to_tsquery('english', ${query}) @@ ${invoices.fts} OR ${invoices.invoiceNumber} ILIKE '%' || ${q} || '%' OR ${invoices.customerName} ILIKE '%' || ${q} || '%')`,
      );
    }
  }

  // Start building the query
  const query = db
    .select({
      id: invoices.id,
      dueDate: invoices.dueDate,
      invoiceNumber: invoices.invoiceNumber,
      createdAt: invoices.createdAt,
      amount: invoices.amount,
      currency: invoices.currency,
      lineItems: invoices.lineItems,
      paymentDetails: invoices.paymentDetails,
      customerDetails: invoices.customerDetails,
      reminderSentAt: invoices.reminderSentAt,
      updatedAt: invoices.updatedAt,
      note: invoices.note,
      internalNote: invoices.internalNote,
      paidAt: invoices.paidAt,
      vat: invoices.vat,
      tax: invoices.tax,
      filePath: invoices.filePath,
      status: invoices.status,
      fileSize: invoices.fileSize,
      viewedAt: invoices.viewedAt,
      fromDetails: invoices.fromDetails,
      issueDate: invoices.issueDate,
      sentAt: invoices.sentAt,
      template: invoices.template,
      noteDetails: invoices.noteDetails,
      customerName: invoices.customerName,
      token: invoices.token,
      sentTo: invoices.sentTo,
      discount: invoices.discount,
      subtotal: invoices.subtotal,
      topBlock: invoices.topBlock,
      bottomBlock: invoices.bottomBlock,
      scheduledAt: invoices.scheduledAt,
      scheduledJobId: invoices.scheduledJobId,
      customer: {
        id: customers.id,
        name: customers.name,
        website: customers.website,
        email: customers.email,
      },
      customerId: invoices.customerId,
      team: {
        name: teams.name,
      },
      // Recurring invoice fields
      invoiceRecurringId: invoices.invoiceRecurringId,
      recurringSequence: invoices.recurringSequence,
      recurring: {
        id: invoiceRecurring.id,
        status: invoiceRecurring.status,
        frequency: invoiceRecurring.frequency,
        frequencyInterval: invoiceRecurring.frequencyInterval,
        endType: invoiceRecurring.endType,
        endCount: invoiceRecurring.endCount,
        invoicesGenerated: invoiceRecurring.invoicesGenerated,
        nextScheduledAt: invoiceRecurring.nextScheduledAt,
      },
    })
    .from(invoices)
    .leftJoin(customers, eq(invoices.customerId, customers.id))
    .leftJoin(teams, eq(invoices.teamId, teams.id))
    .leftJoin(
      invoiceRecurring,
      eq(invoices.invoiceRecurringId, invoiceRecurring.id),
    )
    .where(and(...whereConditions));

  // Apply sorting
  if (sort && sort.length === 2) {
    const [column, direction] = sort;
    const isAscending = direction === "asc";

    if (column === "customer") {
      isAscending
        ? query.orderBy(asc(customers.name))
        : query.orderBy(desc(customers.name));
    } else if (column === "created_at") {
      isAscending
        ? query.orderBy(asc(invoices.createdAt))
        : query.orderBy(desc(invoices.createdAt));
    } else if (column === "due_date") {
      isAscending
        ? query.orderBy(asc(invoices.dueDate))
        : query.orderBy(desc(invoices.dueDate));
    } else if (column === "amount") {
      isAscending
        ? query.orderBy(asc(invoices.amount))
        : query.orderBy(desc(invoices.amount));
    } else if (column === "status") {
      isAscending
        ? query.orderBy(asc(invoices.status))
        : query.orderBy(desc(invoices.status));
    }
  } else {
    // Default sort by created_at descending
    query.orderBy(desc(invoices.createdAt));
  }

  // Apply pagination
  const offset = cursor ? Number.parseInt(cursor, 10) : 0;
  query.limit(pageSize).offset(offset);

  // Execute query
  const data = await query;

  // Calculate next cursor
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

export type GetInvoiceByIdParams = {
  id: string;
  teamId?: string;
};

export async function getInvoiceById(
  db: Database,
  params: GetInvoiceByIdParams,
) {
  const { id, teamId } = params;

  const [result] = await db
    .select({
      id: invoices.id,
      dueDate: invoices.dueDate,
      invoiceNumber: invoices.invoiceNumber,
      createdAt: invoices.createdAt,
      amount: invoices.amount,
      currency: invoices.currency,
      lineItems: invoices.lineItems,
      paymentDetails: invoices.paymentDetails,
      customerDetails: invoices.customerDetails,
      reminderSentAt: invoices.reminderSentAt,
      updatedAt: invoices.updatedAt,
      note: invoices.note,
      internalNote: invoices.internalNote,
      paidAt: invoices.paidAt,
      vat: invoices.vat,
      tax: invoices.tax,
      filePath: invoices.filePath,
      status: invoices.status,
      fileSize: invoices.fileSize,
      viewedAt: invoices.viewedAt,
      fromDetails: invoices.fromDetails,
      issueDate: invoices.issueDate,
      sentAt: invoices.sentAt,
      template: invoices.template,
      templateId: invoices.templateId,
      noteDetails: invoices.noteDetails,
      customerName: invoices.customerName,
      token: invoices.token,
      sentTo: invoices.sentTo,
      discount: invoices.discount,
      subtotal: invoices.subtotal,
      topBlock: invoices.topBlock,
      bottomBlock: invoices.bottomBlock,
      scheduledAt: invoices.scheduledAt,
      scheduledJobId: invoices.scheduledJobId,
      paymentIntentId: invoices.paymentIntentId,
      refundedAt: invoices.refundedAt,
      teamId: invoices.teamId,
      customer: {
        id: customers.id,
        name: customers.name,
        website: customers.website,
        email: customers.email,
        billingEmail: customers.billingEmail,
        portalId: customers.portalId,
        portalEnabled: customers.portalEnabled,
      },
      customerId: invoices.customerId,
      team: {
        name: teams.name,
        email: teams.email,
        stripeConnected:
          sql<boolean>`${teams.stripeAccountId} IS NOT NULL AND ${teams.stripeConnectStatus} = 'connected'`.as(
            "stripe_connected",
          ),
      },
      user: {
        email: users.email,
        timezone: users.timezone,
        locale: users.locale,
      },
      // Join to get the template name and isDefault from invoice_templates
      invoiceTemplate: {
        id: invoiceTemplates.id,
        name: invoiceTemplates.name,
        isDefault: invoiceTemplates.isDefault,
      },
      // Recurring invoice data
      invoiceRecurringId: invoices.invoiceRecurringId,
      recurringSequence: invoices.recurringSequence,
      recurring: {
        id: invoiceRecurring.id,
        frequency: invoiceRecurring.frequency,
        frequencyInterval: invoiceRecurring.frequencyInterval,
        status: invoiceRecurring.status,
        nextScheduledAt: invoiceRecurring.nextScheduledAt,
        endType: invoiceRecurring.endType,
        endCount: invoiceRecurring.endCount,
        invoicesGenerated: invoiceRecurring.invoicesGenerated,
      },
    })
    .from(invoices)
    .leftJoin(customers, eq(invoices.customerId, customers.id))
    .leftJoin(teams, eq(invoices.teamId, teams.id))
    .leftJoin(users, eq(invoices.userId, users.id))
    .leftJoin(invoiceTemplates, eq(invoices.templateId, invoiceTemplates.id))
    .leftJoin(
      invoiceRecurring,
      eq(invoices.invoiceRecurringId, invoiceRecurring.id),
    )
    .where(
      and(
        eq(invoices.id, id),
        // This is when we use the token to get the invoice
        teamId !== undefined ? eq(invoices.teamId, teamId) : undefined,
      ),
    );

  if (!result) {
    return null;
  }

  const template = camelcaseKeys(result?.template as Record<string, unknown>, {
    deep: true,
  }) as Template;

  // Populate template metadata from the joined invoice_templates table
  // This ensures correct display even for drafts saved before multi-template feature
  if (result.invoiceTemplate?.id) {
    template.id = result.invoiceTemplate.id;
    template.name = result.invoiceTemplate.name ?? "Default";
    template.isDefault = result.invoiceTemplate.isDefault ?? false;
  } else if (result.templateId) {
    // Fallback: if templateId exists but join failed, at least set the id
    template.id = result.templateId;
  }

  // Remove the invoiceTemplate from the result as it's merged into template
  const { invoiceTemplate: _, ...restResult } = result;

  return {
    ...restResult,
    template,
    lineItems: result.lineItems as LineItem[],
    paymentDetails: result.paymentDetails as EditorDoc | null,
    customerDetails: result.customerDetails as EditorDoc | null,
    fromDetails: result.fromDetails as EditorDoc | null,
    noteDetails: result.noteDetails as EditorDoc | null,
    topBlock: result.topBlock as EditorDoc | null,
    bottomBlock: result.bottomBlock as EditorDoc | null,
  };
}

/**
 * Get an invoice by its Stripe payment intent ID.
 * Used by webhooks to find invoices when processing refunds.
 */
export async function getInvoiceByPaymentIntentId(
  db: Database,
  paymentIntentId: string,
) {
  const [result] = await db
    .select({
      id: invoices.id,
      teamId: invoices.teamId,
      status: invoices.status,
      invoiceNumber: invoices.invoiceNumber,
      customerName: invoices.customerName,
      paymentIntentId: invoices.paymentIntentId,
    })
    .from(invoices)
    .where(eq(invoices.paymentIntentId, paymentIntentId))
    .limit(1);

  return result;
}

type PaymentStatusResult = {
  score: number;
  paymentStatus: string;
};

type DbPaymentStatusResult = {
  score: number;
  payment_status: string;
};

export async function getPaymentStatus(
  db: Database,
  teamId: string,
): Promise<PaymentStatusResult> {
  const invoiceData = await db.executeOnReplica(
    sql`
      SELECT 
        i.id,
        i.due_date,
        i.paid_at,
        i.status,
        i.amount,
        i.currency
      FROM invoices i
      WHERE i.team_id = ${teamId}
        AND i.due_date IS NOT NULL
        AND (
          (i.status = 'paid' AND i.paid_at IS NOT NULL) OR
          (i.status = 'unpaid' AND i.paid_at IS NULL AND i.due_date < CURRENT_DATE) OR
          (i.status = 'overdue' AND i.paid_at IS NULL AND i.due_date < CURRENT_DATE)
        )
      ORDER BY i.due_date DESC
      LIMIT 50
    `,
  );

  if (!Array.isArray(invoiceData) || invoiceData.length === 0) {
    return {
      score: 0,
      paymentStatus: "none",
    };
  }

  // Calculate weighted average days overdue (recent invoices matter more)
  let totalWeightedDays = 0;
  let totalWeight = 0;
  let onTimeCount = 0;
  let lateCount = 0;

  for (const invoice of invoiceData) {
    if (!invoice.due_date) continue;

    const dueDate = new Date(invoice.due_date as string);
    let daysOverdue = 0;

    if (invoice.status === "paid" && invoice.paid_at) {
      // For paid invoices, calculate days between due_date and paid_at
      const paidDate = new Date(invoice.paid_at as string);
      daysOverdue =
        (paidDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24);
    } else if (
      (invoice.status === "unpaid" || invoice.status === "overdue") &&
      invoice.paid_at === null
    ) {
      // For unpaid/overdue invoices, calculate days between due_date and current date
      const currentDate = new Date();
      daysOverdue =
        (currentDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24);
    }

    // Weight: recent invoices (last 90 days) get higher weight
    const daysSinceDue = Math.abs(
      (Date.now() - dueDate.getTime()) / (1000 * 60 * 60 * 24),
    );
    const weight = daysSinceDue <= 90 ? 1.5 : 1.0;

    totalWeightedDays += daysOverdue * weight;
    totalWeight += weight;

    // Track on-time vs late payments (considering 3-day grace period for banking delays)
    if (daysOverdue <= 3) {
      onTimeCount++;
    } else {
      lateCount++;
    }
  }

  const avgDaysOverdue = totalWeightedDays / totalWeight;
  const onTimeRate = onTimeCount / (onTimeCount + lateCount);

  // Calculate score based on both average days overdue and on-time rate
  let baseScore: number;

  if (avgDaysOverdue <= 3) {
    // Paid on time or within grace period
    baseScore = 100;
  } else if (avgDaysOverdue <= 7) {
    // Paid within 7 days - gradual decrease from 100 to 85
    baseScore = Math.round(100 - ((avgDaysOverdue - 3) / 4) * 15);
  } else if (avgDaysOverdue <= 14) {
    // Paid within 14 days - decrease from 85 to 65
    baseScore = Math.round(85 - ((avgDaysOverdue - 7) / 7) * 20);
  } else if (avgDaysOverdue <= 30) {
    // Paid within 30 days - decrease from 65 to 40
    baseScore = Math.round(65 - ((avgDaysOverdue - 14) / 16) * 25);
  } else {
    // Paid very late - decrease from 40 to 0
    baseScore = Math.round(Math.max(0, 40 - ((avgDaysOverdue - 30) / 30) * 40));
  }

  // Adjust score based on on-time payment rate
  const rateBonus = Math.round((onTimeRate - 0.5) * 20);
  const score = Math.max(0, Math.min(100, baseScore + rateBonus));

  // Determine payment status based on score
  let paymentStatus: string;
  if (score >= 80) {
    paymentStatus = "good";
  } else if (score >= 60) {
    paymentStatus = "average";
  } else {
    paymentStatus = "bad";
  }

  return {
    score,
    paymentStatus,
  };
}

type SearchInvoiceNumberParams = {
  teamId: string;
  query: string;
};

export async function searchInvoiceNumber(
  db: Database,
  params: SearchInvoiceNumberParams,
) {
  const [result] = await db
    .select({
      invoiceNumber: invoices.invoiceNumber,
    })
    .from(invoices)
    .where(
      and(
        eq(invoices.teamId, params.teamId),
        ilike(invoices.invoiceNumber, `%${params.query}`),
      ),
    )
    .limit(1);

  return result ?? null;
}

/**
 * Generate the next invoice number for a team.
 * Format: INV-XXXX (e.g., INV-0001, INV-0042)
 *
 * Logic:
 * 1. Find the highest numeric suffix from existing invoice numbers
 * 2. If found, increment by 1
 * 3. If not found, count total invoices + 1
 * 4. Pad to 4 digits with leading zeros
 */
export async function getNextInvoiceNumber(
  db: DatabaseOrTransaction,
  teamId: string,
): Promise<string> {
  const PREFIX = "INV-";
  const PAD_LENGTH = 4;

  // Find the highest invoice number with a numeric suffix for this team
  // Using raw SQL for the regex extraction since Drizzle doesn't support it natively
  const maxInvoiceResult = await db
    .select({ invoiceNumber: invoices.invoiceNumber })
    .from(invoices)
    .where(
      and(
        eq(invoices.teamId, teamId),
        sql`${invoices.invoiceNumber} ~ '[0-9]+$'`,
      ),
    )
    .orderBy(
      sql`CAST(SUBSTRING(${invoices.invoiceNumber} FROM '[0-9]+$') AS INTEGER) DESC`,
    )
    .limit(1);

  let nextNumber: number;

  if (maxInvoiceResult.length > 0 && maxInvoiceResult[0]?.invoiceNumber) {
    // Extract the numeric part from the invoice number
    const match = maxInvoiceResult[0].invoiceNumber.match(/(\d+)$/);

    if (match?.[1]) {
      // Increment the numeric part
      nextNumber = Number.parseInt(match[1], 10) + 1;
    } else {
      // Fallback: count total invoices + 1
      const countResult = await db
        .select({ count: count() })
        .from(invoices)
        .where(eq(invoices.teamId, teamId));

      nextNumber = (countResult[0]?.count ?? 0) + 1;
    }
  } else {
    // No invoices with numeric suffix found, count total invoices + 1
    const countResult = await db
      .select({ count: count() })
      .from(invoices)
      .where(eq(invoices.teamId, teamId));

    nextNumber = (countResult[0]?.count ?? 0) + 1;
  }

  // Pad with leading zeros
  const paddedNumber = nextNumber.toString().padStart(PAD_LENGTH, "0");

  return `${PREFIX}${paddedNumber}`;
}

export async function isInvoiceNumberUsed(
  db: Database,
  teamId: string,
  invoiceNumber: string,
): Promise<boolean> {
  const [result] = await db
    .select({
      id: invoices.id,
    })
    .from(invoices)
    .where(
      and(
        eq(invoices.teamId, teamId),
        eq(invoices.invoiceNumber, invoiceNumber),
      ),
    )
    .limit(1);

  return !!result;
}

type DraftInvoiceLineItemParams = {
  name?: string | null; // Stringified TipTap JSONContent
  quantity?: number;
  unit?: string | null;
  price?: number;
  vat?: number | null;
  tax?: number | null;
};

type DraftInvoiceTemplateParams = {
  customerLabel?: string;
  title?: string;
  fromLabel?: string;
  invoiceNoLabel?: string;
  issueDateLabel?: string;
  dueDateLabel?: string;
  descriptionLabel?: string;
  priceLabel?: string;
  quantityLabel?: string;
  totalLabel?: string;
  totalSummaryLabel?: string;
  vatLabel?: string;
  subtotalLabel?: string;
  taxLabel?: string;
  discountLabel?: string;
  sendCopy?: boolean;
  timezone?: string;
  paymentLabel?: string;
  noteLabel?: string;
  logoUrl?: string | null;
  currency?: string;
  paymentDetails?: string | null;
  fromDetails?: string | null;
  dateFormat?: string;
  includeVat?: boolean;
  includeTax?: boolean;
  includeDiscount?: boolean;
  includeDecimals?: boolean;
  includeUnits?: boolean;
  includeQr?: boolean;
  taxRate?: number | null;
  vatRate?: number | null;
  size?: "a4" | "letter";
  deliveryType?: "create" | "create_and_send" | "scheduled";
  locale?: string;
};

type DraftInvoiceParams = {
  id: string;
  template: DraftInvoiceTemplateParams;
  templateId?: string | null;
  fromDetails?: string | null;
  customerDetails?: string | null;
  customerId?: string | null;
  customerName?: string | null;
  paymentDetails?: string | null;
  noteDetails?: string | null;
  dueDate: string;
  issueDate: string;
  invoiceNumber: string;
  logoUrl?: string | null;
  vat?: number | null;
  tax?: number | null;
  discount?: number | null;
  subtotal?: number | null;
  topBlock?: string | null;
  bottomBlock?: string | null;
  amount?: number | null;
  lineItems?: DraftInvoiceLineItemParams[];
  token?: string;
  teamId: string;
  userId: string;
};

export async function draftInvoice(
  db: DatabaseOrTransaction,
  params: DraftInvoiceParams,
) {
  const {
    id,
    teamId,
    userId,
    token,
    template,
    templateId,
    paymentDetails,
    fromDetails,
    customerDetails,
    noteDetails,
    ...restInput
  } = params;

  const useToken = token ?? (await generateToken(id));

  const { paymentDetails: _, fromDetails: __, ...restTemplate } = template;

  const [result] = await db
    .insert(invoices)
    .values({
      id,
      teamId,
      userId,
      token: useToken,
      templateId,
      ...restInput,
      currency: template.currency?.toUpperCase(),
      template: restTemplate,
      paymentDetails: paymentDetails,
      fromDetails: fromDetails,
      customerDetails: customerDetails,
      noteDetails: noteDetails,
    })
    .onConflictDoUpdate({
      target: invoices.id,
      set: {
        teamId,
        userId,
        token: useToken,
        templateId,
        ...restInput,
        // Revert overdue to unpaid when due date is moved to the future
        status: sql`CASE
          WHEN ${invoices.status} = 'overdue' AND ${restInput.dueDate}::timestamp >= now()
          THEN 'unpaid'
          ELSE ${invoices.status}
        END`,
        currency: template.currency?.toUpperCase(),
        template: camelcaseKeys(restTemplate, { deep: true }),
        paymentDetails: paymentDetails,
        fromDetails: fromDetails,
        customerDetails: customerDetails,
        noteDetails: noteDetails,
      },
    })
    .returning();

  return result;
}

export type GetInvoiceSummaryParams = {
  teamId: string;
  statuses?: (
    | "paid"
    | "canceled"
    | "overdue"
    | "unpaid"
    | "draft"
    | "scheduled"
  )[];
};

export async function getInvoiceSummary(
  db: Database,
  params: GetInvoiceSummaryParams,
) {
  const { teamId, statuses } = params;

  const whereConditions: SQL[] = [eq(invoices.teamId, teamId)];

  // Handle multiple statuses
  if (statuses && statuses.length > 0) {
    whereConditions.push(inArray(invoices.status, statuses));
  }

  // Get team's base currency
  const [team] = await db
    .select({ baseCurrency: teams.baseCurrency })
    .from(teams)
    .where(eq(teams.id, teamId))
    .limit(1);

  const baseCurrency = team?.baseCurrency || "USD";

  // Get all invoices with their amounts and currencies
  const invoiceData = await db
    .select({
      amount: invoices.amount,
      currency: invoices.currency,
    })
    .from(invoices)
    .where(and(...whereConditions));

  if (invoiceData.length === 0) {
    return {
      totalAmount: 0,
      invoiceCount: 0,
      currency: baseCurrency,
    };
  }

  // Convert all amounts to base currency and track currency breakdown
  let totalAmount = 0;
  const currencyBreakdown = new Map<
    string,
    { amount: number; count: number; convertedAmount: number }
  >();

  for (const invoice of invoiceData) {
    const amount = Number(invoice.amount) || 0;
    const currency = invoice.currency || baseCurrency;

    if (currency === baseCurrency) {
      totalAmount += amount;
      const existing = currencyBreakdown.get(currency) || {
        amount: 0,
        count: 0,
        convertedAmount: 0,
      };
      currencyBreakdown.set(currency, {
        amount: existing.amount + amount,
        count: existing.count + 1,
        convertedAmount: existing.convertedAmount + amount,
      });
    } else {
      // Get exchange rate for this currency to base currency
      const [exchangeRate] = await db
        .select({ rate: exchangeRates.rate })
        .from(exchangeRates)
        .where(
          and(
            eq(exchangeRates.base, currency),
            eq(exchangeRates.target, baseCurrency),
          ),
        )
        .limit(1);

      if (exchangeRate?.rate) {
        const convertedAmount = amount * Number(exchangeRate.rate);
        totalAmount += convertedAmount;

        const existing = currencyBreakdown.get(currency) || {
          amount: 0,
          count: 0,
          convertedAmount: 0,
        };
        currencyBreakdown.set(currency, {
          amount: existing.amount + amount,
          count: existing.count + 1,
          convertedAmount: existing.convertedAmount + convertedAmount,
        });
      }
      // Skip invoices with missing exchange rates to avoid mixing currencies
      // This prevents silently producing incorrect totals
    }
  }

  // Convert breakdown to array and sort by amount (descending)
  const breakdown = Array.from(currencyBreakdown.entries())
    .map(([currency, data]) => ({
      currency,
      originalAmount: Math.round(data.amount * 100) / 100,
      convertedAmount: Math.round(data.convertedAmount * 100) / 100,
      count: data.count,
    }))
    .sort((a, b) => b.originalAmount - a.originalAmount);

  // Count only invoices that were successfully included in the calculation
  // (i.e., invoices with valid exchange rates or in base currency)
  const invoiceCount = Array.from(currencyBreakdown.values()).reduce(
    (sum, data) => sum + data.count,
    0,
  );

  return {
    totalAmount: Math.round(totalAmount * 100) / 100, // Round to 2 decimal places
    invoiceCount,
    currency: baseCurrency,
    breakdown: breakdown.length > 1 ? breakdown : undefined, // Only include if multiple currencies
  };
}

export type DeleteInvoiceParams = {
  id: string;
  teamId: string;
};

export async function deleteInvoice(db: Database, params: DeleteInvoiceParams) {
  const { id, teamId } = params;

  const [result] = await db
    .delete(invoices)
    .where(
      and(
        eq(invoices.id, id),
        eq(invoices.teamId, teamId),
        and(or(eq(invoices.status, "draft"), eq(invoices.status, "canceled"))),
      ),
    )
    .returning({
      id: invoices.id,
    });

  return result;
}

export type DuplicateInvoiceParams = {
  id: string;
  userId: string;
  invoiceNumber: string;
  teamId: string;
};

export async function duplicateInvoice(
  db: Database,
  params: DuplicateInvoiceParams,
) {
  const { id, userId, invoiceNumber, teamId } = params;

  // 1. Fetch the invoice that needs to be duplicated
  const [invoice] = await db
    .select({
      teamId: invoices.teamId,
      template: invoices.template,
      customerId: invoices.customerId,
      customerName: invoices.customerName,
      vat: invoices.vat,
      tax: invoices.tax,
      discount: invoices.discount,
      subtotal: invoices.subtotal,
      amount: invoices.amount,
      paymentDetails: invoices.paymentDetails,
      noteDetails: invoices.noteDetails,
      topBlock: invoices.topBlock,
      bottomBlock: invoices.bottomBlock,
      fromDetails: invoices.fromDetails,
      customerDetails: invoices.customerDetails,
      lineItems: invoices.lineItems,
    })
    .from(invoices)
    .where(and(eq(invoices.id, id), eq(invoices.teamId, teamId)));

  if (!invoice) {
    throw new Error("Invoice not found");
  }

  const draftId = uuidv4();
  const token = await generateToken(draftId);

  const result = await draftInvoice(db, {
    id: draftId,
    token,
    userId,
    teamId: invoice.teamId,
    template: invoice.template as DraftInvoiceTemplateParams,
    dueDate: addMonths(new Date(), 1).toISOString(),
    issueDate: new Date().toISOString(),
    invoiceNumber,
    customerId: invoice.customerId,
    customerName: invoice.customerName,
    vat: invoice.vat,
    tax: invoice.tax,
    discount: invoice.discount,
    subtotal: invoice.subtotal,
    amount: invoice.amount,

    // @ts-expect-error - JSONB
    paymentDetails: invoice.paymentDetails,
    // @ts-expect-error - JSONB
    noteDetails: invoice.noteDetails,
    // @ts-expect-error - JSONB
    topBlock: invoice.topBlock,
    // @ts-expect-error - JSONB
    bottomBlock: invoice.bottomBlock,
    // @ts-expect-error - JSONB
    fromDetails: invoice.fromDetails,
    // @ts-expect-error - JSONB
    customerDetails: invoice.customerDetails,
    // @ts-expect-error - JSONB
    lineItems: invoice.lineItems,
  });

  logActivity({
    db,
    teamId,
    userId,
    type: "invoice_duplicated",
    metadata: {
      originalInvoiceId: id,
      newInvoiceId: result?.id,
      newInvoiceNumber: result?.invoiceNumber,
    },
  });

  return result;
}

export type UpdateInvoiceParams = {
  id: string;
  status?: "paid" | "canceled" | "unpaid" | "scheduled" | "draft" | "refunded";
  paidAt?: string | null;
  internalNote?: string | null;
  reminderSentAt?: string | null;
  scheduledAt?: string | null;
  scheduledJobId?: string | null;
  paymentIntentId?: string | null;
  refundedAt?: string | null;
  sentTo?: string | null;
  sentAt?: string | null;
  filePath?: string[] | null;
  fileSize?: number | null;
  invoiceRecurringId?: string | null;
  recurringSequence?: number | null;
  teamId: string;
  userId?: string;
};

export async function updateInvoice(
  db: DatabaseOrTransaction,
  params: UpdateInvoiceParams,
) {
  const { id, teamId, userId, ...rest } = params;

  const [result] = await db
    .update(invoices)
    .set(rest)
    .where(and(eq(invoices.id, id), eq(invoices.teamId, teamId)))
    .returning();

  // Log activity if not draft
  if (rest.status !== "draft" && userId) {
    let priority: number | undefined;
    let activityType: (typeof activityTypeEnum.enumValues)[number] | null =
      null;

    if (rest.status === "paid") {
      activityType = "invoice_paid";
      priority = 3;
    } else if (rest.status === "canceled") {
      activityType = "invoice_cancelled";
      priority = 3;
    }

    if (activityType) {
      logActivity({
        db,
        teamId,
        userId,
        type: activityType,
        priority,
        metadata: {
          recordId: id,
          invoiceNumber: result?.invoiceNumber,
          customerName: result?.customerName,
          newStatus: rest.status,
          paidAt: rest.paidAt,
        },
      });
    }
  }

  return result;
}

export type GetMostActiveClientParams = {
  teamId: string;
};

export async function getMostActiveClient(
  db: Database,
  params: GetMostActiveClientParams,
) {
  const { teamId } = params;

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const result = await db
    .select({
      customerId: customers.id,
      customerName: customers.name,
      invoiceCount: sql<number>`COUNT(DISTINCT ${invoices.id})::int`,
      totalTrackerTime: sql<number>`COALESCE(SUM(${trackerEntries.duration}), 0)::int`,
    })
    .from(customers)
    .leftJoin(
      invoices,
      and(
        eq(invoices.customerId, customers.id),
        gte(invoices.createdAt, thirtyDaysAgo.toISOString()),
      ),
    )
    .leftJoin(trackerProjects, eq(trackerProjects.customerId, customers.id))
    .leftJoin(
      trackerEntries,
      and(
        eq(trackerEntries.projectId, trackerProjects.id),
        gte(
          trackerEntries.date,
          thirtyDaysAgo.toISOString().split("T")[0] ?? "",
        ),
      ),
    )
    .where(eq(customers.teamId, teamId))
    .groupBy(customers.id, customers.name)
    .having(
      sql`COUNT(DISTINCT ${invoices.id}) > 0 OR COALESCE(SUM(${trackerEntries.duration}), 0) > 0`,
    )
    .orderBy(
      sql`(COUNT(DISTINCT ${invoices.id}) + COALESCE(SUM(${trackerEntries.duration}) / 3600, 0)) DESC`,
    )
    .limit(1);

  return result[0] || null;
}

export type GetInactiveClientsCountParams = {
  teamId: string;
};

export async function getInactiveClientsCount(
  db: Database,
  params: GetInactiveClientsCountParams,
) {
  const { teamId } = params;

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Use a subquery to properly count inactive clients
  const [result] = await db
    .select({
      count: sql<number>`COUNT(*)::int`,
    })
    .from(
      db
        .select({
          customerId: customers.id,
        })
        .from(customers)
        .leftJoin(
          invoices,
          and(
            eq(invoices.customerId, customers.id),
            gte(invoices.createdAt, thirtyDaysAgo.toISOString()),
          ),
        )
        .leftJoin(trackerProjects, eq(trackerProjects.customerId, customers.id))
        .leftJoin(
          trackerEntries,
          and(
            eq(trackerEntries.projectId, trackerProjects.id),
            gte(
              trackerEntries.date,
              thirtyDaysAgo.toISOString().split("T")[0] ?? "",
            ),
          ),
        )
        .where(eq(customers.teamId, teamId))
        .groupBy(customers.id)
        .having(
          sql`COUNT(DISTINCT ${invoices.id}) = 0 AND COALESCE(SUM(${trackerEntries.duration}), 0) = 0`,
        )
        .as("inactive_customers"),
    );

  return result?.count || 0;
}

export type GetAverageDaysToPaymentParams = {
  teamId: string;
};

export async function getAverageDaysToPayment(
  db: Database,
  params: GetAverageDaysToPaymentParams,
) {
  const { teamId } = params;

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [result] = await db
    .select({
      averageDays: sql<number>`ROUND(AVG(DATE_PART('day', ${invoices.paidAt}::timestamp - ${invoices.sentAt}::timestamp)))::int`,
    })
    .from(invoices)
    .where(
      and(
        eq(invoices.teamId, teamId),
        eq(invoices.status, "paid"),
        isNotNull(invoices.paidAt),
        isNotNull(invoices.sentAt),
        gte(invoices.paidAt, thirtyDaysAgo.toISOString()),
      ),
    );

  return result?.averageDays || 0;
}

export type GetAverageInvoiceSizeParams = {
  teamId: string;
};

export async function getAverageInvoiceSize(
  db: Database,
  params: GetAverageInvoiceSizeParams,
) {
  const { teamId } = params;

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const result = await db
    .select({
      currency: invoices.currency,
      averageAmount: sql<number>`ROUND(AVG(${invoices.amount}), 2)::float`,
      invoiceCount: sql<number>`COUNT(*)::int`,
    })
    .from(invoices)
    .where(
      and(
        eq(invoices.teamId, teamId),
        gte(invoices.sentAt, thirtyDaysAgo.toISOString()),
        isNotNull(invoices.sentAt),
      ),
    )
    .groupBy(invoices.currency);

  return result;
}

export type GetInvoicePaymentAnalysisParams = {
  teamId: string;
  from: string;
  to: string;
  currency?: string;
};

export type InvoicePaymentAnalysisResult = {
  metrics: {
    averageDaysToPay: number;
    paymentRate: number;
    overdueRate: number;
    paymentScore: number;
    totalInvoices: number;
    paidInvoices: number;
    unpaidInvoices: number;
    overdueInvoices: number;
    overdueAmount: number;
  };
  paymentTrends: Array<{
    month: string;
    averageDaysToPay: number;
    paymentRate: number;
    invoiceCount: number;
  }>;
  overdueSummary: {
    count: number;
    totalAmount: number;
    oldestDays: number;
  };
};

export async function getInvoicePaymentAnalysis(
  db: Database,
  params: GetInvoicePaymentAnalysisParams,
): Promise<InvoicePaymentAnalysisResult> {
  const { teamId, from, to, currency: inputCurrency } = params;

  const fromDate = startOfMonth(new UTCDate(parseISO(from)));
  const toDate = endOfMonth(new UTCDate(parseISO(to)));

  // Get team's base currency
  const [team] = await db
    .select({ baseCurrency: teams.baseCurrency })
    .from(teams)
    .where(eq(teams.id, teamId))
    .limit(1);

  const targetCurrency = inputCurrency || team?.baseCurrency || "USD";

  // Build base conditions
  const baseConditions = [
    eq(invoices.teamId, teamId),
    gte(invoices.createdAt, format(fromDate, "yyyy-MM-dd")),
    lte(invoices.createdAt, format(toDate, "yyyy-MM-dd")),
  ];

  if (inputCurrency) {
    baseConditions.push(eq(invoices.currency, inputCurrency));
  }

  // Get all invoices in date range
  const allInvoices = await db
    .select({
      id: invoices.id,
      amount: invoices.amount,
      currency: invoices.currency,
      status: invoices.status,
      dueDate: invoices.dueDate,
      paidAt: invoices.paidAt,
      createdAt: invoices.createdAt,
      issueDate: invoices.issueDate,
    })
    .from(invoices)
    .where(and(...baseConditions));

  if (allInvoices.length === 0) {
    return {
      metrics: {
        averageDaysToPay: 0,
        paymentRate: 0,
        overdueRate: 0,
        paymentScore: 0,
        totalInvoices: 0,
        paidInvoices: 0,
        unpaidInvoices: 0,
        overdueInvoices: 0,
        overdueAmount: 0,
      },
      paymentTrends: [],
      overdueSummary: {
        count: 0,
        totalAmount: 0,
        oldestDays: 0,
      },
    };
  }

  // Calculate metrics
  const paidInvoices = allInvoices.filter((inv) => inv.status === "paid");
  const unpaidInvoices = allInvoices.filter(
    (inv) => inv.status === "unpaid" || inv.status === "overdue",
  );
  const overdueInvoices = allInvoices.filter(
    (inv) =>
      (inv.status === "overdue" ||
        (inv.status === "unpaid" &&
          inv.dueDate &&
          parseISO(inv.dueDate) < new Date())) &&
      !inv.paidAt,
  );

  // Calculate average days to pay (from issue date or created date to paid date)
  let totalDaysToPay = 0;
  let paidCount = 0;

  for (const invoice of paidInvoices) {
    if (invoice.paidAt) {
      const issueDate =
        invoice.issueDate || invoice.createdAt || invoice.dueDate;
      if (issueDate) {
        const daysToPay =
          (new Date(invoice.paidAt).getTime() - parseISO(issueDate).getTime()) /
          (1000 * 60 * 60 * 24);
        if (daysToPay >= 0) {
          totalDaysToPay += daysToPay;
          paidCount++;
        }
      }
    }
  }

  const averageDaysToPay =
    paidCount > 0 ? Math.round(totalDaysToPay / paidCount) : 0;

  // Calculate payment rate
  const paymentRate =
    allInvoices.length > 0
      ? Math.round((paidInvoices.length / allInvoices.length) * 100)
      : 0;

  // Calculate overdue rate
  const overdueRate =
    allInvoices.length > 0
      ? Math.round((overdueInvoices.length / allInvoices.length) * 100)
      : 0;

  // Calculate overdue amount (convert to target currency)
  let overdueAmount = 0;
  for (const invoice of overdueInvoices) {
    const amount = Number(invoice.amount) || 0;
    if (invoice.currency === targetCurrency) {
      overdueAmount += amount;
    } else {
      // For simplicity, use amount as-is (could add currency conversion)
      overdueAmount += amount;
    }
  }

  // Calculate payment score (similar to getPaymentStatus logic)
  let paymentScore = 100;
  if (averageDaysToPay > 30) {
    paymentScore = Math.max(0, 100 - (averageDaysToPay - 30) * 2);
  } else if (averageDaysToPay > 14) {
    paymentScore = 85 - ((averageDaysToPay - 14) / 16) * 25;
  } else if (averageDaysToPay > 7) {
    paymentScore = 100 - ((averageDaysToPay - 7) / 7) * 15;
  }

  // Adjust score based on overdue rate
  paymentScore = Math.max(0, Math.min(100, paymentScore - overdueRate * 0.5));

  // Calculate payment trends by month
  const monthSeries = eachMonthOfInterval({ start: fromDate, end: toDate });
  const paymentTrends = monthSeries.map((monthStart) => {
    const monthEnd = endOfMonth(monthStart);
    const monthStr = format(monthStart, "yyyy-MM");

    const monthInvoices = allInvoices.filter((inv) => {
      const invDate = inv.createdAt || inv.issueDate;
      if (!invDate) return false;
      const invDateObj = parseISO(invDate);
      return invDateObj >= monthStart && invDateObj <= monthEnd;
    });

    const monthPaid = monthInvoices.filter((inv) => inv.status === "paid");
    let monthTotalDays = 0;
    let monthPaidCount = 0;

    for (const invoice of monthPaid) {
      if (invoice.paidAt) {
        const issueDate =
          invoice.issueDate || invoice.createdAt || invoice.dueDate;
        if (issueDate) {
          const daysToPay =
            (new Date(invoice.paidAt).getTime() -
              parseISO(issueDate).getTime()) /
            (1000 * 60 * 60 * 24);
          if (daysToPay >= 0) {
            monthTotalDays += daysToPay;
            monthPaidCount++;
          }
        }
      }
    }

    const monthAvgDays =
      monthPaidCount > 0 ? Math.round(monthTotalDays / monthPaidCount) : 0;
    const monthPaymentRate =
      monthInvoices.length > 0
        ? Math.round((monthPaid.length / monthInvoices.length) * 100)
        : 0;

    return {
      month: monthStr,
      averageDaysToPay: monthAvgDays,
      paymentRate: monthPaymentRate,
      invoiceCount: monthInvoices.length,
    };
  });

  // Calculate overdue summary
  let oldestDays = 0;
  const now = new Date();
  for (const invoice of overdueInvoices) {
    if (invoice.dueDate) {
      const daysOverdue =
        (now.getTime() - parseISO(invoice.dueDate).getTime()) /
        (1000 * 60 * 60 * 24);
      oldestDays = Math.max(oldestDays, Math.round(daysOverdue));
    }
  }

  return {
    metrics: {
      averageDaysToPay,
      paymentRate,
      overdueRate,
      paymentScore: Math.round(paymentScore),
      totalInvoices: allInvoices.length,
      paidInvoices: paidInvoices.length,
      unpaidInvoices: unpaidInvoices.length,
      overdueInvoices: overdueInvoices.length,
      overdueAmount: Math.round(overdueAmount * 100) / 100,
    },
    paymentTrends,
    overdueSummary: {
      count: overdueInvoices.length,
      totalAmount: Math.round(overdueAmount * 100) / 100,
      oldestDays,
    },
  };
}
