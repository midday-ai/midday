import { UTCDate } from "@date-fns/utc";
import type { Database, DatabaseOrTransaction } from "@db/client";
import {
  type activityTypeEnum,
  merchants,
  exchangeRates,
  dealRecurring,
  dealStatusEnum,
  dealTemplates,
  deals,
  teams,
  users,
} from "@db/schema";
import { buildSearchQuery } from "@midday/db/utils/search-query";
import { generateToken } from "@midday/deal/token";
import type { EditorDoc, LineItem } from "@midday/deal/types";
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
import { logActivity } from "../utils/log-activity";

export type Template = {
  id?: string; // Reference to deal_templates table
  name?: string; // Template name for display
  isDefault?: boolean; // Whether this is the default template
  customerLabel: string;
  title: string;
  fromLabel: string;
  dealNoLabel: string;
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

export type GetDealsParams = {
  teamId: string;
  cursor?: string | null;
  pageSize?: number;
  q?: string | null;
  statuses?: string[] | null;
  merchants?: string[] | null;
  start?: string | null;
  end?: string | null;
  sort?: string[] | null;
  ids?: string[] | null;
  recurringIds?: string[] | null;
  recurring?: boolean | null;
};

export async function getDeals(db: Database, params: GetDealsParams) {
  const {
    teamId,
    sort,
    cursor,
    pageSize = 25,
    q,
    statuses,
    start,
    end,
    merchants: merchantIds,
    ids,
    recurringIds,
    recurring,
  } = params;

  const whereConditions: SQL[] = [eq(deals.teamId, teamId)];

  // Apply IDs filter
  if (ids && ids.length > 0) {
    whereConditions.push(inArray(deals.id, ids));
  }

  // Apply recurring series IDs filter (shows all deals from these recurring series)
  if (recurringIds && recurringIds.length > 0) {
    whereConditions.push(inArray(deals.dealRecurringId, recurringIds));
  }

  // Apply recurring filter (shows all deals that are/aren't part of a recurring series)
  if (recurring === true) {
    whereConditions.push(isNotNull(deals.dealRecurringId));
  } else if (recurring === false) {
    whereConditions.push(isNull(deals.dealRecurringId));
  }

  // Apply status filter
  if (statuses && statuses.length > 0) {
    // Cast the statuses array to the correct enum type
    const validStatuses = statuses.filter((status) =>
      dealStatusEnum.enumValues.includes(
        status as (typeof dealStatusEnum.enumValues)[number],
      ),
    ) as (typeof dealStatusEnum.enumValues)[number][];

    if (validStatuses.length > 0) {
      whereConditions.push(inArray(deals.status, validStatuses));
    }
  }

  // Apply date range filter
  if (start && end) {
    whereConditions.push(gte(deals.dueDate, start));
    whereConditions.push(lte(deals.dueDate, end));
  }

  // Apply merchant filter
  if (merchantIds && merchantIds.length > 0) {
    whereConditions.push(inArray(deals.merchantId, merchantIds));
  }

  // Apply search query filter
  if (q) {
    // If the query is a number, search by amount
    if (!Number.isNaN(Number.parseInt(q))) {
      whereConditions.push(
        sql`${deals.amount}::text = ${Number(q).toString()}`,
      );
    } else {
      const query = buildSearchQuery(q);

      // Search using full-text search, dealNumber, or merchantName
      whereConditions.push(
        sql`(to_tsquery('english', ${query}) @@ ${deals.fts} OR ${deals.dealNumber} ILIKE '%' || ${q} || '%' OR ${deals.merchantName} ILIKE '%' || ${q} || '%')`,
      );
    }
  }

  // Start building the query
  const query = db
    .select({
      id: deals.id,
      dueDate: deals.dueDate,
      dealNumber: deals.dealNumber,
      createdAt: deals.createdAt,
      amount: deals.amount,
      currency: deals.currency,
      lineItems: deals.lineItems,
      paymentDetails: deals.paymentDetails,
      merchantDetails: deals.merchantDetails,
      reminderSentAt: deals.reminderSentAt,
      updatedAt: deals.updatedAt,
      note: deals.note,
      internalNote: deals.internalNote,
      paidAt: deals.paidAt,
      vat: deals.vat,
      tax: deals.tax,
      filePath: deals.filePath,
      status: deals.status,
      fileSize: deals.fileSize,
      viewedAt: deals.viewedAt,
      fromDetails: deals.fromDetails,
      issueDate: deals.issueDate,
      sentAt: deals.sentAt,
      template: deals.template,
      noteDetails: deals.noteDetails,
      merchantName: deals.merchantName,
      token: deals.token,
      sentTo: deals.sentTo,
      discount: deals.discount,
      subtotal: deals.subtotal,
      topBlock: deals.topBlock,
      bottomBlock: deals.bottomBlock,
      scheduledAt: deals.scheduledAt,
      scheduledJobId: deals.scheduledJobId,
      merchant: {
        id: merchants.id,
        name: merchants.name,
        website: merchants.website,
        email: merchants.email,
      },
      merchantId: deals.merchantId,
      team: {
        name: teams.name,
      },
      // Recurring deal fields
      dealRecurringId: deals.dealRecurringId,
      recurringSequence: deals.recurringSequence,
      recurring: {
        id: dealRecurring.id,
        status: dealRecurring.status,
        frequency: dealRecurring.frequency,
        frequencyInterval: dealRecurring.frequencyInterval,
        endType: dealRecurring.endType,
        endCount: dealRecurring.endCount,
        dealsGenerated: dealRecurring.dealsGenerated,
        nextScheduledAt: dealRecurring.nextScheduledAt,
      },
    })
    .from(deals)
    .leftJoin(merchants, eq(deals.merchantId, merchants.id))
    .leftJoin(teams, eq(deals.teamId, teams.id))
    .leftJoin(
      dealRecurring,
      eq(deals.dealRecurringId, dealRecurring.id),
    )
    .where(and(...whereConditions));

  // Apply sorting
  if (sort && sort.length === 2) {
    const [column, direction] = sort;
    const isAscending = direction === "asc";

    if (column === "merchant") {
      isAscending
        ? query.orderBy(asc(merchants.name))
        : query.orderBy(desc(merchants.name));
    } else if (column === "created_at") {
      isAscending
        ? query.orderBy(asc(deals.createdAt))
        : query.orderBy(desc(deals.createdAt));
    } else if (column === "due_date") {
      isAscending
        ? query.orderBy(asc(deals.dueDate))
        : query.orderBy(desc(deals.dueDate));
    } else if (column === "amount") {
      isAscending
        ? query.orderBy(asc(deals.amount))
        : query.orderBy(desc(deals.amount));
    } else if (column === "status") {
      isAscending
        ? query.orderBy(asc(deals.status))
        : query.orderBy(desc(deals.status));
    }
  } else {
    // Default sort by created_at descending
    query.orderBy(desc(deals.createdAt));
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

export type GetDealByIdParams = {
  id: string;
  teamId?: string;
};

export async function getDealById(
  db: Database,
  params: GetDealByIdParams,
) {
  const { id, teamId } = params;

  const [result] = await db
    .select({
      id: deals.id,
      dueDate: deals.dueDate,
      dealNumber: deals.dealNumber,
      createdAt: deals.createdAt,
      amount: deals.amount,
      currency: deals.currency,
      lineItems: deals.lineItems,
      paymentDetails: deals.paymentDetails,
      merchantDetails: deals.merchantDetails,
      reminderSentAt: deals.reminderSentAt,
      updatedAt: deals.updatedAt,
      note: deals.note,
      internalNote: deals.internalNote,
      paidAt: deals.paidAt,
      vat: deals.vat,
      tax: deals.tax,
      filePath: deals.filePath,
      status: deals.status,
      fileSize: deals.fileSize,
      viewedAt: deals.viewedAt,
      fromDetails: deals.fromDetails,
      issueDate: deals.issueDate,
      sentAt: deals.sentAt,
      template: deals.template,
      templateId: deals.templateId,
      noteDetails: deals.noteDetails,
      merchantName: deals.merchantName,
      token: deals.token,
      sentTo: deals.sentTo,
      discount: deals.discount,
      subtotal: deals.subtotal,
      topBlock: deals.topBlock,
      bottomBlock: deals.bottomBlock,
      scheduledAt: deals.scheduledAt,
      scheduledJobId: deals.scheduledJobId,
      paymentIntentId: deals.paymentIntentId,
      refundedAt: deals.refundedAt,
      teamId: deals.teamId,
      merchant: {
        id: merchants.id,
        name: merchants.name,
        website: merchants.website,
        email: merchants.email,
        billingEmail: merchants.billingEmail,
        portalId: merchants.portalId,
        portalEnabled: merchants.portalEnabled,
      },
      merchantId: deals.merchantId,
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
      // Join to get the template name and isDefault from deal_templates
      dealTemplate: {
        id: dealTemplates.id,
        name: dealTemplates.name,
        isDefault: dealTemplates.isDefault,
      },
      // Recurring deal data
      dealRecurringId: deals.dealRecurringId,
      recurringSequence: deals.recurringSequence,
      recurring: {
        id: dealRecurring.id,
        frequency: dealRecurring.frequency,
        frequencyInterval: dealRecurring.frequencyInterval,
        status: dealRecurring.status,
        nextScheduledAt: dealRecurring.nextScheduledAt,
        endType: dealRecurring.endType,
        endCount: dealRecurring.endCount,
        dealsGenerated: dealRecurring.dealsGenerated,
      },
    })
    .from(deals)
    .leftJoin(merchants, eq(deals.merchantId, merchants.id))
    .leftJoin(teams, eq(deals.teamId, teams.id))
    .leftJoin(users, eq(deals.userId, users.id))
    .leftJoin(dealTemplates, eq(deals.templateId, dealTemplates.id))
    .leftJoin(
      dealRecurring,
      eq(deals.dealRecurringId, dealRecurring.id),
    )
    .where(
      and(
        eq(deals.id, id),
        // This is when we use the token to get the deal
        teamId !== undefined ? eq(deals.teamId, teamId) : undefined,
      ),
    );

  if (!result) {
    return null;
  }

  const template = camelcaseKeys(result?.template as Record<string, unknown>, {
    deep: true,
  }) as Template;

  // Populate template metadata from the joined deal_templates table
  // This ensures correct display even for drafts saved before multi-template feature
  if (result.dealTemplate?.id) {
    template.id = result.dealTemplate.id;
    template.name = result.dealTemplate.name ?? "Default";
    template.isDefault = result.dealTemplate.isDefault ?? false;
  } else if (result.templateId) {
    // Fallback: if templateId exists but join failed, at least set the id
    template.id = result.templateId;
  }

  // Remove the dealTemplate from the result as it's merged into template
  const { dealTemplate: _, ...restResult } = result;

  return {
    ...restResult,
    template,
    lineItems: result.lineItems as LineItem[],
    paymentDetails: result.paymentDetails as EditorDoc | null,
    merchantDetails: result.merchantDetails as EditorDoc | null,
    fromDetails: result.fromDetails as EditorDoc | null,
    noteDetails: result.noteDetails as EditorDoc | null,
    topBlock: result.topBlock as EditorDoc | null,
    bottomBlock: result.bottomBlock as EditorDoc | null,
  };
}

/**
 * Get a deal by its Stripe payment intent ID.
 * Used by webhooks to find deals when processing refunds.
 */
export async function getDealByPaymentIntentId(
  db: Database,
  paymentIntentId: string,
) {
  const [result] = await db
    .select({
      id: deals.id,
      teamId: deals.teamId,
      status: deals.status,
      dealNumber: deals.dealNumber,
      merchantName: deals.merchantName,
      paymentIntentId: deals.paymentIntentId,
    })
    .from(deals)
    .where(eq(deals.paymentIntentId, paymentIntentId))
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
  const dealData = await db.executeOnReplica(
    sql`
      SELECT 
        i.id,
        i.due_date,
        i.paid_at,
        i.status,
        i.amount,
        i.currency
      FROM deals i
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

  if (!Array.isArray(dealData) || dealData.length === 0) {
    return {
      score: 0,
      paymentStatus: "none",
    };
  }

  // Calculate weighted average days overdue (recent deals matter more)
  let totalWeightedDays = 0;
  let totalWeight = 0;
  let onTimeCount = 0;
  let lateCount = 0;

  for (const deal of dealData) {
    if (!deal.due_date) continue;

    const dueDate = new Date(deal.due_date as string);
    let daysOverdue = 0;

    if (deal.status === "paid" && deal.paid_at) {
      // For paid deals, calculate days between due_date and paid_at
      const paidDate = new Date(deal.paid_at as string);
      daysOverdue =
        (paidDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24);
    } else if (
      (deal.status === "unpaid" || deal.status === "overdue") &&
      deal.paid_at === null
    ) {
      // For unpaid/overdue deals, calculate days between due_date and current date
      const currentDate = new Date();
      daysOverdue =
        (currentDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24);
    }

    // Weight: recent deals (last 90 days) get higher weight
    const daysSinceDue = Math.abs(
      (new Date().getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24),
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

type SearchDealNumberParams = {
  teamId: string;
  query: string;
};

export async function searchDealNumber(
  db: Database,
  params: SearchDealNumberParams,
) {
  const [result] = await db
    .select({
      dealNumber: deals.dealNumber,
    })
    .from(deals)
    .where(
      and(
        eq(deals.teamId, params.teamId),
        ilike(deals.dealNumber, `%${params.query}`),
      ),
    )
    .limit(1);

  return result ?? null;
}

/**
 * Generate the next deal number for a team.
 * Format: D-XXXX (e.g., D-0001, D-0042)
 *
 * Logic:
 * 1. Find the highest numeric suffix from existing deal numbers
 * 2. If found, increment by 1
 * 3. If not found, count total deals + 1
 * 4. Pad to 4 digits with leading zeros
 */
export async function getNextDealNumber(
  db: DatabaseOrTransaction,
  teamId: string,
): Promise<string> {
  const PREFIX = "D-";
  const PAD_LENGTH = 4;

  // Find the highest deal number with a numeric suffix for this team
  // Using raw SQL for the regex extraction since Drizzle doesn't support it natively
  const maxDealResult = await db
    .select({ dealNumber: deals.dealNumber })
    .from(deals)
    .where(
      and(
        eq(deals.teamId, teamId),
        sql`${deals.dealNumber} ~ '[0-9]+$'`,
      ),
    )
    .orderBy(
      sql`CAST(SUBSTRING(${deals.dealNumber} FROM '[0-9]+$') AS INTEGER) DESC`,
    )
    .limit(1);

  let nextNumber: number;

  if (maxDealResult.length > 0 && maxDealResult[0]?.dealNumber) {
    // Extract the numeric part from the deal number
    const match = maxDealResult[0].dealNumber.match(/(\d+)$/);

    if (match?.[1]) {
      // Increment the numeric part
      nextNumber = Number.parseInt(match[1], 10) + 1;
    } else {
      // Fallback: count total deals + 1
      const countResult = await db
        .select({ count: count() })
        .from(deals)
        .where(eq(deals.teamId, teamId));

      nextNumber = (countResult[0]?.count ?? 0) + 1;
    }
  } else {
    // No deals with numeric suffix found, count total deals + 1
    const countResult = await db
      .select({ count: count() })
      .from(deals)
      .where(eq(deals.teamId, teamId));

    nextNumber = (countResult[0]?.count ?? 0) + 1;
  }

  // Pad with leading zeros
  const paddedNumber = nextNumber.toString().padStart(PAD_LENGTH, "0");

  return `${PREFIX}${paddedNumber}`;
}

export async function isDealNumberUsed(
  db: Database,
  teamId: string,
  dealNumber: string,
): Promise<boolean> {
  const [result] = await db
    .select({
      id: deals.id,
    })
    .from(deals)
    .where(
      and(
        eq(deals.teamId, teamId),
        eq(deals.dealNumber, dealNumber),
      ),
    )
    .limit(1);

  return !!result;
}

type DraftDealLineItemParams = {
  name?: string | null; // Stringified TipTap JSONContent
  quantity?: number;
  unit?: string | null;
  price?: number;
  vat?: number | null;
  tax?: number | null;
};

type DraftDealTemplateParams = {
  customerLabel?: string;
  title?: string;
  fromLabel?: string;
  dealNoLabel?: string;
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

type DraftDealParams = {
  id: string;
  template: DraftDealTemplateParams;
  templateId?: string | null;
  fromDetails?: string | null;
  merchantDetails?: string | null;
  merchantId?: string | null;
  merchantName?: string | null;
  paymentDetails?: string | null;
  noteDetails?: string | null;
  dueDate: string;
  issueDate: string;
  dealNumber: string;
  logoUrl?: string | null;
  vat?: number | null;
  tax?: number | null;
  discount?: number | null;
  subtotal?: number | null;
  topBlock?: string | null;
  bottomBlock?: string | null;
  amount?: number | null;
  lineItems?: DraftDealLineItemParams[];
  token?: string;
  teamId: string;
  userId: string;
};

export async function draftDeal(
  db: DatabaseOrTransaction,
  params: DraftDealParams,
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
    merchantDetails,
    noteDetails,
    ...restInput
  } = params;

  const useToken = token ?? (await generateToken(id));

  const { paymentDetails: _, fromDetails: __, ...restTemplate } = template;

  const [result] = await db
    .insert(deals)
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
      merchantDetails: merchantDetails,
      noteDetails: noteDetails,
    })
    .onConflictDoUpdate({
      target: deals.id,
      set: {
        teamId,
        userId,
        token: useToken,
        templateId,
        ...restInput,
        currency: template.currency?.toUpperCase(),
        template: camelcaseKeys(restTemplate, { deep: true }),
        paymentDetails: paymentDetails,
        fromDetails: fromDetails,
        merchantDetails: merchantDetails,
        noteDetails: noteDetails,
      },
    })
    .returning();

  return result;
}

export type GetDealSummaryParams = {
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

export async function getDealSummary(
  db: Database,
  params: GetDealSummaryParams,
) {
  const { teamId, statuses } = params;

  const whereConditions: SQL[] = [eq(deals.teamId, teamId)];

  // Handle multiple statuses
  if (statuses && statuses.length > 0) {
    whereConditions.push(inArray(deals.status, statuses));
  }

  // Get team's base currency
  const [team] = await db
    .select({ baseCurrency: teams.baseCurrency })
    .from(teams)
    .where(eq(teams.id, teamId))
    .limit(1);

  const baseCurrency = team?.baseCurrency || "USD";

  // Get all deals with their amounts and currencies
  const dealData = await db
    .select({
      amount: deals.amount,
      currency: deals.currency,
    })
    .from(deals)
    .where(and(...whereConditions));

  if (dealData.length === 0) {
    return {
      totalAmount: 0,
      dealCount: 0,
      currency: baseCurrency,
    };
  }

  // Convert all amounts to base currency and track currency breakdown
  let totalAmount = 0;
  const currencyBreakdown = new Map<
    string,
    { amount: number; count: number; convertedAmount: number }
  >();

  for (const deal of dealData) {
    const amount = Number(deal.amount) || 0;
    const currency = deal.currency || baseCurrency;

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
      // Skip deals with missing exchange rates to avoid mixing currencies
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

  // Count only deals that were successfully included in the calculation
  // (i.e., deals with valid exchange rates or in base currency)
  const dealCount = Array.from(currencyBreakdown.values()).reduce(
    (sum, data) => sum + data.count,
    0,
  );

  return {
    totalAmount: Math.round(totalAmount * 100) / 100, // Round to 2 decimal places
    dealCount,
    currency: baseCurrency,
    breakdown: breakdown.length > 1 ? breakdown : undefined, // Only include if multiple currencies
  };
}

export type DeleteDealParams = {
  id: string;
  teamId: string;
};

export async function deleteDeal(db: Database, params: DeleteDealParams) {
  const { id, teamId } = params;

  const [result] = await db
    .delete(deals)
    .where(
      and(
        eq(deals.id, id),
        eq(deals.teamId, teamId),
        and(or(eq(deals.status, "draft"), eq(deals.status, "canceled"))),
      ),
    )
    .returning({
      id: deals.id,
    });

  return result;
}

export type DuplicateDealParams = {
  id: string;
  userId: string;
  dealNumber: string;
  teamId: string;
};

export async function duplicateDeal(
  db: Database,
  params: DuplicateDealParams,
) {
  const { id, userId, dealNumber, teamId } = params;

  // 1. Fetch the deal that needs to be duplicated
  const [deal] = await db
    .select({
      teamId: deals.teamId,
      template: deals.template,
      merchantId: deals.merchantId,
      merchantName: deals.merchantName,
      vat: deals.vat,
      tax: deals.tax,
      discount: deals.discount,
      subtotal: deals.subtotal,
      amount: deals.amount,
      paymentDetails: deals.paymentDetails,
      noteDetails: deals.noteDetails,
      topBlock: deals.topBlock,
      bottomBlock: deals.bottomBlock,
      fromDetails: deals.fromDetails,
      merchantDetails: deals.merchantDetails,
      lineItems: deals.lineItems,
    })
    .from(deals)
    .where(and(eq(deals.id, id), eq(deals.teamId, teamId)));

  if (!deal) {
    throw new Error("Deal not found");
  }

  const draftId = uuidv4();
  const token = await generateToken(draftId);

  const result = await draftDeal(db, {
    id: draftId,
    token,
    userId,
    teamId: deal.teamId,
    template: deal.template as DraftDealTemplateParams,
    dueDate: addMonths(new Date(), 1).toISOString(),
    issueDate: new Date().toISOString(),
    dealNumber,
    merchantId: deal.merchantId,
    merchantName: deal.merchantName,
    vat: deal.vat,
    tax: deal.tax,
    discount: deal.discount,
    subtotal: deal.subtotal,
    amount: deal.amount,

    // @ts-expect-error - JSONB
    paymentDetails: deal.paymentDetails,
    // @ts-expect-error - JSONB
    noteDetails: deal.noteDetails,
    // @ts-expect-error - JSONB
    topBlock: deal.topBlock,
    // @ts-expect-error - JSONB
    bottomBlock: deal.bottomBlock,
    // @ts-expect-error - JSONB
    fromDetails: deal.fromDetails,
    // @ts-expect-error - JSONB
    merchantDetails: deal.merchantDetails,
    // @ts-expect-error - JSONB
    lineItems: deal.lineItems,
  });

  logActivity({
    db,
    teamId,
    userId,
    type: "deal_duplicated",
    metadata: {
      originalDealId: id,
      newDealId: result?.id,
      newDealNumber: result?.dealNumber,
    },
  });

  return result;
}

export type UpdateDealParams = {
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
  dealRecurringId?: string | null;
  recurringSequence?: number | null;
  teamId: string;
  userId?: string;
};

export async function updateDeal(
  db: DatabaseOrTransaction,
  params: UpdateDealParams,
) {
  const { id, teamId, userId, ...rest } = params;

  const [result] = await db
    .update(deals)
    .set(rest)
    .where(and(eq(deals.id, id), eq(deals.teamId, teamId)))
    .returning();

  // Log activity if not draft
  if (rest.status !== "draft" && userId) {
    let priority: number | undefined = undefined;
    let activityType: (typeof activityTypeEnum.enumValues)[number] | null =
      null;

    if (rest.status === "paid") {
      activityType = "deal_paid";
      priority = 3;
    } else if (rest.status === "canceled") {
      activityType = "deal_cancelled";
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
          dealNumber: result?.dealNumber,
          merchantName: result?.merchantName,
          newStatus: rest.status,
          paidAt: rest.paidAt,
        },
      });
    }
  }

  return result;
}

export type GetMostActiveMerchantParams = {
  teamId: string;
};

export async function getMostActiveMerchant(
  db: Database,
  params: GetMostActiveMerchantParams,
) {
  const { teamId } = params;

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const result = await db
    .select({
      merchantId: merchants.id,
      merchantName: merchants.name,
      dealCount: sql<number>`COUNT(DISTINCT ${deals.id})::int`,
    })
    .from(merchants)
    .innerJoin(
      deals,
      and(
        eq(deals.merchantId, merchants.id),
        gte(deals.createdAt, thirtyDaysAgo.toISOString()),
      ),
    )
    .where(eq(merchants.teamId, teamId))
    .groupBy(merchants.id, merchants.name)
    .orderBy(sql`COUNT(DISTINCT ${deals.id}) DESC`)
    .limit(1);

  return result[0] || null;
}

export type GetInactiveMerchantsCountParams = {
  teamId: string;
};

export async function getInactiveMerchantsCount(
  db: Database,
  params: GetInactiveMerchantsCountParams,
) {
  const { teamId } = params;

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Count merchants with no deals in last 30 days
  const [result] = await db
    .select({
      count: sql<number>`COUNT(*)::int`,
    })
    .from(
      db
        .select({
          merchantId: merchants.id,
        })
        .from(merchants)
        .leftJoin(
          deals,
          and(
            eq(deals.merchantId, merchants.id),
            gte(deals.createdAt, thirtyDaysAgo.toISOString()),
          ),
        )
        .where(eq(merchants.teamId, teamId))
        .groupBy(merchants.id)
        .having(sql`COUNT(DISTINCT ${deals.id}) = 0`)
        .as("inactive_merchants"),
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
      averageDays: sql<number>`ROUND(AVG(DATE_PART('day', ${deals.paidAt}::timestamp - ${deals.sentAt}::timestamp)))::int`,
    })
    .from(deals)
    .where(
      and(
        eq(deals.teamId, teamId),
        eq(deals.status, "paid"),
        isNotNull(deals.paidAt),
        isNotNull(deals.sentAt),
        gte(deals.paidAt, thirtyDaysAgo.toISOString()),
      ),
    );

  return result?.averageDays || 0;
}

export type GetAverageDealSizeParams = {
  teamId: string;
};

export async function getAverageDealSize(
  db: Database,
  params: GetAverageDealSizeParams,
) {
  const { teamId } = params;

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const result = await db
    .select({
      currency: deals.currency,
      averageAmount: sql<number>`ROUND(AVG(${deals.amount}), 2)::float`,
      dealCount: sql<number>`COUNT(*)::int`,
    })
    .from(deals)
    .where(
      and(
        eq(deals.teamId, teamId),
        gte(deals.sentAt, thirtyDaysAgo.toISOString()),
        isNotNull(deals.sentAt),
      ),
    )
    .groupBy(deals.currency);

  return result;
}

export type GetDealPaymentAnalysisParams = {
  teamId: string;
  from: string;
  to: string;
  currency?: string;
};

export type DealPaymentAnalysisResult = {
  metrics: {
    averageDaysToPay: number;
    paymentRate: number;
    overdueRate: number;
    paymentScore: number;
    totalDeals: number;
    paidDeals: number;
    unpaidDeals: number;
    overdueDeals: number;
    overdueAmount: number;
  };
  paymentTrends: Array<{
    month: string;
    averageDaysToPay: number;
    paymentRate: number;
    dealCount: number;
  }>;
  overdueSummary: {
    count: number;
    totalAmount: number;
    oldestDays: number;
  };
};

export async function getDealPaymentAnalysis(
  db: Database,
  params: GetDealPaymentAnalysisParams,
): Promise<DealPaymentAnalysisResult> {
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
    eq(deals.teamId, teamId),
    gte(deals.createdAt, format(fromDate, "yyyy-MM-dd")),
    lte(deals.createdAt, format(toDate, "yyyy-MM-dd")),
  ];

  if (inputCurrency) {
    baseConditions.push(eq(deals.currency, inputCurrency));
  }

  // Get all deals in date range
  const allDeals = await db
    .select({
      id: deals.id,
      amount: deals.amount,
      currency: deals.currency,
      status: deals.status,
      dueDate: deals.dueDate,
      paidAt: deals.paidAt,
      createdAt: deals.createdAt,
      issueDate: deals.issueDate,
    })
    .from(deals)
    .where(and(...baseConditions));

  if (allDeals.length === 0) {
    return {
      metrics: {
        averageDaysToPay: 0,
        paymentRate: 0,
        overdueRate: 0,
        paymentScore: 0,
        totalDeals: 0,
        paidDeals: 0,
        unpaidDeals: 0,
        overdueDeals: 0,
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
  const paidDeals = allDeals.filter((inv) => inv.status === "paid");
  const unpaidDeals = allDeals.filter(
    (inv) => inv.status === "unpaid" || inv.status === "overdue",
  );
  const overdueDeals = allDeals.filter(
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

  for (const deal of paidDeals) {
    if (deal.paidAt) {
      const issueDate =
        deal.issueDate || deal.createdAt || deal.dueDate;
      if (issueDate) {
        const daysToPay =
          (new Date(deal.paidAt).getTime() - parseISO(issueDate).getTime()) /
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
    allDeals.length > 0
      ? Math.round((paidDeals.length / allDeals.length) * 100)
      : 0;

  // Calculate overdue rate
  const overdueRate =
    allDeals.length > 0
      ? Math.round((overdueDeals.length / allDeals.length) * 100)
      : 0;

  // Calculate overdue amount (convert to target currency)
  let overdueAmount = 0;
  for (const deal of overdueDeals) {
    const amount = Number(deal.amount) || 0;
    if (deal.currency === targetCurrency) {
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

    const monthDeals = allDeals.filter((inv) => {
      const invDate = inv.createdAt || inv.issueDate;
      if (!invDate) return false;
      const invDateObj = parseISO(invDate);
      return invDateObj >= monthStart && invDateObj <= monthEnd;
    });

    const monthPaid = monthDeals.filter((inv) => inv.status === "paid");
    let monthTotalDays = 0;
    let monthPaidCount = 0;

    for (const deal of monthPaid) {
      if (deal.paidAt) {
        const issueDate =
          deal.issueDate || deal.createdAt || deal.dueDate;
        if (issueDate) {
          const daysToPay =
            (new Date(deal.paidAt).getTime() -
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
      monthDeals.length > 0
        ? Math.round((monthPaid.length / monthDeals.length) * 100)
        : 0;

    return {
      month: monthStr,
      averageDaysToPay: monthAvgDays,
      paymentRate: monthPaymentRate,
      dealCount: monthDeals.length,
    };
  });

  // Calculate overdue summary
  let oldestDays = 0;
  const now = new Date();
  for (const deal of overdueDeals) {
    if (deal.dueDate) {
      const daysOverdue =
        (now.getTime() - parseISO(deal.dueDate).getTime()) /
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
      totalDeals: allDeals.length,
      paidDeals: paidDeals.length,
      unpaidDeals: unpaidDeals.length,
      overdueDeals: overdueDeals.length,
      overdueAmount: Math.round(overdueAmount * 100) / 100,
    },
    paymentTrends,
    overdueSummary: {
      count: overdueDeals.length,
      totalAmount: Math.round(overdueAmount * 100) / 100,
      oldestDays,
    },
  };
}
