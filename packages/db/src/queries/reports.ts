import { UTCDate } from "@date-fns/utc";
import { CASH_ACCOUNT_TYPES } from "@midday/banking/account";
import {
  CONTRA_REVENUE_CATEGORIES,
  REVENUE_CATEGORIES,
} from "@midday/categories";
import {
  addMonths,
  eachMonthOfInterval,
  endOfMonth,
  format,
  parseISO,
  startOfMonth,
  subMonths,
  subYears,
} from "date-fns";
import {
  and,
  eq,
  gt,
  gte,
  inArray,
  isNotNull,
  isNull,
  lt,
  lte,
  ne,
  not,
  or,
  sql,
} from "drizzle-orm";
import { nanoid } from "nanoid";
import type { Database } from "../client";
import {
  InvalidReportTypeError,
  ReportExpiredError,
  ReportNotFoundError,
} from "../errors";
import {
  bankAccounts,
  inbox,
  invoices,
  reports,
  teams,
  transactionCategories,
  transactions,
} from "../schema";
import { getCashBalance } from "./bank-accounts";
import { getExchangeRatesBatch } from "./exhange-rates";
import { getRecurringInvoiceProjection } from "./invoice-recurring";
import { getBillableHours } from "./tracker-entries";

function getPercentageIncrease(a: number, b: number) {
  return a > 0 && b > 0 ? Math.abs(((a - b) / b) * 100).toFixed() : 0;
}

// Simple in-memory cache for team currencies (clears on server restart)
const teamCurrencyCache = new Map<
  string,
  { currency: string | null; timestamp: number }
>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function getTargetCurrency(
  db: Database,
  teamId: string,
  inputCurrency?: string,
): Promise<string | null> {
  if (inputCurrency) return inputCurrency;

  // Check cache
  const cached = teamCurrencyCache.get(teamId);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.currency;
  }

  // Fetch from database
  const team = await db
    .select({ baseCurrency: teams.baseCurrency })
    .from(teams)
    .where(eq(teams.id, teamId))
    .limit(1);

  const currency = team[0]?.baseCurrency || null;
  teamCurrencyCache.set(teamId, { currency, timestamp: Date.now() });

  return currency;
}

export type GetReportsParams = {
  teamId: string;
  from: string;
  to: string;
  currency?: string;
  type?: "revenue" | "profit";
  revenueType?: "gross" | "net";
  /** When true, use exact dates instead of expanding to month boundaries. Useful for weekly insights. */
  exactDates?: boolean;
};

interface ReportsResultItem {
  value: string;
  date: string;
  currency: string;
}

// Helper function for profit calculation
export async function getProfit(db: Database, params: GetReportsParams) {
  const {
    teamId,
    from,
    to,
    currency: inputCurrency,
    revenueType = "net",
    exactDates = false,
  } = params;

  // When exactDates is true, use the exact dates provided (for weekly insights)
  // Otherwise, expand to month boundaries (for monthly reports)
  const fromDate = exactDates
    ? new UTCDate(parseISO(from))
    : startOfMonth(new UTCDate(parseISO(from)));
  const toDate = exactDates
    ? new UTCDate(parseISO(to))
    : endOfMonth(new UTCDate(parseISO(to)));

  // Step 1: Get the target currency (cached)
  const targetCurrency = await getTargetCurrency(db, teamId, inputCurrency);

  // Step 2: Generate month series for complete results
  const monthSeries = eachMonthOfInterval({ start: fromDate, end: toDate });

  // Step 3: Get Net Revenue for each month (always use net revenue for profit calculation)
  const netRevenueData = await getRevenue(db, {
    teamId,
    exactDates,
    from,
    to,
    currency: inputCurrency,
    revenueType: "net", // Always use net revenue for profit calculations
  });

  // Step 4: Build the main query conditions for expenses
  // Note: When no inputCurrency is provided, we use baseAmount directly in WHERE clause.
  // This is intentional - transactions without baseAmount set are excluded as they haven't
  // been converted to the team's base currency yet. When inputCurrency is provided,
  // we handle NULL baseAmount gracefully by using the original amount field.
  const expenseConditions = [
    eq(transactions.teamId, teamId),
    eq(transactions.internal, false),
    ne(transactions.status, "excluded"),
    gte(transactions.date, format(fromDate, "yyyy-MM-dd")),
    lte(transactions.date, format(toDate, "yyyy-MM-dd")),
  ];

  // Amount condition: handle NULL baseAmount gracefully when inputCurrency is provided
  if (inputCurrency && targetCurrency) {
    // When inputCurrency is provided, use CASE to handle NULL baseAmount
    // If baseCurrency matches targetCurrency and baseAmount is not NULL, use baseAmount
    // Otherwise, use the original amount field
    expenseConditions.push(
      sql`(CASE 
        WHEN ${transactions.baseCurrency} = ${sql`${targetCurrency}`} AND ${transactions.baseAmount} IS NOT NULL THEN ${transactions.baseAmount}
        ELSE ${transactions.amount}
      END < 0)`,
    );
  } else {
    // When no inputCurrency, exclude transactions without baseAmount
    expenseConditions.push(lt(transactions.baseAmount, 0));
  }

  // Add currency conditions
  // When inputCurrency is provided, we want to show transactions in that currency
  // This includes transactions where either:
  // 1. The original currency matches, OR
  // 2. The baseCurrency matches (for converted transactions)
  if (inputCurrency && targetCurrency) {
    expenseConditions.push(
      or(
        eq(transactions.currency, targetCurrency),
        eq(transactions.baseCurrency, targetCurrency),
      )!,
    );
  } else if (targetCurrency) {
    expenseConditions.push(eq(transactions.baseCurrency, targetCurrency));
  }

  // Step 5: First, get the COGS parent category ID
  const cogsParentCategory = await db
    .select({ id: transactionCategories.id })
    .from(transactionCategories)
    .where(
      and(
        eq(transactionCategories.teamId, teamId),
        eq(transactionCategories.slug, "cost-of-goods-sold"),
        isNull(transactionCategories.parentId), // Parent category has no parent
      ),
    )
    .limit(1);

  const cogsParentId = cogsParentCategory[0]?.id;

  // Step 6: Get all COGS category slugs (child categories under "cost-of-goods-sold")
  let cogsCategorySlugs: string[] = [];
  if (cogsParentId) {
    const cogsCategories = await db
      .select({ slug: transactionCategories.slug })
      .from(transactionCategories)
      .where(
        and(
          eq(transactionCategories.teamId, teamId),
          eq(transactionCategories.parentId, cogsParentId),
          or(
            isNull(transactionCategories.excluded),
            eq(transactionCategories.excluded, false),
          )!,
        ),
      );

    cogsCategorySlugs = cogsCategories
      .map((cat) => cat.slug)
      .filter((slug): slug is string => slug !== null);
  }

  // Step 7: Get COGS expenses (categories under "cost-of-goods-sold" parent)
  const cogsConditions = [...expenseConditions];
  if (cogsCategorySlugs.length > 0) {
    cogsConditions.push(
      isNotNull(transactions.categorySlug),
      inArray(transactions.categorySlug, cogsCategorySlugs),
    );
  } else {
    // No COGS categories found, so no COGS expenses
    cogsConditions.push(sql`1 = 0`); // Always false
  }

  const cogsData = await db
    .select({
      month: sql<string>`DATE_TRUNC('month', ${transactions.date})::date`,
      value: sql<number>`COALESCE(SUM(ABS(${
        inputCurrency && targetCurrency
          ? sql`CASE
              WHEN ${transactions.baseCurrency} = ${sql`${targetCurrency}`} AND ${transactions.baseAmount} IS NOT NULL THEN ${transactions.baseAmount}
              ELSE ${transactions.amount}
            END`
          : sql`COALESCE(${transactions.baseAmount}, 0)`
      })), 0)`,
    })
    .from(transactions)
    .leftJoin(
      transactionCategories,
      and(
        eq(transactionCategories.slug, transactions.categorySlug),
        eq(transactionCategories.teamId, teamId),
      ),
    )
    .where(
      and(
        ...cogsConditions,
        or(
          isNull(transactionCategories.excluded),
          eq(transactionCategories.excluded, false),
        )!,
      ),
    )
    .groupBy(sql`DATE_TRUNC('month', ${transactions.date})`)
    .orderBy(sql`DATE_TRUNC('month', ${transactions.date}) ASC`);

  // Step 8: Get Operating Expenses (all expenses EXCEPT COGS)
  // This includes expenses from non-COGS categories and uncategorized expenses
  const operatingExpensesConditions = [...expenseConditions];
  if (cogsCategorySlugs.length > 0) {
    // Exclude COGS categories
    operatingExpensesConditions.push(
      or(
        isNull(transactions.categorySlug), // Uncategorized expenses are operating expenses
        not(inArray(transactions.categorySlug, cogsCategorySlugs)), // Not a COGS category
      )!,
    );
  }

  const operatingExpensesData = await db
    .select({
      month: sql<string>`DATE_TRUNC('month', ${transactions.date})::date`,
      value: sql<number>`COALESCE(SUM(ABS(${
        inputCurrency && targetCurrency
          ? sql`CASE
              WHEN ${transactions.baseCurrency} = ${sql`${targetCurrency}`} AND ${transactions.baseAmount} IS NOT NULL THEN ${transactions.baseAmount}
              ELSE ${transactions.amount}
            END`
          : sql`COALESCE(${transactions.baseAmount}, 0)`
      })), 0)`,
    })
    .from(transactions)
    .leftJoin(
      transactionCategories,
      and(
        eq(transactionCategories.slug, transactions.categorySlug),
        eq(transactionCategories.teamId, teamId),
      ),
    )
    .where(
      and(
        ...operatingExpensesConditions,
        or(
          isNull(transactionCategories.excluded),
          eq(transactionCategories.excluded, false),
        )!,
      ),
    )
    .groupBy(sql`DATE_TRUNC('month', ${transactions.date})`)
    .orderBy(sql`DATE_TRUNC('month', ${transactions.date}) ASC`);

  // Step 9: Create maps for quick lookup
  const netRevenueMap = new Map(
    netRevenueData.map((item) => [item.date, Number.parseFloat(item.value)]),
  );
  const cogsMap = new Map(cogsData.map((item) => [item.month, item.value]));
  const operatingExpensesMap = new Map(
    operatingExpensesData.map((item) => [item.month, item.value]),
  );

  // Step 10: Calculate profit for each month
  const currencyStr = targetCurrency || "USD";
  const results: ReportsResultItem[] = monthSeries.map((monthStart) => {
    const monthKey = format(monthStart, "yyyy-MM-dd");
    const netRevenue = netRevenueMap.get(monthKey) || 0;
    const cogs = cogsMap.get(monthKey) || 0;
    const operatingExpenses = operatingExpensesMap.get(monthKey) || 0;

    // Calculate profit based on revenueType
    let profit: number;
    if (revenueType === "gross") {
      // Gross Profit = Net Revenue - COGS
      profit = netRevenue - cogs;
    } else {
      // Net Profit = Net Revenue - COGS - Operating Expenses
      // OR: Net Profit = Gross Profit - Operating Expenses
      profit = netRevenue - cogs - operatingExpenses;
    }

    return {
      date: monthKey,
      value: profit.toString(),
      currency: currencyStr,
    };
  });

  return results;
}

// Helper function for revenue calculation
export async function getRevenue(db: Database, params: GetReportsParams) {
  const {
    teamId,
    from,
    to,
    currency: inputCurrency,
    revenueType = "gross",
    exactDates = false,
  } = params;

  // When exactDates is true, use the exact dates provided (for weekly insights)
  // Otherwise, expand to month boundaries (for monthly reports)
  const fromDate = exactDates
    ? new UTCDate(parseISO(from))
    : startOfMonth(new UTCDate(parseISO(from)));
  const toDate = exactDates
    ? new UTCDate(parseISO(to))
    : endOfMonth(new UTCDate(parseISO(to)));

  // Step 1: Get the target currency (cached)
  const targetCurrency = await getTargetCurrency(db, teamId, inputCurrency);

  // Step 2: Generate month series for complete results
  const monthSeries = eachMonthOfInterval({ start: fromDate, end: toDate });

  // Step 3: Build the main query conditions
  // Note: When no inputCurrency is provided, we use baseAmount directly in WHERE clause.
  // This is intentional - transactions without baseAmount set are excluded as they haven't
  // been converted to the team's base currency yet. When inputCurrency is provided,
  // we handle NULL baseAmount gracefully by using the original amount field.
  const conditions = [
    eq(transactions.teamId, teamId),
    eq(transactions.internal, false),
    inArray(transactions.categorySlug, REVENUE_CATEGORIES), // Include all revenue categories (includes "revenue" parent)
    ne(transactions.status, "excluded"),
    gte(transactions.date, format(fromDate, "yyyy-MM-dd")),
    lte(transactions.date, format(toDate, "yyyy-MM-dd")),
  ];

  // Amount condition: handle NULL baseAmount gracefully when inputCurrency is provided
  if (inputCurrency && targetCurrency) {
    // When inputCurrency is provided, use CASE to handle NULL baseAmount
    // If baseCurrency matches targetCurrency and baseAmount is not NULL, use baseAmount
    // Otherwise, use the original amount field
    conditions.push(
      sql`(CASE 
        WHEN ${transactions.baseCurrency} = ${sql`${targetCurrency}`} AND ${transactions.baseAmount} IS NOT NULL THEN ${transactions.baseAmount}
        ELSE ${transactions.amount}
      END > 0)`,
    );
  } else {
    // When no inputCurrency, exclude transactions without baseAmount
    conditions.push(gt(transactions.baseAmount, 0));
  }

  // Explicitly exclude contra-revenue categories
  conditions.push(
    not(inArray(transactions.categorySlug, CONTRA_REVENUE_CATEGORIES)),
  );

  // Add currency conditions
  // When inputCurrency is provided, we want to show transactions in that currency
  // This includes transactions where either:
  // 1. The original currency matches, OR
  // 2. The baseCurrency matches (for converted transactions)
  if (inputCurrency && targetCurrency) {
    // Filter by either currency OR baseCurrency matching the target
    // This ensures we include USD transactions that have been converted to GBP
    conditions.push(
      or(
        eq(transactions.currency, targetCurrency),
        eq(transactions.baseCurrency, targetCurrency),
      )!,
    );
  } else if (targetCurrency) {
    conditions.push(eq(transactions.baseCurrency, targetCurrency));
  }

  // Step 3: Execute the aggregated query with gross/net calculation
  // Note: We use LEFT JOIN to get taxRate from categories, but we don't filter by excluded
  // since revenue categories should always be included
  const tc = transactionCategories;

  // When inputCurrency is provided, we filter to include transactions where either
  // currency OR baseCurrency matches. For calculation:
  // - If baseCurrency matches targetCurrency, use baseAmount (converted amount)
  // - Otherwise, use amount (original currency amount)
  // When inputCurrency is not provided, always use baseAmount
  const monthlyData = await db
    .select({
      month: sql<string>`DATE_TRUNC('month', ${transactions.date})::date`,
      value:
        revenueType === "net"
          ? inputCurrency && targetCurrency
            ? sql<number>`COALESCE(SUM(
                -- Use baseAmount when baseCurrency matches target AND baseAmount is not NULL, otherwise use amount
                -- ROUND to 2 decimal places for financial precision
                CASE 
                  WHEN ${transactions.baseCurrency} = ${sql`${targetCurrency}`} AND ${transactions.baseAmount} IS NOT NULL THEN
                    ROUND(${transactions.baseAmount} - (
                      ${transactions.baseAmount} * COALESCE(${transactions.taxRate}, ${tc.taxRate}, 0) / 
                      (100 + COALESCE(${transactions.taxRate}, ${tc.taxRate}, 0))
                    ), 2)
                  ELSE
                    ROUND(${transactions.amount} - (
                      ${transactions.amount} * COALESCE(${transactions.taxRate}, ${tc.taxRate}, 0) / 
                      (100 + COALESCE(${transactions.taxRate}, ${tc.taxRate}, 0))
                    ), 2)
                END
              ), 0)`
            : sql<number>`COALESCE(SUM(
                -- ROUND to 2 decimal places for financial precision
                ROUND(COALESCE(${transactions.baseAmount}, 0) - (
                  COALESCE(${transactions.baseAmount}, 0) * COALESCE(${transactions.taxRate}, ${tc.taxRate}, 0) / 
                  (100 + COALESCE(${transactions.taxRate}, ${tc.taxRate}, 0))
                ), 2)
              ), 0)`
          : inputCurrency && targetCurrency
            ? sql<number>`COALESCE(SUM(
                -- Use baseAmount when baseCurrency matches target AND baseAmount is not NULL, otherwise use amount
                CASE 
                  WHEN ${transactions.baseCurrency} = ${sql`${targetCurrency}`} AND ${transactions.baseAmount} IS NOT NULL THEN ${transactions.baseAmount}
                  ELSE ${transactions.amount}
                END
              ), 0)`
            : sql<number>`COALESCE(SUM(COALESCE(${transactions.baseAmount}, 0)), 0)`,
    })
    .from(transactions)
    .leftJoin(
      tc,
      and(eq(tc.slug, transactions.categorySlug), eq(tc.teamId, teamId)),
    )
    .where(
      and(
        ...conditions,
        // Category exclusion check: allow if category doesn't exist (NULL) or is not excluded
        or(isNull(tc.excluded), eq(tc.excluded, false))!,
      ),
    )
    .groupBy(sql`DATE_TRUNC('month', ${transactions.date})`)
    .orderBy(sql`DATE_TRUNC('month', ${transactions.date}) ASC`);

  // Step 4: Create a map of month data for quick lookup
  const dataMap = new Map(monthlyData.map((item) => [item.month, item.value]));

  // Step 5: Generate complete results (optimized)
  const currencyStr = targetCurrency || "USD";
  const results: ReportsResultItem[] = monthSeries.map((monthStart) => {
    const monthKey = format(monthStart, "yyyy-MM-dd");
    const value = dataMap.get(monthKey) || 0;

    return {
      date: monthKey,
      value: value.toString(),
      currency: currencyStr,
    };
  });

  return results;
}

export async function getReports(db: Database, params: GetReportsParams) {
  const {
    teamId,
    from,
    to,
    type = "profit",
    currency: inputCurrency,
    revenueType,
  } = params;

  // Calculate previous year date range
  const prevFromDate = subYears(startOfMonth(new UTCDate(parseISO(from))), 1);
  const prevToDate = subYears(endOfMonth(new UTCDate(parseISO(to))), 1);

  // Use our Drizzle implementations instead of PostgreSQL functions
  const reportFunction = type === "profit" ? getProfit : getRevenue;

  // Run both queries in parallel since they're independent
  const [rawPrev, rawCurr] = await Promise.all([
    reportFunction(db, {
      teamId,
      from: prevFromDate.toISOString(),
      to: prevToDate.toISOString(),
      currency: inputCurrency,
      revenueType,
    }),
    reportFunction(db, {
      teamId,
      from,
      to,
      currency: inputCurrency,
      revenueType,
    }),
  ]);

  const prevData = rawPrev.map((item) => ({
    ...item,
    value: Number.parseFloat(item.value),
  }));

  const currentData = rawCurr.map((item) => ({
    ...item,
    value: Number.parseFloat(item.value),
  }));

  const prevTotal = Number(
    (prevData?.reduce((value, item) => item.value + value, 0) ?? 0).toFixed(2),
  );

  const currentTotal = Number(
    (currentData?.reduce((value, item) => item.value + value, 0) ?? 0).toFixed(
      2,
    ),
  );

  const baseCurrency = currentData?.at(0)?.currency ?? inputCurrency;

  return {
    summary: {
      currentTotal,
      prevTotal,
      currency: baseCurrency,
    },
    meta: {
      type,
      currency: baseCurrency,
    },
    result: currentData?.map((record, index) => {
      const prev = prevData?.at(index);
      const prevValue = prev?.value ?? 0;
      const recordValue = record.value;

      return {
        date: record.date,
        percentage: {
          value: Number(
            getPercentageIncrease(Math.abs(prevValue), Math.abs(recordValue)) ||
              0,
          ),
          status: recordValue > prevValue ? "positive" : "negative",
        },
        current: {
          date: record.date,
          value: recordValue,
          currency: record.currency,
        },
        previous: {
          date: prev?.date,
          value: prevValue,
          currency: prev?.currency ?? baseCurrency,
        },
      };
    }),
  };
}

export type GetBurnRateParams = {
  teamId: string;
  from: string;
  to: string;
  currency?: string;
};

interface BurnRateResultItem {
  value: string;
  date: string;
  currency: string;
}

export async function getBurnRate(db: Database, params: GetBurnRateParams) {
  const { teamId, from, to, currency: inputCurrency } = params;

  const fromDate = startOfMonth(new UTCDate(parseISO(from)));
  const toDate = endOfMonth(new UTCDate(parseISO(to)));

  // Step 1: Get the target currency (cached)
  const targetCurrency = await getTargetCurrency(db, teamId, inputCurrency);

  // Step 2: Generate month series for complete results
  const monthSeries = eachMonthOfInterval({ start: fromDate, end: toDate });

  // Step 3: Build the main query conditions
  const conditions = [
    eq(transactions.teamId, teamId),
    eq(transactions.internal, false),
    ne(transactions.status, "excluded"),
    gte(transactions.date, format(fromDate, "yyyy-MM-dd")),
    lte(transactions.date, format(toDate, "yyyy-MM-dd")),
    lt(
      inputCurrency
        ? sql`CASE 
        WHEN ${transactions.currency} = ${targetCurrency} THEN ${transactions.amount}
        ELSE COALESCE(${transactions.baseAmount}, 0)
      END`
        : sql`COALESCE(${transactions.baseAmount}, 0)`,
      0,
    ),
  ];

  // Add currency conditions
  if (inputCurrency && targetCurrency) {
    conditions.push(
      or(
        eq(transactions.currency, targetCurrency),
        eq(transactions.baseCurrency, targetCurrency),
      )!,
    );
  } else if (targetCurrency) {
    conditions.push(eq(transactions.baseCurrency, targetCurrency));
  }

  // Step 4: Execute the aggregated query
  const monthlyData = await db
    .select({
      month: sql<string>`DATE_TRUNC('month', ${transactions.date})::date`,
      totalAmount: inputCurrency
        ? sql<number>`COALESCE(ABS(SUM(
            CASE
              WHEN ${transactions.currency} = ${targetCurrency} THEN ${transactions.amount}
              ELSE COALESCE(${transactions.baseAmount}, 0)
            END
          )), 0)`
        : sql<number>`COALESCE(ABS(SUM(COALESCE(${transactions.baseAmount}, 0))), 0)`,
    })
    .from(transactions)
    .leftJoin(
      transactionCategories,
      and(
        eq(transactionCategories.slug, transactions.categorySlug),
        eq(transactionCategories.teamId, teamId),
      ),
    )
    .where(
      and(
        ...conditions,
        or(
          isNull(transactions.categorySlug),
          isNull(transactionCategories.excluded),
          eq(transactionCategories.excluded, false),
        )!,
      ),
    )
    .groupBy(sql`DATE_TRUNC('month', ${transactions.date})`)
    .orderBy(sql`DATE_TRUNC('month', ${transactions.date}) ASC`);

  // Step 5: Create a map of month data for quick lookup
  const dataMap = new Map(
    monthlyData.map((item) => [item.month, item.totalAmount]),
  );

  // Step 6: Generate complete results for all months in the series
  const results: BurnRateResultItem[] = monthSeries.map((monthStart) => {
    const monthKey = format(monthStart, "yyyy-MM-dd");
    const value = dataMap.get(monthKey) || 0;

    return {
      date: monthKey,
      value: value.toString(),
      currency: targetCurrency || "USD",
    };
  });

  return results.map((item) => ({
    ...item,
    value: Number.parseFloat(item.value),
  }));
}

export type GetExpensesParams = {
  teamId: string;
  from: string;
  to: string;
  currency?: string;
  /** When true, use exact dates instead of expanding to month boundaries. Useful for weekly insights. */
  exactDates?: boolean;
};

interface ExpensesResultItem {
  value: string;
  date: string;
  currency: string;
  recurring_value?: number;
}

export async function getExpenses(db: Database, params: GetExpensesParams) {
  const {
    teamId,
    from,
    to,
    currency: inputCurrency,
    exactDates = false,
  } = params;

  // When exactDates is true, use the exact dates provided (for weekly insights)
  // Otherwise, expand to month boundaries (for monthly reports)
  const fromDate = exactDates
    ? new UTCDate(parseISO(from))
    : startOfMonth(new UTCDate(parseISO(from)));
  const toDate = exactDates
    ? new UTCDate(parseISO(to))
    : endOfMonth(new UTCDate(parseISO(to)));

  // Step 1: Get the target currency (cached)
  const targetCurrency = await getTargetCurrency(db, teamId, inputCurrency);

  // Step 2: Generate month series for complete results
  const monthSeries = eachMonthOfInterval({ start: fromDate, end: toDate });

  // Step 3: Build the main query conditions
  const conditions = [
    eq(transactions.teamId, teamId),
    ne(transactions.status, "excluded"),
    eq(transactions.internal, false),
    gte(transactions.date, format(fromDate, "yyyy-MM-dd")),
    lte(transactions.date, format(toDate, "yyyy-MM-dd")),
  ];

  // Add currency and amount conditions
  // When inputCurrency is provided, we want to show transactions in that currency
  // This includes transactions where either:
  // 1. The original currency matches, OR
  // 2. The baseCurrency matches (for converted transactions)
  if (inputCurrency && targetCurrency) {
    conditions.push(
      or(
        eq(transactions.currency, targetCurrency),
        eq(transactions.baseCurrency, targetCurrency),
      )!,
    );
    // Amount condition: use baseAmount when baseCurrency matches AND baseAmount is not NULL, otherwise use amount
    // This ensures we don't exclude transactions where baseAmount is NULL
    conditions.push(
      sql`(CASE 
        WHEN ${transactions.baseCurrency} = ${sql`${targetCurrency}`} AND ${transactions.baseAmount} IS NOT NULL THEN ${transactions.baseAmount}
        ELSE ${transactions.amount}
      END < 0)`,
    );
  } else if (targetCurrency) {
    // When no inputCurrency, exclude transactions without baseAmount
    // This ensures we only show transactions that have been converted to the team's base currency
    conditions.push(eq(transactions.baseCurrency, targetCurrency));
    conditions.push(lt(transactions.baseAmount, 0));
  }

  // Step 4: Execute the aggregated query
  const monthlyData = await db
    .select({
      month: sql<string>`DATE_TRUNC('month', ${transactions.date})::date`,
      value:
        inputCurrency && targetCurrency
          ? sql<number>`COALESCE(SUM(
            CASE
              WHEN (${transactions.recurring} = false OR ${transactions.recurring} IS NULL) THEN ABS(
                CASE
                  WHEN ${transactions.baseCurrency} = ${sql`${targetCurrency}`} AND ${transactions.baseAmount} IS NOT NULL THEN ${transactions.baseAmount}
                  ELSE ${transactions.amount}
                END
              )
              ELSE 0
            END
          ), 0)`
          : sql<number>`COALESCE(SUM(
            CASE
              WHEN (${transactions.recurring} = false OR ${transactions.recurring} IS NULL) THEN ABS(COALESCE(${transactions.baseAmount}, 0))
              ELSE 0
            END
          ), 0)`,
      recurringValue:
        inputCurrency && targetCurrency
          ? sql<number>`COALESCE(SUM(
            CASE
              WHEN ${transactions.recurring} = true THEN ABS(
                CASE
                  WHEN ${transactions.baseCurrency} = ${sql`${targetCurrency}`} AND ${transactions.baseAmount} IS NOT NULL THEN ${transactions.baseAmount}
                  ELSE ${transactions.amount}
                END
              )
              ELSE 0
            END
          ), 0)`
          : sql<number>`COALESCE(SUM(
            CASE
              WHEN ${transactions.recurring} = true THEN ABS(COALESCE(${transactions.baseAmount}, 0))
              ELSE 0
            END
          ), 0)`,
    })
    .from(transactions)
    .leftJoin(
      transactionCategories,
      and(
        eq(transactionCategories.slug, transactions.categorySlug),
        eq(transactionCategories.teamId, teamId),
      ),
    )
    .where(
      and(
        ...conditions,
        or(
          isNull(transactions.categorySlug),
          isNull(transactionCategories.excluded),
          eq(transactionCategories.excluded, false),
        )!,
      ),
    )
    .groupBy(sql`DATE_TRUNC('month', ${transactions.date})`)
    .orderBy(sql`DATE_TRUNC('month', ${transactions.date}) ASC`);

  // Step 5: Create a map of month data for quick lookup
  const dataMap = new Map(
    monthlyData.map((item) => [
      item.month,
      { value: item.value, recurringValue: item.recurringValue },
    ]),
  );

  // Step 6: Generate complete results for all months in the series
  const rawData: ExpensesResultItem[] = monthSeries.map((monthStart) => {
    const monthKey = format(monthStart, "yyyy-MM-dd");
    const monthData = dataMap.get(monthKey) || {
      value: 0,
      recurringValue: 0,
    };

    return {
      date: monthKey,
      value: monthData.value.toString(),
      currency: targetCurrency || "USD",
      recurring_value: monthData.recurringValue,
    };
  });

  const averageExpense =
    rawData && rawData.length > 0
      ? Number(
          (
            rawData.reduce(
              (sum, item) => sum + Number.parseFloat(item.value || "0"),
              0,
            ) / rawData.length
          ).toFixed(2),
        )
      : 0;

  return {
    summary: {
      averageExpense,
      currency: rawData?.at(0)?.currency ?? inputCurrency,
    },
    meta: {
      type: "expense",
      currency: rawData?.at(0)?.currency ?? inputCurrency,
    },
    result: rawData?.map((item) => {
      const value = Number.parseFloat(
        Number.parseFloat(item.value || "0").toFixed(2),
      );
      const recurring = Number.parseFloat(
        Number.parseFloat(
          item.recurring_value !== undefined
            ? String(item.recurring_value)
            : "0",
        ).toFixed(2),
      );
      return {
        date: item.date,
        value,
        currency: item.currency,
        recurring,
        total: Number((value + recurring).toFixed(2)),
      };
    }),
  };
}

export type GetSpendingParams = {
  teamId: string;
  from: string;
  to: string;
  currency?: string;
};

interface SpendingResultItem {
  name: string;
  slug: string;
  amount: number;
  currency: string;
  color: string;
  percentage: number;
}

export async function getSpending(
  db: Database,
  params: GetSpendingParams,
): Promise<SpendingResultItem[]> {
  const { teamId, from, to, currency: inputCurrency } = params;

  const fromDate = startOfMonth(new UTCDate(parseISO(from)));
  const toDate = endOfMonth(new UTCDate(parseISO(to)));

  // Step 1: Get the target currency (cached)
  const targetCurrency = await getTargetCurrency(db, teamId, inputCurrency);

  // Step 2: Calculate total spending amount for percentage calculations
  const totalAmountConditions = [
    eq(transactions.teamId, teamId),
    eq(transactions.internal, false),
    ne(transactions.status, "excluded"),
    gte(transactions.date, format(fromDate, "yyyy-MM-dd")),
    lte(transactions.date, format(toDate, "yyyy-MM-dd")),
  ];

  // Amount condition: handle NULL baseAmount gracefully
  if (inputCurrency && targetCurrency) {
    totalAmountConditions.push(
      sql`(CASE 
        WHEN ${transactions.baseCurrency} = ${sql`${targetCurrency}`} AND ${transactions.baseAmount} IS NOT NULL THEN ${transactions.baseAmount}
        ELSE ${transactions.amount}
      END < 0)`,
    );
  } else if (targetCurrency) {
    // When no inputCurrency, exclude transactions without baseAmount
    totalAmountConditions.push(eq(transactions.baseCurrency, targetCurrency));
    totalAmountConditions.push(lt(transactions.baseAmount, 0));
  }

  const totalAmountResult = await db
    .select({
      total: sql<number>`SUM(${
        inputCurrency && targetCurrency
          ? sql`CASE
              WHEN ${transactions.baseCurrency} = ${sql`${targetCurrency}`} AND ${transactions.baseAmount} IS NOT NULL THEN ${transactions.baseAmount}
              ELSE ${transactions.amount}
            END`
          : sql`COALESCE(${transactions.baseAmount}, 0)`
      })`,
    })
    .from(transactions)
    .leftJoin(
      transactionCategories,
      and(
        eq(transactionCategories.slug, transactions.categorySlug),
        eq(transactionCategories.teamId, teamId),
      ),
    )
    .where(
      and(
        ...totalAmountConditions,
        or(
          isNull(transactions.categorySlug),
          isNull(transactionCategories.excluded),
          eq(transactionCategories.excluded, false),
        )!,
      ),
    );

  const totalAmount = Math.abs(totalAmountResult[0]?.total || 0);

  // Step 3: Get all spending data in a single aggregated query (MAJOR PERF WIN)
  const spendingConditions = [
    eq(transactions.teamId, teamId),
    eq(transactions.internal, false),
    ne(transactions.status, "excluded"),
    gte(transactions.date, format(fromDate, "yyyy-MM-dd")),
    lte(transactions.date, format(toDate, "yyyy-MM-dd")),
    isNotNull(transactions.categorySlug), // Only categorized transactions
  ];

  // Amount condition: handle NULL baseAmount gracefully
  if (inputCurrency && targetCurrency) {
    spendingConditions.push(
      sql`(CASE 
        WHEN ${transactions.baseCurrency} = ${sql`${targetCurrency}`} AND ${transactions.baseAmount} IS NOT NULL THEN ${transactions.baseAmount}
        ELSE ${transactions.amount}
      END < 0)`,
    );
  } else if (targetCurrency) {
    // When no inputCurrency, exclude transactions without baseAmount
    spendingConditions.push(eq(transactions.baseCurrency, targetCurrency));
    spendingConditions.push(lt(transactions.baseAmount, 0));
  }

  // Single query replaces N queries (where N = number of categories)
  const categorySpending = await db
    .select({
      name: transactionCategories.name,
      slug: transactionCategories.slug,
      color: transactionCategories.color,
      amount: sql<number>`ABS(SUM(${
        inputCurrency && targetCurrency
          ? sql`CASE
              WHEN ${transactions.baseCurrency} = ${sql`${targetCurrency}`} AND ${transactions.baseAmount} IS NOT NULL THEN ${transactions.baseAmount}
              ELSE ${transactions.amount}
            END`
          : sql`COALESCE(${transactions.baseAmount}, 0)`
      }))`,
    })
    .from(transactions)
    .innerJoin(
      transactionCategories,
      and(
        eq(transactionCategories.slug, transactions.categorySlug),
        eq(transactionCategories.teamId, teamId),
      ),
    )
    .where(
      and(
        ...spendingConditions,
        or(
          isNull(transactionCategories.excluded),
          eq(transactionCategories.excluded, false),
        )!,
      ),
    )
    .groupBy(
      transactionCategories.name,
      transactionCategories.slug,
      transactionCategories.color,
    )
    .having(
      sql`SUM(${
        inputCurrency && targetCurrency
          ? sql`CASE
              WHEN ${transactions.baseCurrency} = ${sql`${targetCurrency}`} AND ${transactions.baseAmount} IS NOT NULL THEN ${transactions.baseAmount}
              ELSE ${transactions.amount}
            END`
          : sql`COALESCE(${transactions.baseAmount}, 0)`
      }) < 0`,
    )
    .then((results) =>
      results.map((item) => {
        const percentage =
          totalAmount !== 0 ? (item.amount / totalAmount) * 100 : 0;
        return {
          name: item.name,
          slug: item.slug || "unknown",
          amount: item.amount,
          currency: targetCurrency || "USD",
          color: item.color || "#606060",
          percentage:
            percentage > 1
              ? Math.round(percentage)
              : Math.round(percentage * 100) / 100,
        };
      }),
    );

  // Step 5: Handle uncategorized transactions
  const uncategorizedConditions = [
    eq(transactions.teamId, teamId),
    eq(transactions.internal, false),
    ne(transactions.status, "excluded"),
    gte(transactions.date, format(fromDate, "yyyy-MM-dd")),
    lte(transactions.date, format(toDate, "yyyy-MM-dd")),
  ];

  // Amount condition: handle NULL baseAmount gracefully
  if (inputCurrency && targetCurrency) {
    uncategorizedConditions.push(
      sql`(CASE 
        WHEN ${transactions.baseCurrency} = ${sql`${targetCurrency}`} AND ${transactions.baseAmount} IS NOT NULL THEN ${transactions.baseAmount}
        ELSE ${transactions.amount}
      END < 0)`,
    );
  } else if (targetCurrency) {
    // When no inputCurrency, exclude transactions without baseAmount
    uncategorizedConditions.push(eq(transactions.baseCurrency, targetCurrency));
    uncategorizedConditions.push(lt(transactions.baseAmount, 0));
  }

  uncategorizedConditions.push(
    or(
      isNull(transactions.categorySlug),
      sql`NOT EXISTS (
        SELECT 1 FROM ${transactionCategories} tc 
        WHERE tc.slug = ${transactions.categorySlug} 
        AND tc.team_id = ${teamId}
      )`,
    )!,
  );

  const uncategorizedResult = await db
    .select({
      amount: sql<number>`SUM(${
        inputCurrency && targetCurrency
          ? sql`CASE
              WHEN ${transactions.baseCurrency} = ${sql`${targetCurrency}`} AND ${transactions.baseAmount} IS NOT NULL THEN ${transactions.baseAmount}
              ELSE ${transactions.amount}
            END`
          : sql`COALESCE(${transactions.baseAmount}, 0)`
      })`,
    })
    .from(transactions)
    .where(and(...uncategorizedConditions));

  const uncategorizedAmount = Math.abs(uncategorizedResult[0]?.amount || 0);

  if (uncategorizedAmount > 0) {
    const percentage =
      totalAmount !== 0 ? (uncategorizedAmount / totalAmount) * 100 : 0;

    categorySpending.push({
      name: "Uncategorized",
      slug: "uncategorized",
      amount: uncategorizedAmount,
      currency: targetCurrency || "USD",
      color: "#606060",
      percentage:
        percentage > 1
          ? Math.round(percentage)
          : Math.round(percentage * 100) / 100,
    });
  }

  // Step 6: Sort by amount descending (highest first) and return
  return categorySpending
    .sort((a, b) => b.amount - a.amount)
    .map((item) => ({
      ...item,
      amount: Number.parseFloat(Number(item.amount).toFixed(2)),
      percentage: Number.parseFloat(Number(item.percentage).toFixed(2)),
    }));
}

export type GetRunwayParams = {
  teamId: string;
  currency?: string;
};

/**
 * Calculate cash runway using a fixed trailing 6-month window for burn rate.
 *
 * Runway is a forward-looking metric (how many months can we survive?) and
 * should not fluctuate based on an arbitrary user-selected date range.
 * The burn rate is always averaged over the last 6 months to smooth out
 * seasonal variance while remaining recent enough to reflect current
 * spending patterns.
 */
export async function getRunway(db: Database, params: GetRunwayParams) {
  const { teamId, currency: inputCurrency } = params;

  // Fixed 6-month trailing window for burn rate calculation
  // subMonths(toDate, 5) + startOfMonth gives 6 months inclusive of current month
  const toDate = endOfMonth(new UTCDate());
  const fromDate = startOfMonth(subMonths(toDate, 5));

  const burnRateFrom = format(fromDate, "yyyy-MM-dd");
  const burnRateTo = format(toDate, "yyyy-MM-dd");

  // Step 1: Get the target currency (cached)
  const targetCurrency = await getTargetCurrency(db, teamId, inputCurrency);

  if (!targetCurrency) {
    return 0;
  }

  // Step 2: Get total cash balance (depository + other_asset only)
  // Credit/loan balances are excluded - credit payments are already in burn rate as expenses
  const balanceConditions = [
    eq(bankAccounts.teamId, teamId),
    eq(bankAccounts.enabled, true),
    inArray(bankAccounts.type, [...CASH_ACCOUNT_TYPES]),
  ];

  const balanceResult = await db
    .select({
      totalBalance: sql<number>`SUM(CASE
        WHEN ${bankAccounts.currency} = ${targetCurrency} THEN COALESCE(${bankAccounts.balance}, 0)
        ELSE COALESCE(${bankAccounts.baseBalance}, 0)
      END)`,
    })
    .from(bankAccounts)
    .where(and(...balanceConditions));

  const totalBalance = balanceResult[0]?.totalBalance || 0;

  // Step 3: Get burn rate data over the fixed 6-month window
  const burnRateData = await getBurnRate(db, {
    teamId,
    from: burnRateFrom,
    to: burnRateTo,
    currency: inputCurrency,
  });

  // Step 4: Calculate average burn rate
  if (burnRateData.length === 0) {
    return 0;
  }

  const totalBurnRate = burnRateData.reduce((sum, item) => sum + item.value, 0);
  const avgBurnRate = Math.round(totalBurnRate / burnRateData.length);

  // Step 5: Calculate runway
  if (avgBurnRate === 0) {
    return 0;
  }

  return Math.round(totalBalance / avgBurnRate);
}

export type GetSpendingForPeriodParams = {
  teamId: string;
  from: string;
  to: string;
  currency?: string;
  /** When true, use exact dates instead of expanding to month boundaries. Useful for weekly insights. */
  exactDates?: boolean;
};

export async function getSpendingForPeriod(
  db: Database,
  params: GetSpendingForPeriodParams,
) {
  const {
    teamId,
    from,
    to,
    currency: inputCurrency,
    exactDates = false,
  } = params;

  // Use existing getExpenses function for the specified period
  const expensesData = await getExpenses(db, {
    teamId,
    from,
    to,
    currency: inputCurrency,
    exactDates,
  });

  // Calculate total spending across all months in the period
  const totalSpending = expensesData.result.reduce(
    (sum, item) => sum + item.total,
    0,
  );

  const currency = expensesData.meta.currency || inputCurrency || "USD";

  // Get top spending category for the specified period using existing getSpending function
  const spendingCategories = await getSpending(db, {
    teamId,
    from,
    to,
    currency: inputCurrency,
  });

  const topCategory = spendingCategories[0] || null;

  return {
    totalSpending: Math.round(totalSpending * 100) / 100,
    currency,
    topCategory: topCategory
      ? {
          name: topCategory.name,
          amount:
            Math.round(((totalSpending * topCategory.percentage) / 100) * 100) /
            100,
          percentage: topCategory.percentage,
        }
      : null,
  };
}

export type GetTaxParams = {
  teamId: string;
  type: "paid" | "collected";
  from: string;
  to: string;
  categorySlug?: string;
  taxType?: string;
  currency?: string;
};

export async function getTaxSummary(db: Database, params: GetTaxParams) {
  const {
    teamId,
    type,
    from,
    to,
    categorySlug,
    taxType,
    currency: inputCurrency,
  } = params;

  const fromDate = startOfMonth(new UTCDate(parseISO(from))).toISOString();
  const toDate = endOfMonth(new UTCDate(parseISO(to))).toISOString();

  // Build the base query with conditions
  const conditions = [
    sql`t.team_id = ${teamId}`,
    sql`t.internal = false`,
    sql`t.status != 'excluded'`,
    sql`t.date >= ${fromDate}`,
    sql`t.date <= ${toDate}`,
  ];

  // Add amount condition based on type (paid < 0, collected > 0)
  // Use base_amount when base_currency matches inputCurrency AND base_amount is not NULL
  // Otherwise fall back to amount (handles NULL baseAmount gracefully)
  if (inputCurrency) {
    if (type === "paid") {
      conditions.push(
        sql`(CASE 
          WHEN t.base_currency = ${inputCurrency} AND t.base_amount IS NOT NULL THEN t.base_amount
          ELSE t.amount
        END < 0)`,
      );
    } else {
      conditions.push(
        sql`(CASE 
          WHEN t.base_currency = ${inputCurrency} AND t.base_amount IS NOT NULL THEN t.base_amount
          ELSE t.amount
        END > 0)`,
      );
    }
  } else {
    if (type === "paid") {
      conditions.push(sql`t.amount < 0`);
    } else {
      conditions.push(sql`t.amount > 0`);
    }
  }

  // Add optional filters
  if (categorySlug) {
    conditions.push(sql`tc.slug = ${categorySlug}`);
  }

  if (taxType) {
    conditions.push(sql`(COALESCE(t.vat_type, tc.vat_type) = ${taxType})`);
  }

  if (inputCurrency) {
    // Include transactions where either currency OR baseCurrency matches
    conditions.push(
      sql`(t.currency = ${inputCurrency} OR t.base_currency = ${inputCurrency})`,
    );
  }

  // Add condition to only include transactions with tax rates or tax amounts
  conditions.push(
    sql`(t.tax_rate IS NOT NULL OR t.tax_amount IS NOT NULL OR tc.tax_rate IS NOT NULL)`,
  );

  // Exclude transactions in excluded categories
  conditions.push(sql`(tc.excluded IS NULL OR tc.excluded = false)`);

  const whereClause = sql.join(conditions, sql` AND `);

  // Build amount expression: use base_amount when base_currency matches inputCurrency AND base_amount is not NULL
  // Otherwise fall back to amount (handles NULL baseAmount gracefully)
  const amountExpr = inputCurrency
    ? sql`CASE 
        WHEN t.base_currency = ${inputCurrency} AND t.base_amount IS NOT NULL THEN t.base_amount
        ELSE t.amount
      END`
    : sql`t.amount`;

  const query = sql`
    SELECT 
      COALESCE(tc.slug, 'uncategorized') as category_slug,
      COALESCE(tc.name, 'Uncategorized') as category_name,
      ROUND(ABS(SUM(${amountExpr} * COALESCE(t.tax_rate, tc.tax_rate, 0) / (100 + COALESCE(t.tax_rate, tc.tax_rate, 0)))), 2)::text as total_tax_amount,
      ROUND(ABS(SUM(${amountExpr})), 2)::text as total_transaction_amount,
      COUNT(t.id) as transaction_count,
      ROUND(AVG(COALESCE(t.tax_rate, tc.tax_rate)), 2)::text as avg_tax_rate,
      COALESCE(t.tax_type, tc.tax_type) as tax_type,
      t.currency,
      MIN(t.date) as earliest_date,
      MAX(t.date) as latest_date
    FROM transactions t
    LEFT JOIN transaction_categories tc ON t.category_slug = tc.slug AND t.team_id = tc.team_id
    WHERE ${whereClause}
    GROUP BY 
      COALESCE(tc.slug, 'uncategorized'),
      COALESCE(tc.name, 'Uncategorized'),
      COALESCE(t.tax_type, tc.tax_type),
      t.currency
    ORDER BY ROUND(ABS(SUM(${amountExpr} * COALESCE(t.tax_rate, tc.tax_rate, 0) / (100 + COALESCE(t.tax_rate, tc.tax_rate, 0)))), 2) DESC
  `;

  const rawData = (await db.executeOnReplica(query)) as unknown as Array<{
    category_slug: string;
    category_name: string;
    total_tax_amount: string;
    total_transaction_amount: string;
    transaction_count: number;
    avg_tax_rate: string;
    tax_type: string;
    currency: string;
    earliest_date: string;
    latest_date: string;
  }>;

  const processedData = rawData?.map((item) => ({
    category_slug: item.category_slug,
    category_name: item.category_name,
    total_tax_amount: Number.parseFloat(item.total_tax_amount),
    total_transaction_amount: Number.parseFloat(item.total_transaction_amount),
    transaction_count: Number(item.transaction_count),
    avg_tax_rate: Number.parseFloat(item.avg_tax_rate || "0"),
    tax_type: item.tax_type,
    currency: item.currency,
    earliest_date: item.earliest_date,
    latest_date: item.latest_date,
  }));

  const totalTaxAmount = Number(
    (
      processedData?.reduce((sum, item) => sum + item.total_tax_amount, 0) ?? 0
    ).toFixed(2),
  );

  const totalTransactionAmount = Number(
    (
      processedData?.reduce(
        (sum, item) => sum + item.total_transaction_amount,
        0,
      ) ?? 0
    ).toFixed(2),
  );

  const totalTransactions =
    processedData?.reduce((sum, item) => sum + item.transaction_count, 0) ?? 0;

  return {
    summary: {
      totalTaxAmount,
      totalTransactionAmount,
      totalTransactions,
      categoryCount: processedData?.length ?? 0,
      type,
      currency: processedData?.at(0)?.currency ?? inputCurrency,
    },
    meta: {
      type: "tax",
      taxType: type,
      currency: processedData?.at(0)?.currency ?? inputCurrency,
      period: {
        from,
        to,
      },
    },
    result: processedData,
  };
}

export type GetGrowthRateParams = {
  teamId: string;
  from: string;
  to: string;
  currency?: string;
  type?: "revenue" | "profit";
  revenueType?: "gross" | "net";
  period?: "quarterly" | "monthly" | "yearly";
};

export async function getGrowthRate(db: Database, params: GetGrowthRateParams) {
  const {
    teamId,
    from,
    to,
    currency: inputCurrency,
    type = "revenue",
    revenueType = "net",
    period = "quarterly",
  } = params;

  const fromDate = startOfMonth(new UTCDate(parseISO(from)));
  const toDate = endOfMonth(new UTCDate(parseISO(to)));

  // Calculate comparison period based on period type
  let prevFromDate: UTCDate;
  let prevToDate: UTCDate;

  switch (period) {
    case "quarterly":
      // Compare with previous quarter (3 months ago)
      prevFromDate = startOfMonth(new UTCDate(fromDate.getTime()));
      prevFromDate.setMonth(prevFromDate.getMonth() - 3);
      prevToDate = endOfMonth(new UTCDate(toDate.getTime()));
      prevToDate.setMonth(prevToDate.getMonth() - 3);
      break;
    case "yearly":
      // Compare with previous year
      prevFromDate = subYears(fromDate, 1);
      prevToDate = subYears(toDate, 1);
      break;
    default:
      // Compare with previous month (default case)
      prevFromDate = startOfMonth(new UTCDate(fromDate.getTime()));
      prevFromDate.setMonth(prevFromDate.getMonth() - 1);
      prevToDate = endOfMonth(new UTCDate(toDate.getTime()));
      prevToDate.setMonth(prevToDate.getMonth() - 1);
      break;
  }

  // Get target currency
  const targetCurrency = await getTargetCurrency(db, teamId, inputCurrency);

  // Use appropriate data function based on type
  const dataFunction = type === "profit" ? getProfit : getRevenue;

  // Get current and previous period data in parallel
  const [currentData, previousData] = await Promise.all([
    dataFunction(db, {
      teamId,
      from,
      to,
      currency: inputCurrency,
      revenueType,
    }),
    dataFunction(db, {
      teamId,
      from: prevFromDate.toISOString(),
      to: prevToDate.toISOString(),
      currency: inputCurrency,
      revenueType,
    }),
  ]);

  // Calculate totals
  const currentTotal = currentData.reduce(
    (sum, item) => sum + Number.parseFloat(item.value),
    0,
  );
  const previousTotal = previousData.reduce(
    (sum, item) => sum + Number.parseFloat(item.value),
    0,
  );

  // Calculate growth rate
  let growthRate = 0;
  if (previousTotal > 0) {
    growthRate = ((currentTotal - previousTotal) / previousTotal) * 100;
  }

  // For quarterly period, use the full period comparison instead of just recent months
  let periodGrowthRate = 0;
  if (period === "quarterly") {
    // For quarterly, use the full period comparison (current quarter vs previous quarter)
    periodGrowthRate = growthRate;
  } else {
    // For other periods, calculate period-over-period comparison for recent months
    const recentMonths = Math.min(3, currentData.length);
    const recentCurrent = currentData
      .slice(-recentMonths)
      .reduce((sum, item) => sum + Number.parseFloat(item.value), 0);
    const recentPrevious = previousData
      .slice(-recentMonths)
      .reduce((sum, item) => sum + Number.parseFloat(item.value), 0);

    if (recentPrevious > 0) {
      periodGrowthRate =
        ((recentCurrent - recentPrevious) / recentPrevious) * 100;
    }
  }

  // Determine trend based on the period growth rate (what we're actually displaying)
  const trend =
    periodGrowthRate > 0
      ? "positive"
      : periodGrowthRate < 0
        ? "negative"
        : "neutral";

  return {
    summary: {
      currentTotal: Number(currentTotal.toFixed(2)),
      previousTotal: Number(previousTotal.toFixed(2)),
      growthRate: Number(growthRate.toFixed(2)),
      periodGrowthRate: Number(periodGrowthRate.toFixed(2)),
      currency: targetCurrency || "USD",
      trend,
      period,
      type,
      revenueType,
    },
    meta: {
      type: "growth_rate",
      period,
      currency: targetCurrency || "USD",
      dateRange: {
        current: { from, to },
        previous: {
          from: prevFromDate.toISOString(),
          to: prevToDate.toISOString(),
        },
      },
    },
    result: {
      current: {
        total: Number(currentTotal.toFixed(2)),
        period: { from, to },
        data: currentData.map((item) => ({
          date: item.date,
          value: Number.parseFloat(item.value),
          currency: item.currency,
        })),
      },
      previous: {
        total: Number(previousTotal.toFixed(2)),
        period: {
          from: prevFromDate.toISOString(),
          to: prevToDate.toISOString(),
        },
        data: previousData.map((item) => ({
          date: item.date,
          value: Number.parseFloat(item.value),
          currency: item.currency,
        })),
      },
    },
  };
}

export type GetProfitMarginParams = {
  teamId: string;
  from: string;
  to: string;
  currency?: string;
  revenueType?: "gross" | "net";
};

export async function getProfitMargin(
  db: Database,
  params: GetProfitMarginParams,
) {
  const {
    teamId,
    from,
    to,
    currency: inputCurrency,
    revenueType = "net",
  } = params;

  const _fromDate = startOfMonth(new UTCDate(parseISO(from)));
  const _toDate = endOfMonth(new UTCDate(parseISO(to)));

  // Get target currency
  const targetCurrency = await getTargetCurrency(db, teamId, inputCurrency);

  // Get revenue and profit data in parallel
  // Note: For profit margin calculation, we always use Net Revenue as the denominator
  // because Gross Profit = Net Revenue - COGS, and Net Profit = Gross Profit - Operating Expenses
  const [revenueData, profitData] = await Promise.all([
    getRevenue(db, {
      teamId,
      from,
      to,
      currency: inputCurrency,
      revenueType: "net", // Always use net revenue for profit margin denominator
    }),
    getProfit(db, {
      teamId,
      from,
      to,
      currency: inputCurrency,
      revenueType, // Use the provided revenueType to determine gross vs net profit
    }),
  ]);

  // Calculate totals
  const totalRevenue = revenueData.reduce(
    (sum, item) => sum + Number.parseFloat(item.value),
    0,
  );
  const totalProfit = profitData.reduce(
    (sum, item) => sum + Number.parseFloat(item.value),
    0,
  );

  // Calculate profit margin percentage
  let profitMargin = 0;
  if (totalRevenue > 0) {
    profitMargin = (totalProfit / totalRevenue) * 100;
  }

  // Calculate monthly profit margins for trend analysis
  const monthlyMargins = revenueData.map((revenueItem, index) => {
    const profitItem = profitData[index];
    const monthRevenue = Number.parseFloat(revenueItem.value);
    const monthProfit = profitItem ? Number.parseFloat(profitItem.value) : 0;

    let monthMargin = 0;
    if (monthRevenue > 0) {
      monthMargin = (monthProfit / monthRevenue) * 100;
    }

    return {
      date: revenueItem.date,
      revenue: monthRevenue,
      profit: monthProfit,
      margin: Number(monthMargin.toFixed(2)),
      currency: revenueItem.currency,
    };
  });

  // Calculate average margin
  const avgMargin =
    monthlyMargins.length > 0
      ? monthlyMargins.reduce((sum, item) => sum + item.margin, 0) /
        monthlyMargins.length
      : 0;

  // Determine trend based on first vs last month
  let trend: "positive" | "negative" | "neutral" = "neutral";
  if (monthlyMargins.length >= 2) {
    const firstMonth = monthlyMargins[0];
    const lastMonth = monthlyMargins[monthlyMargins.length - 1];
    if (firstMonth && lastMonth) {
      const firstMargin = firstMonth.margin;
      const lastMargin = lastMonth.margin;
      trend =
        lastMargin > firstMargin
          ? "positive"
          : lastMargin < firstMargin
            ? "negative"
            : "neutral";
    }
  }

  return {
    summary: {
      totalRevenue: Number(totalRevenue.toFixed(2)),
      totalProfit: Number(totalProfit.toFixed(2)),
      profitMargin: Number(profitMargin.toFixed(2)),
      averageMargin: Number(avgMargin.toFixed(2)),
      currency: targetCurrency || "USD",
      revenueType,
      trend,
      monthCount: monthlyMargins.length,
    },
    meta: {
      type: "profit_margin",
      currency: targetCurrency || "USD",
      revenueType,
      period: {
        from,
        to,
      },
    },
    result: monthlyMargins,
  };
}

export type GetCashFlowParams = {
  teamId: string;
  from: string;
  to: string;
  currency?: string;
  period?: "monthly" | "quarterly";
  /** When true, use exact dates instead of expanding to month boundaries. Useful for weekly insights. */
  exactDates?: boolean;
};

export async function getCashFlow(db: Database, params: GetCashFlowParams) {
  const {
    teamId,
    from,
    to,
    currency: inputCurrency,
    period = "monthly",
    exactDates = false,
  } = params;

  // When exactDates is true, use the exact dates provided (for weekly insights)
  // Otherwise, expand to month boundaries (for monthly reports)
  const fromDate = exactDates
    ? new UTCDate(parseISO(from))
    : startOfMonth(new UTCDate(parseISO(from)));
  const toDate = exactDates
    ? new UTCDate(parseISO(to))
    : endOfMonth(new UTCDate(parseISO(to)));

  // Get target currency
  const targetCurrency = await getTargetCurrency(db, teamId, inputCurrency);

  // Build base query conditions
  const baseConditions = [
    eq(transactions.teamId, teamId),
    eq(transactions.internal, false),
    ne(transactions.status, "excluded"),
    gte(transactions.date, format(fromDate, "yyyy-MM-dd")),
    lte(transactions.date, format(toDate, "yyyy-MM-dd")),
  ];

  // Add currency conditions
  // When inputCurrency is provided, we want to show transactions in that currency
  // This includes transactions where either:
  // 1. The original currency matches, OR
  // 2. The baseCurrency matches (for converted transactions)
  if (inputCurrency && targetCurrency) {
    baseConditions.push(
      or(
        eq(transactions.currency, targetCurrency),
        eq(transactions.baseCurrency, targetCurrency),
      )!,
    );
  } else if (targetCurrency) {
    baseConditions.push(eq(transactions.baseCurrency, targetCurrency));
  }

  // Category exclusion condition
  const categoryExclusion = or(
    isNull(transactions.categorySlug),
    isNull(transactionCategories.excluded),
    eq(transactionCategories.excluded, false),
  )!;

  // Get monthly income (positive amounts) and expenses (negative amounts)
  const monthlyData = await db
    .select({
      month: sql<string>`DATE_TRUNC('month', ${transactions.date})::date`,
      income:
        inputCurrency && targetCurrency
          ? sql<number>`COALESCE(SUM(
            CASE WHEN 
              CASE
                WHEN ${transactions.baseCurrency} = ${sql`${targetCurrency}`} AND ${transactions.baseAmount} IS NOT NULL THEN ${transactions.baseAmount}
                ELSE ${transactions.amount}
              END > 0 
            THEN 
              CASE
                WHEN ${transactions.baseCurrency} = ${sql`${targetCurrency}`} AND ${transactions.baseAmount} IS NOT NULL THEN ${transactions.baseAmount}
                ELSE ${transactions.amount}
              END 
            ELSE 0 END
          ), 0)`
          : sql<number>`COALESCE(SUM(
            CASE WHEN COALESCE(${transactions.baseAmount}, 0) > 0 THEN COALESCE(${transactions.baseAmount}, 0) ELSE 0 END
          ), 0)`,
      expenses:
        inputCurrency && targetCurrency
          ? sql<number>`COALESCE(SUM(
            CASE WHEN 
              CASE
                WHEN ${transactions.baseCurrency} = ${sql`${targetCurrency}`} AND ${transactions.baseAmount} IS NOT NULL THEN ${transactions.baseAmount}
                ELSE ${transactions.amount}
              END < 0 
            THEN ABS(
              CASE
                WHEN ${transactions.baseCurrency} = ${sql`${targetCurrency}`} AND ${transactions.baseAmount} IS NOT NULL THEN ${transactions.baseAmount}
                ELSE ${transactions.amount}
              END
            ) 
            ELSE 0 END
          ), 0)`
          : sql<number>`COALESCE(SUM(
            CASE WHEN COALESCE(${transactions.baseAmount}, 0) < 0 THEN ABS(COALESCE(${transactions.baseAmount}, 0)) ELSE 0 END
          ), 0)`,
    })
    .from(transactions)
    .leftJoin(
      transactionCategories,
      and(
        eq(transactionCategories.slug, transactions.categorySlug),
        eq(transactionCategories.teamId, teamId),
      ),
    )
    .where(and(...baseConditions, categoryExclusion))
    .groupBy(sql`DATE_TRUNC('month', ${transactions.date})`)
    .orderBy(sql`DATE_TRUNC('month', ${transactions.date}) ASC`);

  // Generate complete month series
  const monthSeries = eachMonthOfInterval({ start: fromDate, end: toDate });
  const dataMap = new Map(
    monthlyData.map((item) => [
      item.month,
      { income: Number(item.income), expenses: Number(item.expenses) },
    ]),
  );

  // Build complete monthly data array
  const completeMonthlyData = monthSeries.map((monthStart) => {
    const monthKey = format(monthStart, "yyyy-MM-dd");
    const monthData = dataMap.get(monthKey) || { income: 0, expenses: 0 };
    const netCashFlow = monthData.income - monthData.expenses;

    return {
      month: format(monthStart, "MMM"),
      date: monthKey,
      income: Number(monthData.income.toFixed(2)),
      expenses: Number(monthData.expenses.toFixed(2)),
      netCashFlow: Number(netCashFlow.toFixed(2)),
    };
  });

  // Calculate totals
  const totalIncome = completeMonthlyData.reduce(
    (sum, item) => sum + item.income,
    0,
  );
  const totalExpenses = completeMonthlyData.reduce(
    (sum, item) => sum + item.expenses,
    0,
  );
  const netCashFlow = totalIncome - totalExpenses;
  const averageMonthlyCashFlow =
    completeMonthlyData.length > 0
      ? netCashFlow / completeMonthlyData.length
      : 0;

  return {
    summary: {
      netCashFlow: Number(netCashFlow.toFixed(2)),
      totalIncome: Number(totalIncome.toFixed(2)),
      totalExpenses: Number(totalExpenses.toFixed(2)),
      averageMonthlyCashFlow: Number(averageMonthlyCashFlow.toFixed(2)),
      currency: targetCurrency || "USD",
      period,
    },
    monthlyData: completeMonthlyData,
    meta: {
      type: "cash_flow",
      currency: targetCurrency || "USD",
      period: {
        from,
        to,
      },
    },
  };
}

export type GetOutstandingInvoicesParams = {
  teamId: string;
  currency?: string;
  status?: ("unpaid" | "overdue")[];
};

export type GetOverdueInvoicesAlertParams = {
  teamId: string;
  currency?: string;
};

export async function getOverdueInvoicesAlert(
  db: Database,
  params: GetOverdueInvoicesAlertParams,
) {
  const { teamId, currency: inputCurrency } = params;

  // Get target currency
  const targetCurrency = await getTargetCurrency(db, teamId, inputCurrency);

  // Build query conditions for overdue invoices only
  const conditions = [
    eq(invoices.teamId, teamId),
    eq(invoices.status, "overdue"),
  ];

  // Add currency filter if specified
  if (inputCurrency && targetCurrency) {
    conditions.push(eq(invoices.currency, targetCurrency));
  }

  // Get overdue invoices details
  const result = await db
    .select({
      count: sql<number>`COUNT(*)`,
      totalAmount: sql<number>`COALESCE(SUM(${invoices.amount}), 0)`,
      oldestDueDate: sql<string>`MIN(${invoices.dueDate})`,
      currency: invoices.currency,
    })
    .from(invoices)
    .where(and(...conditions))
    .groupBy(invoices.currency);

  // Calculate totals
  let totalCount = 0;
  let totalAmount = 0;
  let oldestDueDate: string | null = null;
  let mainCurrency = targetCurrency || "USD";

  if (result.length > 0) {
    if (inputCurrency && targetCurrency) {
      // Single currency result
      const singleResult = result[0];
      totalCount = Number(singleResult?.count || 0);
      totalAmount = Number(singleResult?.totalAmount || 0);
      oldestDueDate = singleResult?.oldestDueDate || null;
      mainCurrency = singleResult?.currency || targetCurrency;
    } else {
      // Multiple currencies - sum counts
      totalCount = result.reduce(
        (sum, item) => sum + Number(item.count || 0),
        0,
      );

      // Use the first currency's total as primary
      const primaryResult =
        result.find((r) => r.currency === targetCurrency) || result[0];
      totalAmount = Number(primaryResult?.totalAmount || 0);
      oldestDueDate = primaryResult?.oldestDueDate || null;
      mainCurrency = primaryResult?.currency || targetCurrency || "USD";
    }
  }

  // Calculate days overdue from oldest invoice
  let daysOverdue = 0;
  if (oldestDueDate) {
    const now = new Date();
    const dueDate = parseISO(oldestDueDate);
    daysOverdue = Math.floor(
      (now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24),
    );
  }

  return {
    summary: {
      count: totalCount,
      totalAmount: Number(totalAmount.toFixed(2)),
      currency: mainCurrency,
      oldestDueDate,
      daysOverdue,
    },
    meta: {
      type: "overdue_invoices_alert",
      currency: mainCurrency,
    },
  };
}

export async function getOutstandingInvoices(
  db: Database,
  params: GetOutstandingInvoicesParams,
) {
  const {
    teamId,
    currency: inputCurrency,
    status = ["unpaid", "overdue", "draft", "scheduled"],
  } = params;

  // Get target currency
  const targetCurrency = await getTargetCurrency(db, teamId, inputCurrency);

  // Build query conditions
  const conditions = [
    eq(invoices.teamId, teamId),
    inArray(invoices.status, status),
  ];

  // Add currency filter if specified
  if (inputCurrency && targetCurrency) {
    conditions.push(eq(invoices.currency, targetCurrency));
  }

  // Get outstanding invoices summary
  const result = await db
    .select({
      count: sql<number>`COUNT(*)`,
      totalAmount: sql<number>`COALESCE(SUM(${invoices.amount}), 0)`,
      currency: invoices.currency,
    })
    .from(invoices)
    .where(and(...conditions))
    .groupBy(invoices.currency);

  // Calculate totals across all currencies (if no currency filter)
  let totalCount = 0;
  let totalAmount = 0;
  let mainCurrency = targetCurrency || "USD";

  if (result.length > 0) {
    if (inputCurrency && targetCurrency) {
      // Single currency result
      const singleResult = result[0];
      totalCount = Number(singleResult?.count || 0);
      totalAmount = Number(singleResult?.totalAmount || 0);
      mainCurrency = singleResult?.currency || targetCurrency;
    } else {
      // Multiple currencies - sum counts and use base currency amounts
      totalCount = result.reduce(
        (sum, item) => sum + Number(item.count || 0),
        0,
      );

      // For multiple currencies, we'd need to convert to base currency
      // For now, let's use the first currency's total as primary
      const primaryResult =
        result.find((r) => r.currency === targetCurrency) || result[0];
      totalAmount = Number(primaryResult?.totalAmount || 0);
      mainCurrency = primaryResult?.currency || targetCurrency || "USD";
    }
  }

  return {
    summary: {
      count: totalCount,
      totalAmount: Number(totalAmount.toFixed(2)),
      currency: mainCurrency,
      status,
    },
    meta: {
      type: "outstanding_invoices",
      currency: mainCurrency,
      status,
    },
  };
}

export type GetRecurringExpensesParams = {
  teamId: string;
  currency?: string;
  from?: string; // ISO date string (YYYY-MM-DD)
  to?: string; // ISO date string (YYYY-MM-DD)
};

interface RecurringExpenseItem {
  name: string;
  amount: number;
  frequency: "weekly" | "monthly" | "annually" | "irregular";
  categoryName: string | null;
  categorySlug: string | null;
  lastDate: string;
}

export async function getRecurringExpenses(
  db: Database,
  params: GetRecurringExpensesParams,
) {
  const { teamId, currency: inputCurrency, from, to } = params;

  // Get target currency
  const targetCurrency = await getTargetCurrency(db, teamId, inputCurrency);

  // Build conditions
  const conditions = [
    eq(transactions.teamId, teamId),
    eq(transactions.recurring, true),
    eq(transactions.internal, false),
    ne(transactions.status, "excluded"),
  ];

  // Amount condition: handle NULL baseAmount gracefully
  if (inputCurrency && targetCurrency) {
    conditions.push(
      sql`(CASE 
        WHEN ${transactions.baseCurrency} = ${sql`${targetCurrency}`} AND ${transactions.baseAmount} IS NOT NULL THEN ${transactions.baseAmount}
        ELSE ${transactions.amount}
      END < 0)`,
    );
  } else if (targetCurrency) {
    // When no inputCurrency, exclude transactions without baseAmount
    conditions.push(eq(transactions.baseCurrency, targetCurrency));
    conditions.push(lt(transactions.baseAmount, 0));
  }

  // Filter by date range if provided
  if (from) {
    conditions.push(gte(transactions.date, from));
  }
  if (to) {
    conditions.push(lte(transactions.date, to));
  }

  // Get all recurring expenses grouped by name and frequency
  const recurringExpenses = await db
    .select({
      name: transactions.name,
      frequency: transactions.frequency,
      categoryName: transactionCategories.name,
      categorySlug: transactionCategories.slug,
      amount: sql<number>`AVG(ABS(${
        inputCurrency && targetCurrency
          ? sql`CASE
              WHEN ${transactions.baseCurrency} = ${sql`${targetCurrency}`} AND ${transactions.baseAmount} IS NOT NULL THEN ${transactions.baseAmount}
              ELSE ${transactions.amount}
            END`
          : sql`COALESCE(${transactions.baseAmount}, 0)`
      }))`,
      count: sql<number>`COUNT(*)::int`,
      lastDate: sql<string>`MAX(${transactions.date})`,
    })
    .from(transactions)
    .leftJoin(
      transactionCategories,
      and(
        eq(transactionCategories.slug, transactions.categorySlug),
        eq(transactionCategories.teamId, teamId),
      ),
    )
    .where(
      and(
        ...conditions,
        or(
          isNull(transactions.categorySlug),
          isNull(transactionCategories.excluded),
          eq(transactionCategories.excluded, false),
        )!,
      ),
    )
    .groupBy(
      transactions.name,
      transactions.frequency,
      transactionCategories.name,
      transactionCategories.slug,
    )
    .orderBy(
      sql`AVG(ABS(${
        inputCurrency && targetCurrency
          ? sql`CASE
              WHEN ${transactions.baseCurrency} = ${sql`${targetCurrency}`} AND ${transactions.baseAmount} IS NOT NULL THEN ${transactions.baseAmount}
              ELSE ${transactions.amount}
            END`
          : sql`COALESCE(${transactions.baseAmount}, 0)`
      })) DESC`,
    )
    .limit(10);

  // Calculate totals by frequency
  const frequencyTotals = {
    weekly: 0,
    monthly: 0,
    annually: 0,
    irregular: 0,
  };

  let totalRecurringAmount = 0;

  for (const expense of recurringExpenses) {
    const amount = Number(expense.amount);
    const frequency = (expense.frequency || "irregular") as
      | "weekly"
      | "monthly"
      | "annually"
      | "irregular";

    // Convert all to monthly equivalent for comparison
    let monthlyEquivalent = 0;
    switch (frequency) {
      case "weekly":
        monthlyEquivalent = amount * 4.33; // Average weeks per month
        frequencyTotals.weekly += amount;
        break;
      case "monthly":
        monthlyEquivalent = amount;
        frequencyTotals.monthly += amount;
        break;
      case "annually":
        monthlyEquivalent = amount / 12;
        frequencyTotals.annually += amount;
        break;
      case "irregular":
        monthlyEquivalent = amount;
        frequencyTotals.irregular += amount;
        break;
    }

    totalRecurringAmount += monthlyEquivalent;
  }

  // Get currency from first expense or use target currency
  const currency = recurringExpenses[0]
    ? inputCurrency || targetCurrency || "USD"
    : targetCurrency || "USD";

  // Format expenses for return
  const expenses: RecurringExpenseItem[] = recurringExpenses.map((exp) => ({
    name: exp.name,
    amount: Number(Number(exp.amount).toFixed(2)),
    frequency: (exp.frequency || "irregular") as
      | "weekly"
      | "monthly"
      | "annually"
      | "irregular",
    categoryName: exp.categoryName,
    categorySlug: exp.categorySlug,
    lastDate: exp.lastDate,
  }));

  return {
    summary: {
      totalMonthlyEquivalent: Number(totalRecurringAmount.toFixed(2)),
      totalExpenses: recurringExpenses.length,
      currency,
      byFrequency: {
        weekly: Number((frequencyTotals.weekly || 0).toFixed(2)),
        monthly: Number((frequencyTotals.monthly || 0).toFixed(2)),
        annually: Number((frequencyTotals.annually || 0).toFixed(2)),
        irregular: Number((frequencyTotals.irregular || 0).toFixed(2)),
      },
    },
    expenses,
    meta: {
      type: "recurring_expenses",
      currency,
    },
  };
}

// ============================================================================
// REVENUE FORECAST HELPER FUNCTIONS (Bottom-Up Approach)
// ============================================================================

/**
 * Project recurring income transactions into forecast months.
 * These are bank transactions marked as recurring (e.g., retainers, subscriptions).
 */
type RecurringTransactionProjection = Map<
  string,
  { amount: number; count: number }
>;

async function getRecurringTransactionProjection(
  db: Database,
  params: { teamId: string; forecastMonths: number; currency?: string },
): Promise<RecurringTransactionProjection> {
  const { teamId, forecastMonths, currency } = params;

  // Get recurring income transactions from the last 6 months to establish patterns
  const sixMonthsAgo = format(subMonths(new Date(), 6), "yyyy-MM-dd");

  const conditions = [
    eq(transactions.teamId, teamId),
    eq(transactions.recurring, true),
    gt(transactions.amount, 0), // Income only
    eq(transactions.internal, false),
    ne(transactions.status, "excluded"),
    gte(transactions.date, sixMonthsAgo),
  ];

  // Currency filter: include transactions where either currency OR baseCurrency matches
  if (currency) {
    conditions.push(
      or(
        eq(transactions.currency, currency),
        eq(transactions.baseCurrency, currency),
      )!,
    );
  }

  // Query with LEFT JOIN to transactionCategories for category exclusion
  // This matches the pattern used by all other report functions
  const recurringIncome = await db
    .select({
      name: transactions.name,
      amount: transactions.amount,
      baseAmount: transactions.baseAmount,
      baseCurrency: transactions.baseCurrency,
      frequency: transactions.frequency,
      date: transactions.date,
    })
    .from(transactions)
    .leftJoin(
      transactionCategories,
      and(
        eq(transactionCategories.slug, transactions.categorySlug),
        eq(transactionCategories.teamId, teamId),
      ),
    )
    .where(
      and(
        ...conditions,
        // Category exclusion: match pattern from other reports
        // Allow uncategorized, or categories where excluded is NULL or false
        or(
          isNull(transactions.categorySlug),
          isNull(transactionCategories.excluded),
          eq(transactionCategories.excluded, false),
        )!,
      ),
    );

  // Group by name to get unique recurring sources (use most recent amount)
  // For multi-currency support: use baseAmount if available and matches target currency
  const recurringByName = new Map<
    string,
    { amount: number; frequency: string | null; lastDate: string }
  >();

  for (const tx of recurringIncome) {
    const existing = recurringByName.get(tx.name);
    if (!existing || tx.date > existing.lastDate) {
      // Use baseAmount when available (converted to team's base currency)
      // This ensures multi-currency accounts are properly included
      const effectiveAmount =
        currency && tx.baseCurrency === currency && tx.baseAmount !== null
          ? tx.baseAmount
          : tx.amount;

      recurringByName.set(tx.name, {
        amount: effectiveAmount,
        frequency: tx.frequency,
        lastDate: tx.date,
      });
    }
  }

  // Project into forecast months
  const projection: RecurringTransactionProjection = new Map();
  // Use UTCDate for consistency with getRevenueForecast lookups
  const currentDate = new UTCDate();

  for (let i = 1; i <= forecastMonths; i++) {
    const monthKey = format(addMonths(currentDate, i), "yyyy-MM");
    let monthTotal = 0;
    let count = 0;

    for (const [, recurring] of recurringByName) {
      let monthlyAmount = recurring.amount;

      // Convert to monthly equivalent based on frequency
      switch (recurring.frequency) {
        case "weekly":
          // ~4.33 weeks per month (52 weeks / 12 months)
          monthlyAmount = recurring.amount * 4.33;
          break;
        case "biweekly":
          // ~2.17 occurrences per month (26 biweekly periods / 12 months)
          monthlyAmount = recurring.amount * 2.17;
          break;
        case "semi_monthly":
          // Exactly 2 occurrences per month (e.g., 1st and 15th)
          monthlyAmount = recurring.amount * 2;
          break;
        case "annually":
          monthlyAmount = recurring.amount / 12;
          break;
        // monthly is default, no conversion needed
      }

      monthTotal += monthlyAmount;
      count++;
    }

    projection.set(monthKey, { amount: monthTotal, count });
  }

  return projection;
}

/**
 * Calculate team's actual historical collection metrics from paid invoices.
 * Used to adjust collection probability based on real payment behavior.
 */
interface TeamCollectionMetrics {
  onTimeRate: number; // Percentage paid on or before due date
  avgDaysToPay: number; // Average days from issue to payment
  sampleSize: number; // Number of invoices in calculation
}

async function getTeamCollectionMetrics(
  db: Database,
  teamId: string,
): Promise<TeamCollectionMetrics> {
  // Use UTCDate for consistency with other date calculations
  const twelveMonthsAgo = format(subMonths(new UTCDate(), 12), "yyyy-MM-dd");

  // Get paid invoices from last 12 months
  const paidInvoices = await db
    .select({
      issueDate: invoices.issueDate,
      paidAt: invoices.paidAt,
      dueDate: invoices.dueDate,
      amount: invoices.amount,
    })
    .from(invoices)
    .where(
      and(
        eq(invoices.teamId, teamId),
        eq(invoices.status, "paid"),
        isNotNull(invoices.paidAt),
        isNotNull(invoices.issueDate),
        gte(invoices.paidAt, twelveMonthsAgo),
      ),
    );

  if (paidInvoices.length === 0) {
    // Default values if no history
    return {
      onTimeRate: 0.7,
      avgDaysToPay: 30,
      sampleSize: 0,
    };
  }

  let onTimeCount = 0;
  let totalDaysToPay = 0;
  let validPaymentCount = 0;

  for (const inv of paidInvoices) {
    if (!inv.issueDate || !inv.paidAt) continue;

    const issueDate = parseISO(inv.issueDate);
    const paidDate = parseISO(inv.paidAt);
    const daysToPay = Math.floor(
      (paidDate.getTime() - issueDate.getTime()) / (1000 * 60 * 60 * 24),
    );

    // Only count reasonable payment times (0-365 days)
    if (daysToPay >= 0 && daysToPay <= 365) {
      totalDaysToPay += daysToPay;
      validPaymentCount++;

      // Check if paid on time
      if (inv.dueDate) {
        const dueDate = parseISO(inv.dueDate);
        if (paidDate <= dueDate) {
          onTimeCount++;
        }
      }
    }
  }

  return {
    onTimeRate: validPaymentCount > 0 ? onTimeCount / validPaymentCount : 0.7,
    avgDaysToPay:
      validPaymentCount > 0 ? totalDaysToPay / validPaymentCount : 30,
    sampleSize: validPaymentCount,
  };
}

/**
 * Calculate expected collections from outstanding invoices using team's actual payment history.
 */
interface ExpectedCollections {
  month1: number;
  month2: number;
  totalExpected: number;
  invoiceCount: number;
}

async function calculateExpectedCollections(
  db: Database,
  teamId: string,
  teamMetrics: TeamCollectionMetrics,
  currency?: string,
): Promise<ExpectedCollections> {
  // Get outstanding invoices
  const conditions = [
    eq(invoices.teamId, teamId),
    inArray(invoices.status, ["unpaid", "overdue"]),
  ];

  if (currency) {
    conditions.push(eq(invoices.currency, currency));
  }

  const outstandingInvoices = await db
    .select({
      id: invoices.id,
      amount: invoices.amount,
      issueDate: invoices.issueDate,
      dueDate: invoices.dueDate,
      status: invoices.status,
    })
    .from(invoices)
    .where(and(...conditions));

  if (outstandingInvoices.length === 0) {
    return {
      month1: 0,
      month2: 0,
      totalExpected: 0,
      invoiceCount: 0,
    };
  }

  const now = new Date();
  // Team factor adjusts probability based on their actual payment history
  const teamFactor = teamMetrics.onTimeRate / 0.7; // Normalize around 70% baseline

  let month1Total = 0;
  let month2Total = 0;

  for (const inv of outstandingInvoices) {
    const amount = inv.amount ?? 0;
    const daysSinceIssue = inv.issueDate
      ? Math.floor(
          (now.getTime() - parseISO(inv.issueDate).getTime()) /
            (1000 * 60 * 60 * 24),
        )
      : 0;

    const daysPastDue = inv.dueDate
      ? Math.floor(
          (now.getTime() - parseISO(inv.dueDate).getTime()) /
            (1000 * 60 * 60 * 24),
        )
      : 0;

    // Base probability by age
    let baseProbability: number;
    if (daysSinceIssue < 30) {
      baseProbability = 0.85; // Fresh invoice
    } else if (daysPastDue <= 0) {
      baseProbability = 0.75; // Not yet due
    } else if (daysPastDue <= 30) {
      baseProbability = 0.5; // Recently overdue
    } else if (daysPastDue <= 60) {
      baseProbability = 0.3; // Moderately overdue
    } else if (daysPastDue <= 90) {
      baseProbability = 0.15; // Significantly overdue
    } else {
      baseProbability = 0.05; // Very old - unlikely
    }

    // Adjust by team's actual payment behavior (capped at reasonable bounds)
    const adjustedProbability = Math.min(
      0.95,
      Math.max(0.05, baseProbability * teamFactor),
    );

    const expectedAmount = amount * adjustedProbability;

    // Estimate timing: fresh invoices likely month 1, older ones split
    if (daysSinceIssue < 45) {
      month1Total += expectedAmount;
    } else {
      month1Total += expectedAmount * 0.6;
      month2Total += expectedAmount * 0.4;
    }
  }

  return {
    month1: month1Total,
    month2: month2Total,
    totalExpected: month1Total + month2Total,
    invoiceCount: outstandingInvoices.length,
  };
}

/**
 * Calculate weighted median for new business baseline.
 * Recent months are weighted more heavily.
 */
function calculateWeightedMedian(values: number[], weights: number[]): number {
  if (values.length === 0) return 0;
  if (values.length === 1) return values[0] ?? 0;

  // Create weighted pairs and sort by value
  const pairs = values.map((v, i) => ({
    value: v,
    weight: weights[i] ?? 1,
  }));
  pairs.sort((a, b) => a.value - b.value);

  const totalWeight = pairs.reduce((sum, p) => sum + p.weight, 0);
  const midWeight = totalWeight / 2;

  let cumWeight = 0;
  for (const pair of pairs) {
    cumWeight += pair.weight;
    if (cumWeight >= midWeight) {
      return pair.value;
    }
  }

  return pairs[pairs.length - 1]?.value ?? 0;
}

/**
 * Calculate historical monthly average of paid recurring invoice revenue.
 * This is needed to avoid double-counting: recurring invoice payments appear
 * in historical revenue (as bank deposits) AND are projected separately.
 */
async function getHistoricalRecurringInvoiceAverage(
  db: Database,
  params: {
    teamId: string;
    currency?: string;
  },
): Promise<number> {
  const { teamId, currency } = params;

  // Look at last 6 months of paid invoices linked to recurring templates
  const sixMonthsAgo = format(subMonths(new Date(), 6), "yyyy-MM-dd");

  const conditions = [
    eq(invoices.teamId, teamId),
    eq(invoices.status, "paid"),
    isNotNull(invoices.invoiceRecurringId), // Only invoices from recurring templates
    isNotNull(invoices.paidAt),
    gte(invoices.paidAt, sixMonthsAgo),
  ];

  // Filter by currency when provided
  if (currency) {
    conditions.push(eq(invoices.currency, currency));
  }

  const paidRecurringInvoices = await db
    .select({
      amount: invoices.amount,
      paidAt: invoices.paidAt,
    })
    .from(invoices)
    .where(and(...conditions));

  if (paidRecurringInvoices.length === 0) {
    return 0;
  }

  // Group by month and calculate average
  const monthlyTotals = new Map<string, number>();

  for (const inv of paidRecurringInvoices) {
    if (!inv.paidAt || !inv.amount) continue;
    const monthKey = format(parseISO(inv.paidAt), "yyyy-MM");
    const amount = Number(inv.amount) || 0;
    monthlyTotals.set(monthKey, (monthlyTotals.get(monthKey) || 0) + amount);
  }

  if (monthlyTotals.size === 0) {
    return 0;
  }

  // Calculate average monthly revenue from recurring invoices
  const totalRevenue = Array.from(monthlyTotals.values()).reduce(
    (a, b) => a + b,
    0,
  );
  return totalRevenue / monthlyTotals.size;
}

/**
 * Calculate non-recurring revenue baseline from historical data.
 * This is total revenue minus BOTH recurring transaction amounts AND
 * recurring invoice payments (to avoid double-counting).
 */
async function calculateNonRecurringBaseline(
  db: Database,
  params: {
    teamId: string;
    currency?: string;
    recurringTxMonthlyAvg: number;
    recurringInvoiceMonthlyAvg: number;
  },
): Promise<number> {
  const {
    teamId,
    currency,
    recurringTxMonthlyAvg,
    recurringInvoiceMonthlyAvg,
  } = params;

  // Get last 6 months of revenue
  const sixMonthsAgo = format(subMonths(new Date(), 6), "yyyy-MM-dd");
  const today = format(new Date(), "yyyy-MM-dd");

  const historicalRevenue = await getRevenue(db, {
    teamId,
    from: sixMonthsAgo,
    to: today,
    currency,
    revenueType: "net",
  });

  if (historicalRevenue.length === 0) {
    return 0;
  }

  // Total recurring revenue to subtract = bank transactions + invoice payments
  // This prevents double-counting since both are projected separately
  const totalRecurringMonthlyAvg =
    recurringTxMonthlyAvg + recurringInvoiceMonthlyAvg;

  // Subtract total recurring average from each month
  const nonRecurringValues = historicalRevenue.map((month) =>
    Math.max(0, Number.parseFloat(month.value) - totalRecurringMonthlyAvg),
  );

  // Weight recent months more heavily (older to newer)
  const weights = nonRecurringValues.map((_, i) => 0.5 + i * 0.1);

  return calculateWeightedMedian(nonRecurringValues, weights);
}

/**
 * Forecast breakdown by source.
 */
interface ForecastBreakdown {
  recurringInvoices: number;
  recurringTransactions: number;
  scheduled: number;
  collections: number;
  billableHours: number;
  newBusiness: number;
}

/**
 * Calculate confidence bounds based on source contributions.
 */
interface ConfidenceBounds {
  optimistic: number;
  pessimistic: number;
  confidence: number;
}

function calculateConfidenceBounds(
  breakdown: ForecastBreakdown,
): ConfidenceBounds {
  const optimistic =
    breakdown.recurringInvoices * 1.05 +
    breakdown.recurringTransactions * 1.1 +
    breakdown.scheduled * 1.05 +
    breakdown.collections * 1.2 +
    breakdown.billableHours * 1.15 +
    breakdown.newBusiness * 1.5;

  const pessimistic =
    breakdown.recurringInvoices * 0.95 +
    breakdown.recurringTransactions * 0.85 + // More conservative (85% not 90%)
    breakdown.scheduled * 0.9 +
    breakdown.collections * 0.6 +
    breakdown.billableHours * 0.7 +
    breakdown.newBusiness * 0.4;

  // Overall confidence = weighted average based on source proportions
  const total = Object.values(breakdown).reduce((a, b) => a + b, 0);
  const confidence =
    total > 0
      ? (breakdown.recurringInvoices / total) * 95 +
        (breakdown.recurringTransactions / total) * 85 +
        (breakdown.scheduled / total) * 90 +
        (breakdown.collections / total) * 70 +
        (breakdown.billableHours / total) * 75 +
        (breakdown.newBusiness / total) * 35
      : 0;

  return {
    optimistic,
    pessimistic,
    confidence: Math.round(confidence),
  };
}

/**
 * Check for potential double-counting between recurring invoices and transactions.
 */
function checkForOverlap(
  recurringInvoices: number,
  recurringTransactions: number,
): string | null {
  // If both are significant (> $500/month each), warn user
  if (recurringInvoices > 500 && recurringTransactions > 500) {
    return (
      "Both recurring invoices and recurring transactions detected. " +
      "If these represent the same revenue (e.g., a retainer billed via invoice " +
      "that also shows as a recurring bank deposit), the forecast may be overstated."
    );
  }
  return null;
}

// ============================================================================
// END REVENUE FORECAST HELPER FUNCTIONS
// ============================================================================

export type GetRevenueForecastParams = {
  teamId: string;
  from: string;
  to: string;
  forecastMonths: number;
  currency?: string;
  revenueType?: "gross" | "net";
};

interface ForecastDataPoint {
  date: string;
  value: number;
  currency: string;
  type: "actual" | "forecast";
}

/**
 * Enhanced forecast data point with confidence and breakdown.
 */
interface EnhancedForecastDataPoint extends ForecastDataPoint {
  optimistic: number;
  pessimistic: number;
  confidence: number;
  breakdown: ForecastBreakdown;
}

/**
 * Revenue forecast using bottom-up approach.
 *
 * Sums KNOWN revenue sources (recurring invoices, recurring transactions,
 * scheduled invoices, expected collections, billable hours) plus a
 * conservative baseline for new business.
 *
 * This replaces the previous growth-rate extrapolation approach which
 * caused unrealistic "hockey stick" projections.
 */
export async function getRevenueForecast(
  db: Database,
  params: GetRevenueForecastParams,
) {
  const {
    teamId,
    from,
    to,
    forecastMonths,
    currency: inputCurrency,
    revenueType = "net",
  } = params;

  // Calculate forecast date range
  const currentDate = new UTCDate(parseISO(to));
  const forecastStartDate = format(
    endOfMonth(
      new UTCDate(currentDate.getFullYear(), currentDate.getMonth() + 1, 1),
    ),
    "yyyy-MM-dd",
  );
  const forecastEndDate = format(
    endOfMonth(
      new UTCDate(
        currentDate.getFullYear(),
        currentDate.getMonth() + forecastMonths,
        1,
      ),
    ),
    "yyyy-MM-dd",
  );

  // Fetch ALL data sources in parallel for the bottom-up forecast
  const [
    historicalData,
    outstandingInvoicesData,
    billableHoursData,
    scheduledInvoicesData,
    recurringInvoiceData,
    recurringTransactionData,
    teamCollectionMetrics,
  ] = await Promise.all([
    // Historical revenue data (for display and baseline calculation)
    getRevenue(db, {
      teamId,
      from,
      to,
      currency: inputCurrency,
      revenueType,
    }),
    // Outstanding invoices (unpaid revenue)
    getOutstandingInvoices(db, {
      teamId,
      currency: inputCurrency,
      status: ["unpaid", "overdue"],
    }),
    // Billable hours this month
    getBillableHours(db, {
      teamId,
      date: new Date().toISOString(),
      view: "month",
    }),
    // Scheduled invoices with issueDate in forecast period
    db
      .select({
        amount: invoices.amount,
        issueDate: invoices.issueDate,
        currency: invoices.currency,
      })
      .from(invoices)
      .where(
        and(
          eq(invoices.teamId, teamId),
          eq(invoices.status, "scheduled"),
          isNotNull(invoices.issueDate),
          gte(invoices.issueDate, forecastStartDate),
          lte(invoices.issueDate, forecastEndDate),
        ),
      ),
    // Recurring invoices projected into forecast months
    getRecurringInvoiceProjection(db, {
      teamId,
      forecastMonths,
      currency: inputCurrency,
    }),
    // Recurring transactions projected into forecast months
    getRecurringTransactionProjection(db, {
      teamId,
      forecastMonths,
      currency: inputCurrency,
    }),
    // Team's actual collection metrics
    getTeamCollectionMetrics(db, teamId),
  ]);

  // Convert historical data to numbers
  const historical = historicalData.map((item: ReportsResultItem) => ({
    date: item.date,
    value: Number.parseFloat(item.value),
    currency: item.currency,
  }));

  const currency = historical[0]?.currency || inputCurrency || "USD";

  // Group scheduled invoices by month
  const scheduledByMonth = new Map<string, number>();
  for (const invoice of scheduledInvoicesData) {
    if (!invoice.issueDate) continue;
    const monthKey = format(parseISO(invoice.issueDate), "yyyy-MM");
    const amount = Number(invoice.amount) || 0;
    scheduledByMonth.set(
      monthKey,
      (scheduledByMonth.get(monthKey) || 0) + amount,
    );
  }

  // Calculate expected collections using team's actual payment history
  const expectedCollections = await calculateExpectedCollections(
    db,
    teamId,
    teamCollectionMetrics,
    inputCurrency,
  );

  // Calculate recurring transaction monthly average for baseline adjustment
  let recurringTxMonthlyAvg = 0;
  for (const [, data] of recurringTransactionData) {
    recurringTxMonthlyAvg = data.amount; // All months have same projection
    break;
  }

  // Calculate historical recurring invoice monthly average
  // This is needed to avoid double-counting: payments from recurring invoices
  // appear in historical revenue AND are projected separately
  const recurringInvoiceMonthlyAvg = await getHistoricalRecurringInvoiceAverage(
    db,
    {
      teamId,
      currency: inputCurrency,
    },
  );

  // Calculate non-recurring baseline (historical revenue minus ALL recurring sources)
  const nonRecurringBaseline = await calculateNonRecurringBaseline(db, {
    teamId,
    currency: inputCurrency,
    recurringTxMonthlyAvg,
    recurringInvoiceMonthlyAvg,
  });

  // Billable hours value (convert from seconds to value)
  const billableHoursTotal = Math.round(billableHoursData.totalDuration / 3600);
  const billableHoursValue = billableHoursData.totalAmount;

  // ============================================================================
  // BUILD BOTTOM-UP FORECAST
  // ============================================================================
  const forecast: EnhancedForecastDataPoint[] = [];
  const warnings: string[] = [];

  for (let i = 1; i <= forecastMonths; i++) {
    const forecastDate = endOfMonth(
      new UTCDate(currentDate.getFullYear(), currentDate.getMonth() + i, 1),
    );
    const monthKey = format(
      new UTCDate(currentDate.getFullYear(), currentDate.getMonth() + i, 1),
      "yyyy-MM",
    );

    // Known sources
    const recurringInvoices = recurringInvoiceData.get(monthKey)?.amount ?? 0;
    const recurringTransactions =
      recurringTransactionData.get(monthKey)?.amount ?? 0;
    const scheduled = scheduledByMonth.get(monthKey) ?? 0;

    // Expected sources (time-limited)
    // Collections: 70% in month 1, 30% in month 2, none after
    const collections =
      i === 1
        ? expectedCollections.month1
        : i === 2
          ? expectedCollections.month2
          : 0;

    // Billable hours: only applies to month 1
    const billableHours = i === 1 ? billableHoursValue : 0;

    // New business baseline with decay
    // Month 1: 80%, Month 2: 70%, Month 3: 60%, Month 4+: 50%
    const decay = Math.max(0.5, 0.9 - i * 0.1);
    const newBusiness = nonRecurringBaseline * decay;

    const breakdown: ForecastBreakdown = {
      recurringInvoices,
      recurringTransactions,
      scheduled,
      collections,
      billableHours,
      newBusiness,
    };

    const value = Object.values(breakdown).reduce((a, b) => a + b, 0);
    const { optimistic, pessimistic, confidence } =
      calculateConfidenceBounds(breakdown);

    forecast.push({
      date: format(forecastDate, "yyyy-MM-dd"),
      value: Math.max(0, Number(value.toFixed(2))),
      optimistic: Math.max(0, Number(optimistic.toFixed(2))),
      pessimistic: Math.max(0, Number(pessimistic.toFixed(2))),
      confidence,
      breakdown,
      currency,
      type: "forecast",
    });
  }

  // Check for potential double-counting
  const firstMonthBreakdown = forecast[0]?.breakdown;
  if (firstMonthBreakdown) {
    const overlapWarning = checkForOverlap(
      firstMonthBreakdown.recurringInvoices,
      firstMonthBreakdown.recurringTransactions,
    );
    if (overlapWarning) {
      warnings.push(overlapWarning);
    }
  }

  // Calculate summary metrics
  const nextMonthProjection = forecast[0]?.value || 0;
  const totalProjectedRevenue = forecast.reduce(
    (sum, item) => sum + item.value,
    0,
  );
  const peakForecast = forecast.reduce(
    (max, curr) => (curr.value > max.value ? curr : max),
    forecast[0] || { date: "", value: 0 },
  );

  // Calculate average confidence across forecast
  const avgConfidence =
    forecast.length > 0
      ? Math.round(
          forecast.reduce((sum, f) => sum + f.confidence, 0) / forecast.length,
        )
      : 0;

  // Combine historical and forecast for charting
  const combinedData: ForecastDataPoint[] = [
    ...historical.map((item) => ({
      ...item,
      type: "actual" as const,
    })),
    ...forecast.map((item) => ({
      date: item.date,
      value: item.value,
      currency: item.currency,
      type: "forecast" as const,
    })),
  ];

  // Calculate totals from first month breakdown for summary
  const firstBreakdown = forecast[0]?.breakdown || {
    recurringInvoices: 0,
    recurringTransactions: 0,
    scheduled: 0,
    collections: 0,
    billableHours: 0,
    newBusiness: 0,
  };

  const totalRecurringRevenue =
    firstBreakdown.recurringInvoices + firstBreakdown.recurringTransactions;

  // For backward compatibility, calculate a synthetic "growth rate" based on
  // comparing forecast month 1 to the last historical month
  const lastHistoricalValue = historical[historical.length - 1]?.value || 0;
  const impliedGrowthRate =
    lastHistoricalValue > 0
      ? ((nextMonthProjection - lastHistoricalValue) / lastHistoricalValue) *
        100
      : 0;

  // Calculate scheduled invoices total
  const scheduledInvoicesTotal = Array.from(scheduledByMonth.values()).reduce(
    (sum, amount) => sum + amount,
    0,
  );

  // ============================================================================
  // RETURN RESULT (backward compatible with new fields)
  // ============================================================================
  return {
    summary: {
      nextMonthProjection: Number(nextMonthProjection.toFixed(2)),
      avgMonthlyGrowthRate: Number(impliedGrowthRate.toFixed(2)),
      totalProjectedRevenue: Number(totalProjectedRevenue.toFixed(2)),
      peakMonth: {
        date: peakForecast.date,
        value: peakForecast.value,
      },
      currency,
      revenueType,
      forecastStartDate: forecast[0]?.date,
      // Include outstanding invoices and billable hours
      unpaidInvoices: {
        count: outstandingInvoicesData.summary.count,
        totalAmount: outstandingInvoicesData.summary.totalAmount,
        currency: outstandingInvoicesData.summary.currency,
      },
      billableHours: {
        totalHours: billableHoursTotal,
        totalAmount: Number(billableHoursValue.toFixed(2)),
        currency: billableHoursData.currency,
      },
    },
    historical: historical.map((item) => ({
      date: item.date,
      value: item.value,
      currency: item.currency,
    })),
    // Enhanced forecast with confidence and breakdown
    forecast: forecast.map((item) => ({
      date: item.date,
      value: item.value,
      currency: item.currency,
      // New fields for bottom-up forecast
      optimistic: item.optimistic,
      pessimistic: item.pessimistic,
      confidence: item.confidence,
      breakdown: item.breakdown,
    })),
    combined: combinedData,
    meta: {
      historicalMonths: historical.length,
      forecastMonths,
      avgGrowthRate: Number(impliedGrowthRate.toFixed(2)),
      basedOnMonths: historical.length,
      currency,
      includesUnpaidInvoices: outstandingInvoicesData.summary.count > 0,
      includesBillableHours: billableHoursTotal > 0,
      // New bottom-up forecast metadata
      forecastMethod: "bottom_up",
      confidenceScore: avgConfidence,
      warnings,
      // Source contribution summary
      recurringRevenueTotal: totalRecurringRevenue,
      recurringInvoicesCount:
        recurringInvoiceData.get(format(addMonths(currentDate, 1), "yyyy-MM"))
          ?.count ?? 0,
      recurringTransactionsCount:
        recurringTransactionData.get(
          format(addMonths(currentDate, 1), "yyyy-MM"),
        )?.count ?? 0,
      expectedCollections: expectedCollections.totalExpected,
      collectionRate: Number(
        (teamCollectionMetrics.onTimeRate * 100).toFixed(1),
      ),
      scheduledInvoicesTotal: Number(scheduledInvoicesTotal.toFixed(2)),
      scheduledInvoicesCount: scheduledByMonth.size,
      newBusinessBaseline: Number(nonRecurringBaseline.toFixed(2)),
      teamCollectionMetrics: {
        onTimeRate: Number((teamCollectionMetrics.onTimeRate * 100).toFixed(1)),
        avgDaysToPay: Math.round(teamCollectionMetrics.avgDaysToPay),
        sampleSize: teamCollectionMetrics.sampleSize,
      },
    },
  };
}

export type GetBalanceSheetParams = {
  teamId: string;
  currency?: string;
  asOf?: string; // ISO date string (YYYY-MM-DD), defaults to today
};

export type BalanceSheetResult = {
  assets: {
    current: {
      cash: number;
      accountsReceivable: number;
      inventory: number;
      inventoryName?: string;
      prepaidExpenses: number;
      prepaidExpensesName?: string;
      total: number;
    };
    nonCurrent: {
      fixedAssets: number;
      fixedAssetsName?: string;
      accumulatedDepreciation: number;
      softwareTechnology: number;
      softwareTechnologyName?: string;
      longTermInvestments: number;
      longTermInvestmentsName?: string;
      otherAssets: number;
      total: number;
    };
    total: number;
  };
  liabilities: {
    current: {
      accountsPayable: number;
      accruedExpenses: number;
      accruedExpensesName?: string;
      shortTermDebt: number;
      creditCardDebt: number;
      creditCardDebtName?: string;
      total: number;
    };
    nonCurrent: {
      longTermDebt: number;
      deferredRevenue: number;
      deferredRevenueName?: string;
      leases: number;
      leasesName?: string;
      otherLiabilities: number;
      total: number;
    };
    total: number;
  };
  equity: {
    capitalInvestment: number;
    capitalInvestmentName?: string;
    ownerDraws: number;
    ownerDrawsName?: string;
    retainedEarnings: number;
    total: number;
  };
  currency: string;
};

export async function getBalanceSheet(
  db: Database,
  params: GetBalanceSheetParams,
): Promise<BalanceSheetResult> {
  const { teamId, currency: inputCurrency, asOf } = params;

  // Get target currency
  const targetCurrency = await getTargetCurrency(db, teamId, inputCurrency);
  const currency = targetCurrency || "USD";

  // Get asOf date (default to today)
  const asOfDate = asOf ? parseISO(asOf) : new UTCDate();
  const asOfDateStr = format(asOfDate, "yyyy-MM-dd");

  // Fetch all data in parallel
  const [
    accountBalanceData,
    outstandingInvoicesData,
    assetTransactions,
    fixedAssetTransactionsForDepreciation,
    liabilityTransactions,
    loanProceedsTransactions,
    equityTransactions,
    allRevenueTransactions,
    allExpenseTransactions,
    bankAccountsData,
    unmatchedBillsData,
  ] = await Promise.all([
    // 1. Bank account balances (Cash) - depository + other_asset accounts
    getCashBalance(db, {
      teamId,
      currency: inputCurrency,
    }),

    // 2. Unpaid invoices (Accounts Receivable) - fetch directly for currency conversion
    db
      .select({
        amount: invoices.amount,
        currency: invoices.currency,
      })
      .from(invoices)
      .where(
        and(
          eq(invoices.teamId, teamId),
          // Include unpaid and overdue invoices, plus scheduled invoices with issueDate on or before balance sheet date
          or(
            inArray(invoices.status, ["unpaid", "overdue"]),
            and(
              eq(invoices.status, "scheduled"),
              isNotNull(invoices.issueDate),
              lte(invoices.issueDate, asOfDateStr),
            ),
          )!,
        ),
      ),

    // 3. Asset transactions (prepaid expenses, fixed assets)
    db
      .select({
        categorySlug: transactions.categorySlug,
        categoryName: transactionCategories.name,
        amount:
          inputCurrency && targetCurrency
            ? sql<number>`COALESCE(SUM(
              CASE
                WHEN ${transactions.baseCurrency} = ${sql`${targetCurrency}`} AND ${transactions.baseAmount} IS NOT NULL THEN ${transactions.baseAmount}
                ELSE ${transactions.amount}
              END
            ), 0)`
            : sql<number>`COALESCE(SUM(COALESCE(${transactions.baseAmount}, 0)), 0)`,
      })
      .from(transactions)
      .leftJoin(
        transactionCategories,
        and(
          eq(transactionCategories.slug, transactions.categorySlug),
          eq(transactionCategories.teamId, teamId),
        ),
      )
      .where(
        and(
          eq(transactions.teamId, teamId),
          eq(transactions.internal, false),
          ne(transactions.status, "excluded"),
          lte(transactions.date, asOfDateStr),
          inArray(transactions.categorySlug, [
            "prepaid-expenses",
            "fixed-assets",
            "software",
            "inventory",
            "equipment",
          ]),
          or(
            isNull(transactionCategories.excluded),
            eq(transactionCategories.excluded, false),
          )!,
          inputCurrency && targetCurrency
            ? or(
                eq(transactions.currency, targetCurrency),
                eq(transactions.baseCurrency, targetCurrency),
              )!
            : targetCurrency
              ? and(
                  eq(transactions.baseCurrency, targetCurrency),
                  isNotNull(transactions.baseAmount),
                )
              : sql`true`,
        ),
      )
      .groupBy(transactions.categorySlug, transactionCategories.name),

    // 4. Liability transactions (loans, deferred revenue)
    db
      .select({
        categorySlug: transactions.categorySlug,
        categoryName: transactionCategories.name,
        amount:
          inputCurrency && targetCurrency
            ? sql<number>`COALESCE(SUM(
              CASE
                WHEN ${transactions.baseCurrency} = ${sql`${targetCurrency}`} AND ${transactions.baseAmount} IS NOT NULL THEN ${transactions.baseAmount}
                ELSE ${transactions.amount}
              END
            ), 0)`
            : sql<number>`COALESCE(SUM(COALESCE(${transactions.baseAmount}, 0)), 0)`,
      })
      .from(transactions)
      .leftJoin(
        transactionCategories,
        and(
          eq(transactionCategories.slug, transactions.categorySlug),
          eq(transactionCategories.teamId, teamId),
        ),
      )
      .where(
        and(
          eq(transactions.teamId, teamId),
          eq(transactions.internal, false),
          ne(transactions.status, "excluded"),
          lte(transactions.date, asOfDateStr),
          inArray(transactions.categorySlug, [
            "loan-proceeds",
            "loan-principal-repayment",
            "deferred-revenue",
            "leases",
          ]),
          or(
            isNull(transactionCategories.excluded),
            eq(transactionCategories.excluded, false),
          )!,
          inputCurrency && targetCurrency
            ? or(
                eq(transactions.currency, targetCurrency),
                eq(transactions.baseCurrency, targetCurrency),
              )!
            : targetCurrency
              ? and(
                  eq(transactions.baseCurrency, targetCurrency),
                  isNotNull(transactions.baseAmount),
                )
              : sql`true`,
        ),
      )
      .groupBy(transactions.categorySlug, transactionCategories.name),

    // 4b. Loan proceeds transactions with dates for short-term vs long-term classification
    db
      .select({
        amount:
          inputCurrency && targetCurrency
            ? sql<number>`ABS(
              CASE
                WHEN ${transactions.baseCurrency} = ${sql`${targetCurrency}`} AND ${transactions.baseAmount} IS NOT NULL THEN ${transactions.baseAmount}
                ELSE ${transactions.amount}
              END
            )`
            : sql<number>`ABS(COALESCE(${transactions.baseAmount}, ${transactions.amount}))`,
        date: sql<string>`${transactions.date}::text`,
      })
      .from(transactions)
      .leftJoin(
        transactionCategories,
        and(
          eq(transactionCategories.slug, transactions.categorySlug),
          eq(transactionCategories.teamId, teamId),
        ),
      )
      .where(
        and(
          eq(transactions.teamId, teamId),
          eq(transactions.internal, false),
          ne(transactions.status, "excluded"),
          lte(transactions.date, asOfDateStr),
          eq(transactions.categorySlug, "loan-proceeds"),
          or(
            isNull(transactionCategories.excluded),
            eq(transactionCategories.excluded, false),
          )!,
          inputCurrency && targetCurrency
            ? or(
                eq(transactions.currency, targetCurrency),
                eq(transactions.baseCurrency, targetCurrency),
              )!
            : targetCurrency
              ? eq(transactions.baseCurrency, targetCurrency)
              : sql`true`,
        ),
      ),

    // 3b. Fixed asset transactions with dates for depreciation calculation
    db
      .select({
        categorySlug: transactions.categorySlug,
        amount:
          inputCurrency && targetCurrency
            ? sql<number>`ABS(
              CASE
                WHEN ${transactions.baseCurrency} = ${sql`${targetCurrency}`} AND ${transactions.baseAmount} IS NOT NULL THEN ${transactions.baseAmount}
                ELSE ${transactions.amount}
              END
            )`
            : sql<number>`ABS(COALESCE(${transactions.baseAmount}, ${transactions.amount}))`,
        date: sql<string>`${transactions.date}::text`,
      })
      .from(transactions)
      .leftJoin(
        transactionCategories,
        and(
          eq(transactionCategories.slug, transactions.categorySlug),
          eq(transactionCategories.teamId, teamId),
        ),
      )
      .where(
        and(
          eq(transactions.teamId, teamId),
          eq(transactions.internal, false),
          ne(transactions.status, "excluded"),
          lte(transactions.date, asOfDateStr),
          inArray(transactions.categorySlug, [
            "fixed-assets",
            "equipment",
            "software",
          ]),
          or(
            isNull(transactionCategories.excluded),
            eq(transactionCategories.excluded, false),
          )!,
          inputCurrency && targetCurrency
            ? or(
                eq(transactions.currency, targetCurrency),
                eq(transactions.baseCurrency, targetCurrency),
              )!
            : targetCurrency
              ? eq(transactions.baseCurrency, targetCurrency)
              : sql`true`,
        ),
      ),

    // 5. Equity transactions (capital investment, owner draws)
    db
      .select({
        categorySlug: transactions.categorySlug,
        categoryName: transactionCategories.name,
        amount:
          inputCurrency && targetCurrency
            ? sql<number>`COALESCE(SUM(
              CASE
                WHEN ${transactions.baseCurrency} = ${sql`${targetCurrency}`} AND ${transactions.baseAmount} IS NOT NULL THEN ${transactions.baseAmount}
                ELSE ${transactions.amount}
              END
            ), 0)`
            : sql<number>`COALESCE(SUM(COALESCE(${transactions.baseAmount}, 0)), 0)`,
      })
      .from(transactions)
      .leftJoin(
        transactionCategories,
        and(
          eq(transactionCategories.slug, transactions.categorySlug),
          eq(transactionCategories.teamId, teamId),
        ),
      )
      .where(
        and(
          eq(transactions.teamId, teamId),
          eq(transactions.internal, false),
          ne(transactions.status, "excluded"),
          lte(transactions.date, asOfDateStr),
          inArray(transactions.categorySlug, [
            "capital-investment",
            "owner-draws",
          ]),
          or(
            isNull(transactionCategories.excluded),
            eq(transactionCategories.excluded, false),
          )!,
          inputCurrency && targetCurrency
            ? or(
                eq(transactions.currency, targetCurrency),
                eq(transactions.baseCurrency, targetCurrency),
              )!
            : targetCurrency
              ? and(
                  eq(transactions.baseCurrency, targetCurrency),
                  isNotNull(transactions.baseAmount),
                )
              : sql`true`,
        ),
      )
      .groupBy(transactions.categorySlug, transactionCategories.name),

    // 6. All revenue transactions (for retained earnings)
    db
      .select({
        amount:
          inputCurrency && targetCurrency
            ? sql<number>`COALESCE(SUM(
              CASE
                WHEN ${transactions.baseCurrency} = ${sql`${targetCurrency}`} AND ${transactions.baseAmount} IS NOT NULL THEN ${transactions.baseAmount}
                ELSE ${transactions.amount}
              END
            ), 0)`
            : sql<number>`COALESCE(SUM(COALESCE(${transactions.baseAmount}, 0)), 0)`,
      })
      .from(transactions)
      .leftJoin(
        transactionCategories,
        and(
          eq(transactionCategories.slug, transactions.categorySlug),
          eq(transactionCategories.teamId, teamId),
        ),
      )
      .where(
        and(
          eq(transactions.teamId, teamId),
          eq(transactions.internal, false),
          ne(transactions.status, "excluded"),
          lte(transactions.date, asOfDateStr),
          inArray(transactions.categorySlug, REVENUE_CATEGORIES),
          not(inArray(transactions.categorySlug, CONTRA_REVENUE_CATEGORIES)),
          // Amount condition: handle NULL baseAmount gracefully when inputCurrency is provided
          inputCurrency && targetCurrency
            ? sql`(CASE 
                WHEN ${transactions.baseCurrency} = ${sql`${targetCurrency}`} AND ${transactions.baseAmount} IS NOT NULL THEN ${transactions.baseAmount}
                ELSE ${transactions.amount}
              END > 0)`
            : gt(transactions.baseAmount, 0),
          // Category exclusion check: allow if category doesn't exist (NULL) or is not excluded
          or(
            isNull(transactionCategories.excluded),
            eq(transactionCategories.excluded, false),
          )!,
          inputCurrency && targetCurrency
            ? or(
                eq(transactions.currency, targetCurrency),
                eq(transactions.baseCurrency, targetCurrency),
              )!
            : targetCurrency
              ? eq(transactions.baseCurrency, targetCurrency)
              : sql`true`,
        ),
      ),

    // 7. All expense transactions (for retained earnings)
    // Exclude asset purchases (capital expenditures) - they don't reduce retained earnings
    db
      .select({
        amount:
          inputCurrency && targetCurrency
            ? sql<number>`COALESCE(SUM(ABS(
              CASE
                WHEN ${transactions.baseCurrency} = ${sql`${targetCurrency}`} AND ${transactions.baseAmount} IS NOT NULL THEN ${transactions.baseAmount}
                ELSE ${transactions.amount}
              END
            )), 0)`
            : sql<number>`COALESCE(SUM(ABS(COALESCE(${transactions.baseAmount}, 0))), 0)`,
      })
      .from(transactions)
      .leftJoin(
        transactionCategories,
        and(
          eq(transactionCategories.slug, transactions.categorySlug),
          eq(transactionCategories.teamId, teamId),
        ),
      )
      .where(
        and(
          eq(transactions.teamId, teamId),
          eq(transactions.internal, false),
          ne(transactions.status, "excluded"),
          lte(transactions.date, asOfDateStr),
          // Amount condition: handle NULL baseAmount gracefully when inputCurrency is provided
          inputCurrency && targetCurrency
            ? sql`(CASE 
                WHEN ${transactions.baseCurrency} = ${sql`${targetCurrency}`} AND ${transactions.baseAmount} IS NOT NULL THEN ${transactions.baseAmount}
                ELSE ${transactions.amount}
              END < 0)`
            : lt(transactions.baseAmount, 0),
          // Exclude asset categories - these are capital expenditures, not operating expenses
          or(
            isNull(transactions.categorySlug),
            sql`${transactions.categorySlug} NOT IN ('prepaid-expenses', 'fixed-assets', 'software', 'inventory', 'equipment')`,
          )!,
          or(
            isNull(transactionCategories.excluded),
            eq(transactionCategories.excluded, false),
          )!,
          inputCurrency && targetCurrency
            ? or(
                eq(transactions.currency, targetCurrency),
                eq(transactions.baseCurrency, targetCurrency),
              )!
            : targetCurrency
              ? eq(transactions.baseCurrency, targetCurrency)
              : sql`true`,
        ),
      ),

    // 8. Bank accounts data (for credit cards and loans)
    db.query.bankAccounts.findMany({
      where: and(
        eq(bankAccounts.teamId, teamId),
        eq(bankAccounts.enabled, true),
        or(eq(bankAccounts.type, "credit"), eq(bankAccounts.type, "loan")),
      ),
      columns: {
        id: true,
        name: true,
        currency: true,
        balance: true,
        baseCurrency: true,
        baseBalance: true,
        type: true,
      },
    }),

    // 9. Unmatched inbox items (bills/vendor invoices) for Accounts Payable
    // These are inbox items (both "invoice" and "expense" types) that haven't been matched to transactions yet
    // Note: Customer invoices are tracked separately in the invoices table, so unmatched inbox items
    // represent bills/vendor invoices we need to pay
    db
      .select({
        amount: inbox.amount,
        currency: inbox.currency,
        baseAmount: inbox.baseAmount,
        baseCurrency: inbox.baseCurrency,
      })
      .from(inbox)
      .where(
        and(
          eq(inbox.teamId, teamId),
          isNull(inbox.transactionId), // Not matched to a transaction yet
          isNotNull(inbox.amount), // Has an amount
          // Only include items that are not done/deleted (still pending payment)
          ne(inbox.status, "done"),
          ne(inbox.status, "deleted"),
          // Only include items dated on or before the balance sheet date
          lte(inbox.date, asOfDateStr),
        ),
      ),
  ]);

  // Process asset transactions and build category name maps
  // Note: Asset transactions are stored as negative (expenses), but on balance sheet they should be positive (assets owned)
  const assetMap = new Map<string, number>();
  const assetNameMap = new Map<string, string>();
  for (const item of assetTransactions) {
    const slug = item.categorySlug || "";
    // Take absolute value because assets should be positive on balance sheet
    assetMap.set(slug, Math.abs(Number(item.amount) || 0));
    if (item.categoryName) {
      assetNameMap.set(slug, item.categoryName);
    }
  }
  const prepaidExpenses: number = assetMap.get("prepaid-expenses") || 0;
  const fixedAssetsRaw: number = assetMap.get("fixed-assets") || 0;
  const equipment: number = assetMap.get("equipment") || 0;
  const fixedAssets: number = fixedAssetsRaw + equipment; // Combine fixed assets and equipment
  const softwareTechnology: number = assetMap.get("software") || 0;
  const inventory: number = assetMap.get("inventory") || 0;

  // Calculate accumulated depreciation based on asset age
  // Use straight-line depreciation with reasonable useful lives
  let accumulatedDepreciation = 0;
  // TypeScript inference issue - cast through unknown first
  const fixedAssetTransactionsList =
    fixedAssetTransactionsForDepreciation as unknown as Array<{
      categorySlug: string | null;
      amount: number;
      date: string;
    }>;

  for (const asset of fixedAssetTransactionsList) {
    const purchaseDate = parseISO(asset.date);
    const purchaseYear = purchaseDate.getFullYear();
    const purchaseMonth = purchaseDate.getMonth();
    const asOfYear = asOfDate.getFullYear();
    const asOfMonth = asOfDate.getMonth();

    // Calculate months since purchase
    const monthsSincePurchase =
      (asOfYear - purchaseYear) * 12 + (asOfMonth - purchaseMonth);

    if (monthsSincePurchase <= 0) continue; // Asset purchased after balance sheet date

    const assetAmount = Number(asset.amount) || 0;
    const category = asset.categorySlug || "";

    // Determine useful life based on asset type
    // Equipment/Fixed Assets: 5 years (60 months)
    // Software: 3 years (36 months)
    let usefulLifeMonths = 60; // Default for equipment/fixed assets
    if (category === "software") {
      usefulLifeMonths = 36; // 3 years for software
    }

    // Calculate depreciation: (months since purchase / useful life) * asset cost
    // Cap at 100% (fully depreciated)
    const depreciationPercentage = Math.min(
      monthsSincePurchase / usefulLifeMonths,
      1,
    );
    const depreciationAmount = assetAmount * depreciationPercentage;
    accumulatedDepreciation += depreciationAmount;
  }

  // Process liability transactions and build category name maps
  const liabilityMap = new Map<string, number>();
  const liabilityNameMap = new Map<string, string>();
  const liabilityTransactionsList = liabilityTransactions as unknown as Array<{
    categorySlug: string | null;
    categoryName: string | null;
    amount: number;
  }>;
  for (const item of liabilityTransactionsList) {
    const slug = item.categorySlug || "";
    liabilityMap.set(slug, Number(item.amount) || 0);
    if (item.categoryName) {
      liabilityNameMap.set(slug, item.categoryName);
    }
  }
  const loanProceeds: number = liabilityMap.get("loan-proceeds") || 0;
  const loanRepayments: number =
    liabilityMap.get("loan-principal-repayment") || 0;
  const deferredRevenue: number = liabilityMap.get("deferred-revenue") || 0;
  const leases: number = liabilityMap.get("leases") || 0;
  const leasesName: string = liabilityNameMap.get("leases") || "Leases";

  // Accrued expenses: Set to 0 since we cannot accurately determine unpaid expenses
  // from transaction data (all transactions come from banks and are already paid)
  const accruedExpenses: number = 0;
  const accruedExpensesName: string | undefined = undefined;

  // Calculate Accounts Payable from unmatched inbox items (bills/vendor invoices)
  let accountsPayable = 0;
  const billsData = unmatchedBillsData as Array<{
    amount: number | null;
    currency: string | null;
    baseAmount: number | null;
    baseCurrency: string | null;
  }>;

  // Collect unique currency pairs that need conversion
  const billsCurrencyPairs: Array<{ base: string; target: string }> = [];
  const billsNeedingConversion: Array<{
    amount: number;
    currency: string;
  }> = [];

  for (const bill of billsData) {
    // Bills are typically stored as positive amounts (money owed)
    // Accounts Payable should be positive (liability)
    // Prioritize using baseAmount/baseCurrency if available
    if (bill.baseAmount !== null && bill.baseCurrency !== null) {
      const baseAmountValue = Number(bill.baseAmount) || 0;
      if (bill.baseCurrency === currency) {
        // baseCurrency matches target currency - use baseAmount directly
        // Use Math.abs to ensure positive (defensive, bills should already be positive)
        accountsPayable += Math.abs(baseAmountValue);
      } else {
        // baseCurrency exists but doesn't match target - convert from baseCurrency
        billsNeedingConversion.push({
          amount: Math.abs(baseAmountValue),
          currency: bill.baseCurrency,
        });
        billsCurrencyPairs.push({ base: bill.baseCurrency, target: currency });
      }
    } else {
      // No baseAmount/baseCurrency - use amount/currency
      const amount = Number(bill.amount) || 0;
      const billCurrency = bill.currency || currency;

      if (billCurrency === currency) {
        // Already in target currency
        // Use Math.abs to ensure positive (defensive, bills should already be positive)
        accountsPayable += Math.abs(amount);
      } else {
        // Need currency conversion from original currency
        billsNeedingConversion.push({
          amount: Math.abs(amount),
          currency: billCurrency,
        });
        billsCurrencyPairs.push({ base: billCurrency, target: currency });
      }
    }
  }

  // Process equity transactions and build category name maps
  const equityMap = new Map<string, number>();
  const equityNameMap = new Map<string, string>();
  for (const item of equityTransactions) {
    const slug = item.categorySlug || "";
    equityMap.set(slug, Number(item.amount) || 0);
    if (item.categoryName) {
      equityNameMap.set(slug, item.categoryName);
    }
  }
  const capitalInvestment: number = equityMap.get("capital-investment") || 0;
  const ownerDrawsRaw: number = equityMap.get("owner-draws") || 0;
  const ownerDraws: number = Math.abs(ownerDrawsRaw); // Owner draws are negative, so we take absolute value

  // Calculate retained earnings (cumulative profit)
  const totalRevenue: number = Number(allRevenueTransactions[0]?.amount) || 0;
  const totalExpenses: number = Number(allExpenseTransactions[0]?.amount) || 0;
  const retainedEarnings: number = totalRevenue - totalExpenses;

  // Get cash from bank accounts (already converted to target currency)
  const cash: number = accountBalanceData.totalBalance;

  // Get accounts receivable from unpaid invoices with proper currency conversion
  let accountsReceivable = 0;
  const invoiceData = outstandingInvoicesData as Array<{
    amount: number;
    currency: string;
  }>;

  // Collect unique currency pairs that need conversion
  const invoiceCurrencyPairs: Array<{ base: string; target: string }> = [];
  const invoicesNeedingConversion: Array<{
    amount: number;
    currency: string;
  }> = [];

  for (const invoice of invoiceData) {
    const amount = Number(invoice.amount) || 0;
    const invoiceCurrency = invoice.currency || currency;

    if (invoiceCurrency === currency) {
      accountsReceivable += amount;
    } else {
      invoicesNeedingConversion.push({ amount, currency: invoiceCurrency });
      invoiceCurrencyPairs.push({ base: invoiceCurrency, target: currency });
    }
  }

  // Process bank accounts: credit cards, loans, other assets, and other liabilities
  let creditCardDebt = 0;
  let loanAccountDebt = 0;
  let otherAssets = 0;
  let otherLiabilities = 0;
  const bankAccountsList = bankAccountsData as Array<{
    id: string;
    name: string;
    currency: string;
    balance: number;
    baseCurrency: string | null;
    baseBalance: number | null;
    type: string;
  }>;

  // Collect currency pairs for accounts that need conversion (don't have baseBalance/baseCurrency)
  const accountCurrencyPairs: Array<{ base: string; target: string }> = [];
  const accountsNeedingConversion: Array<{
    balance: number;
    currency: string;
    type: string;
  }> = [];

  for (const account of bankAccountsList) {
    const balance = Number(account.balance) || 0;
    const accountCurrency = account.currency || currency;

    // Prioritize using baseBalance if available and matches target currency
    if (
      account.baseBalance !== null &&
      account.baseCurrency === currency &&
      accountCurrency !== currency
    ) {
      const convertedBalance = Number(account.baseBalance);
      if (account.type === "credit") {
        creditCardDebt += Math.abs(convertedBalance);
      } else if (account.type === "loan") {
        loanAccountDebt += Math.abs(convertedBalance);
      } else if (account.type === "other_asset") {
        otherAssets += Math.abs(convertedBalance);
      } else if (account.type === "other_liability") {
        otherLiabilities += Math.abs(convertedBalance);
      }
    } else if (accountCurrency === currency) {
      // Already in target currency
      if (account.type === "credit") {
        creditCardDebt += Math.abs(balance);
      } else if (account.type === "loan") {
        loanAccountDebt += Math.abs(balance);
      } else if (account.type === "other_asset") {
        otherAssets += Math.abs(balance);
      } else if (account.type === "other_liability") {
        otherLiabilities += Math.abs(balance);
      }
    } else {
      // Need conversion - collect for batch query
      accountsNeedingConversion.push({
        balance,
        currency: accountCurrency,
        type: account.type,
      });
      accountCurrencyPairs.push({ base: accountCurrency, target: currency });
    }
  }

  // Combine all currency pairs and fetch exchange rates in one batch query
  const allCurrencyPairs = [
    ...invoiceCurrencyPairs,
    ...accountCurrencyPairs,
    ...billsCurrencyPairs,
  ];
  const exchangeRateMap =
    allCurrencyPairs.length > 0
      ? await getExchangeRatesBatch(db, { pairs: allCurrencyPairs })
      : new Map<string, number>();

  // Convert invoices using batch-fetched rates
  for (const invoice of invoicesNeedingConversion) {
    const key = `${invoice.currency}-${currency}`;
    const rate = exchangeRateMap.get(key);
    if (rate) {
      const convertedAmount = invoice.amount * rate;
      accountsReceivable += convertedAmount;
    }
    // Skip invoices with missing exchange rates to avoid mixing currencies
    // This prevents silently producing incorrect totals
  }

  // Convert bills using batch-fetched rates
  for (const bill of billsNeedingConversion) {
    const key = `${bill.currency}-${currency}`;
    const rate = exchangeRateMap.get(key);
    if (rate) {
      const convertedAmount = bill.amount * rate;
      accountsPayable += convertedAmount;
    }
    // Skip bills with missing exchange rates to avoid mixing currencies
    // This prevents silently producing incorrect totals
  }

  // Convert accounts using batch-fetched rates
  for (const account of accountsNeedingConversion) {
    const key = `${account.currency}-${currency}`;
    const rate = exchangeRateMap.get(key);
    if (rate) {
      const convertedBalance = account.balance * rate;

      if (account.type === "credit") {
        // Credit card balances are negative (debt owed), so we take absolute value
        creditCardDebt += Math.abs(convertedBalance);
      } else if (account.type === "loan") {
        // Loan account balances are typically positive (amount owed)
        loanAccountDebt += Math.abs(convertedBalance);
      } else if (account.type === "other_asset") {
        otherAssets += Math.abs(convertedBalance);
      } else if (account.type === "other_liability") {
        otherLiabilities += Math.abs(convertedBalance);
      }
    }
    // Skip accounts with missing exchange rates to avoid mixing currencies
    // This prevents silently producing incorrect totals
  }

  // Classify debt as short-term vs long-term based on loan age
  // Loans taken within last 12 months are considered short-term
  // Older loans and loan account balances without transaction history are long-term
  let shortTermLoanAmount = 0;
  let longTermLoanAmount = 0;

  const loanProceedsList = loanProceedsTransactions as unknown as Array<{
    amount: number;
    date: string;
  }>;

  // Calculate date 12 months ago for threshold
  const twelveMonthsAgo = new UTCDate(asOfDate);
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

  for (const loan of loanProceedsList) {
    const loanDate = parseISO(loan.date);
    const loanAmount = Number(loan.amount) || 0;

    if (loanDate >= twelveMonthsAgo) {
      // Loan taken within last 12 months = short-term
      shortTermLoanAmount += loanAmount;
    } else {
      // Older loan = long-term
      longTermLoanAmount += loanAmount;
    }
  }

  // Apply repayments proportionally to short-term and long-term debt
  // If we have both types, repayments reduce proportionally
  const totalLoanProceeds = loanProceeds || 1; // Avoid division by zero
  const shortTermProportion =
    totalLoanProceeds > 0 ? shortTermLoanAmount / totalLoanProceeds : 0;
  const longTermProportion =
    totalLoanProceeds > 0 ? longTermLoanAmount / totalLoanProceeds : 0;

  // Apply repayments proportionally
  const shortTermAfterRepayments = Math.max(
    0,
    shortTermLoanAmount - loanRepayments * shortTermProportion,
  );
  const longTermAfterRepayments = Math.max(
    0,
    longTermLoanAmount - loanRepayments * longTermProportion,
  );

  // Add loan account balances to long-term (conservative - account balances without transaction history)
  const longTermDebt: number = Math.max(
    0,
    longTermAfterRepayments + loanAccountDebt,
  );
  const shortTermDebt: number = Math.max(0, shortTermAfterRepayments);

  // Calculate totals
  const currentAssetsTotal =
    cash + accountsReceivable + inventory + prepaidExpenses;
  const nonCurrentAssetsTotal =
    fixedAssets - accumulatedDepreciation + softwareTechnology + otherAssets;
  const totalAssets = currentAssetsTotal + nonCurrentAssetsTotal;

  const currentLiabilitiesTotal =
    accountsPayable + accruedExpenses + shortTermDebt + creditCardDebt;
  const nonCurrentLiabilitiesTotal =
    longTermDebt + deferredRevenue + leases + otherLiabilities;
  const totalLiabilities = currentLiabilitiesTotal + nonCurrentLiabilitiesTotal;

  const equityTotal = capitalInvestment - ownerDraws + retainedEarnings;
  const totalLiabilitiesAndEquity = totalLiabilities + equityTotal;

  // Balance sheet equation validation: Assets must equal Liabilities + Equity
  const balanceDifference = totalAssets - totalLiabilitiesAndEquity;
  if (Math.abs(balanceDifference) > 0.01) {
    // Adjust retained earnings to balance (common practice for rounding differences)
    // If assets > liabilities+equity, we need to INCREASE retained earnings (add the difference)
    // If assets < liabilities+equity, we need to DECREASE retained earnings (subtract the difference)
    const adjustedRetainedEarnings = retainedEarnings + balanceDifference;
    // Update equity total with adjusted retained earnings
    const adjustedEquityTotal =
      capitalInvestment - ownerDraws + adjustedRetainedEarnings;
    const _adjustedTotalLiabilitiesAndEquity =
      totalLiabilities + adjustedEquityTotal;

    return {
      assets: {
        current: {
          cash: Math.round(cash * 100) / 100,
          accountsReceivable: Math.round(accountsReceivable * 100) / 100,
          inventory: Math.round(inventory * 100) / 100,
          inventoryName: assetNameMap.get("inventory"),
          prepaidExpenses: Math.round(prepaidExpenses * 100) / 100,
          prepaidExpensesName: assetNameMap.get("prepaid-expenses"),
          total: Math.round(currentAssetsTotal * 100) / 100,
        },
        nonCurrent: {
          fixedAssets: Math.round(fixedAssets * 100) / 100,
          fixedAssetsName: assetNameMap.get("fixed-assets"),
          accumulatedDepreciation:
            Math.round(accumulatedDepreciation * 100) / 100,
          softwareTechnology: Math.round(softwareTechnology * 100) / 100,
          softwareTechnologyName: assetNameMap.get("software"),
          longTermInvestments: 0,
          longTermInvestmentsName: assetNameMap.get("long-term-investments"),
          otherAssets: Math.round(otherAssets * 100) / 100,
          total: Math.round(nonCurrentAssetsTotal * 100) / 100,
        },
        total: Math.round(totalAssets * 100) / 100,
      },
      liabilities: {
        current: {
          accountsPayable: Math.round(accountsPayable * 100) / 100,
          accruedExpenses: Math.round(accruedExpenses * 100) / 100,
          accruedExpensesName,
          shortTermDebt: Math.round(shortTermDebt * 100) / 100,
          creditCardDebt: Math.round(creditCardDebt * 100) / 100,
          creditCardDebtName: "Credit Card Debt",
          total: Math.round(currentLiabilitiesTotal * 100) / 100,
        },
        nonCurrent: {
          longTermDebt: Math.round(longTermDebt * 100) / 100,
          deferredRevenue: Math.round(deferredRevenue * 100) / 100,
          deferredRevenueName: liabilityNameMap.get("deferred-revenue"),
          leases: Math.round(leases * 100) / 100,
          leasesName,
          otherLiabilities: Math.round(otherLiabilities * 100) / 100,
          total: Math.round(nonCurrentLiabilitiesTotal * 100) / 100,
        },
        total: Math.round(totalLiabilities * 100) / 100,
      },
      equity: {
        capitalInvestment: Math.round(capitalInvestment * 100) / 100,
        capitalInvestmentName: equityNameMap.get("capital-investment"),
        ownerDraws: Math.round(ownerDraws * 100) / 100,
        ownerDrawsName: equityNameMap.get("owner-draws"),
        retainedEarnings: Math.round(adjustedRetainedEarnings * 100) / 100,
        total: Math.round(adjustedEquityTotal * 100) / 100,
      },
      currency,
    };
  }

  return {
    assets: {
      current: {
        cash: Math.round(cash * 100) / 100,
        accountsReceivable: Math.round(accountsReceivable * 100) / 100,
        inventory: Math.round(inventory * 100) / 100,
        inventoryName: assetNameMap.get("inventory"),
        prepaidExpenses: Math.round(prepaidExpenses * 100) / 100,
        prepaidExpensesName: assetNameMap.get("prepaid-expenses"),
        total: Math.round(currentAssetsTotal * 100) / 100,
      },
      nonCurrent: {
        fixedAssets: Math.round(fixedAssets * 100) / 100,
        fixedAssetsName: assetNameMap.get("fixed-assets"),
        accumulatedDepreciation: 0,
        softwareTechnology: Math.round(softwareTechnology * 100) / 100,
        softwareTechnologyName: assetNameMap.get("software"),
        longTermInvestments: 0,
        longTermInvestmentsName: assetNameMap.get("long-term-investments"),
        otherAssets: Math.round(otherAssets * 100) / 100,
        total: Math.round(nonCurrentAssetsTotal * 100) / 100,
      },
      total: Math.round(totalAssets * 100) / 100,
    },
    liabilities: {
      current: {
        accountsPayable: Math.round(accountsPayable * 100) / 100,
        accruedExpenses: Math.round(accruedExpenses * 100) / 100,
        accruedExpensesName,
        shortTermDebt: Math.round(shortTermDebt * 100) / 100,
        creditCardDebt: Math.round(creditCardDebt * 100) / 100,
        creditCardDebtName: "Credit Card Debt",
        total: Math.round(currentLiabilitiesTotal * 100) / 100,
      },
      nonCurrent: {
        longTermDebt: Math.round(longTermDebt * 100) / 100,
        deferredRevenue: Math.round(deferredRevenue * 100) / 100,
        deferredRevenueName: liabilityNameMap.get("deferred-revenue"),
        leases: Math.round(leases * 100) / 100,
        leasesName,
        otherLiabilities: Math.round(otherLiabilities * 100) / 100,
        total: Math.round(nonCurrentLiabilitiesTotal * 100) / 100,
      },
      total: Math.round(totalLiabilities * 100) / 100,
    },
    equity: {
      capitalInvestment: Math.round(capitalInvestment * 100) / 100,
      capitalInvestmentName: equityNameMap.get("capital-investment"),
      ownerDraws: Math.round(ownerDraws * 100) / 100,
      ownerDrawsName: equityNameMap.get("owner-draws"),
      retainedEarnings: Math.round(retainedEarnings * 100) / 100,
      total: Math.round(equityTotal * 100) / 100,
    },
    currency,
  };
}

// Report Types for shareable metrics
export type ReportType =
  | "profit"
  | "revenue"
  | "burn_rate"
  | "expense"
  | "monthly_revenue"
  | "revenue_forecast"
  | "runway"
  | "category_expenses";

export type CreateReportParams = {
  type: ReportType;
  from: string;
  to: string;
  currency?: string;
  teamId: string;
  createdBy: string;
  expireAt?: string;
};

export async function createReport(db: Database, params: CreateReportParams) {
  const { type, from, to, currency, teamId, createdBy, expireAt } = params;
  const linkId = nanoid(8);

  const [result] = await db
    .insert(reports)
    .values({
      linkId,
      type,
      from,
      to,
      currency,
      teamId,
      createdBy,
      expireAt,
    })
    .returning({
      id: reports.id,
      linkId: reports.linkId,
      type: reports.type,
      from: reports.from,
      to: reports.to,
      currency: reports.currency,
      createdAt: reports.createdAt,
      expireAt: reports.expireAt,
    });

  return result;
}

export async function getReportByLinkId(db: Database, linkId: string) {
  const [result] = await db
    .select({
      id: reports.id,
      linkId: reports.linkId,
      type: reports.type,
      from: reports.from,
      to: reports.to,
      currency: reports.currency,
      teamId: reports.teamId,
      createdAt: reports.createdAt,
      expireAt: reports.expireAt,
      teamName: teams.name,
      teamLogoUrl: teams.logoUrl,
    })
    .from(reports)
    .leftJoin(teams, eq(reports.teamId, teams.id))
    .where(eq(reports.linkId, linkId))
    .limit(1);

  return result;
}

export async function getChartDataByLinkId(db: Database, linkId: string) {
  // First, validate the linkId and get the report
  const report = await getReportByLinkId(db, linkId);

  if (!report) {
    throw new ReportNotFoundError();
  }

  // Check if report has expired
  if (report.expireAt && new Date(report.expireAt) < new Date()) {
    throw new ReportExpiredError();
  }

  const teamId = report.teamId!;
  const from = report.from!;
  const to = report.to!;
  const currency = report.currency || "USD";
  const type = report.type!;

  // Fetch chart data based on report type
  switch (type) {
    case "burn_rate":
      return {
        type: "burn_rate" as const,
        data: await getBurnRate(db, { teamId, from, to, currency }),
      };
    case "monthly_revenue":
    case "revenue":
      return {
        type: "revenue" as const,
        data: await getReports(db, {
          teamId,
          from,
          to,
          currency,
          type: "revenue",
          revenueType: "net",
        }),
      };
    case "profit":
      return {
        type: "profit" as const,
        data: await getReports(db, {
          teamId,
          from,
          to,
          currency,
          type: "profit",
          revenueType: "net",
        }),
      };
    case "expense":
      return {
        type: "expense" as const,
        data: await getExpenses(db, { teamId, from, to, currency }),
      };
    case "revenue_forecast":
      return {
        type: "revenue_forecast" as const,
        data: await getRevenueForecast(db, {
          teamId,
          from,
          to,
          forecastMonths: 6,
          currency,
          revenueType: "net",
        }),
      };
    case "runway": {
      // Use the same fixed 6-month trailing window that getRunway uses
      // internally so the burn-rate average and runway number are consistent.
      const burnRateToDate = endOfMonth(new UTCDate());
      const burnRateFromDate = startOfMonth(subMonths(burnRateToDate, 5));
      const burnRateFrom = format(burnRateFromDate, "yyyy-MM-dd");
      const burnRateTo = format(burnRateToDate, "yyyy-MM-dd");

      const [runwayData, burnRateData] = await Promise.all([
        getRunway(db, {
          teamId,
          currency,
        }),
        getBurnRate(db, {
          teamId,
          from: burnRateFrom,
          to: burnRateTo,
          currency,
        }),
      ]);
      return {
        type: "runway" as const,
        data: {
          runway: runwayData,
          burnRate: burnRateData,
        },
      };
    }
    case "category_expenses":
      return {
        type: "category_expenses" as const,
        data: await getSpending(db, { teamId, from, to, currency }),
      };
    default:
      throw new InvalidReportTypeError();
  }
}
