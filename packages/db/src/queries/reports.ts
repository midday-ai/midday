import { UTCDate } from "@date-fns/utc";
import type { Database } from "@db/client";
import {
  eachMonthOfInterval,
  endOfMonth,
  format,
  parseISO,
  startOfMonth,
  subYears,
} from "date-fns";
import {
  and,
  eq,
  gte,
  inArray,
  isNotNull,
  isNull,
  lt,
  lte,
  ne,
  or,
  sql,
} from "drizzle-orm";
import {
  bankAccounts,
  invoices,
  teams,
  trackerEntries,
  trackerProjects,
  transactionCategories,
  transactions,
} from "../schema";
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
};

interface ReportsResultItem {
  value: string;
  date: string;
  currency: string;
}

// Helper function for profit calculation
export async function getProfit(db: Database, params: GetReportsParams) {
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
  ];

  // Add currency conditions
  if (inputCurrency && targetCurrency) {
    conditions.push(eq(transactions.currency, targetCurrency));
  } else if (targetCurrency) {
    conditions.push(eq(transactions.baseCurrency, targetCurrency));
  }

  // Step 4: Execute the aggregated query
  const monthlyData = await db
    .select({
      month: sql<string>`DATE_TRUNC('month', ${transactions.date})::date`,
      value: sql<number>`COALESCE(SUM(
${
  inputCurrency
    ? transactions.amount
    : sql`COALESCE(${transactions.baseAmount}, 0)`
}
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
  const dataMap = new Map(monthlyData.map((item) => [item.month, item.value]));

  // Step 6: Generate complete results (optimized)
  const currencyStr = targetCurrency || "USD";
  const results: ReportsResultItem[] = monthSeries.map((monthStart) => {
    const monthKey = format(monthStart, "yyyy-MM-dd");
    const value = dataMap.get(monthKey) || 0;

    return {
      date: monthKey,
      value: value.toString(),
      currency: currencyStr, // Avoid repeated string operations
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
  } = params;

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
    eq(transactions.categorySlug, "income"),
    ne(transactions.status, "excluded"),
    gte(transactions.date, format(fromDate, "yyyy-MM-dd")),
    lte(transactions.date, format(toDate, "yyyy-MM-dd")),
  ];

  // Add currency conditions
  if (inputCurrency && targetCurrency) {
    conditions.push(eq(transactions.currency, targetCurrency));
  } else if (targetCurrency) {
    conditions.push(eq(transactions.baseCurrency, targetCurrency));
  }

  // Step 4: Execute the aggregated query with gross/net calculation
  const tc = transactionCategories;
  const monthlyData = await db
    .select({
      month: sql<string>`DATE_TRUNC('month', ${transactions.date})::date`,
      value:
        revenueType === "net"
          ? inputCurrency
            ? sql<number>`COALESCE(SUM(
                ${transactions.amount} - (
                  ${transactions.amount} * COALESCE(${transactions.taxRate}, ${tc.taxRate}, 0) / 
                  (100 + COALESCE(${transactions.taxRate}, ${tc.taxRate}, 0))
                )
              ), 0)`
            : sql<number>`COALESCE(SUM(
                COALESCE(${transactions.baseAmount}, 0) - (
                  COALESCE(${transactions.baseAmount}, 0) * COALESCE(${transactions.taxRate}, ${tc.taxRate}, 0) / 
                  (100 + COALESCE(${transactions.taxRate}, ${tc.taxRate}, 0))
                )
              ), 0)`
          : inputCurrency
            ? sql<number>`COALESCE(SUM(${transactions.amount}), 0)`
            : sql<number>`COALESCE(SUM(COALESCE(${transactions.baseAmount}, 0)), 0)`,
    })
    .from(transactions)
    .leftJoin(
      tc,
      and(eq(tc.slug, transactions.categorySlug), eq(tc.teamId, teamId)),
    )
    .where(and(...conditions, or(isNull(tc.excluded), eq(tc.excluded, false))!))
    .groupBy(sql`DATE_TRUNC('month', ${transactions.date})`)
    .orderBy(sql`DATE_TRUNC('month', ${transactions.date}) ASC`);

  // Step 5: Create a map of month data for quick lookup
  const dataMap = new Map(monthlyData.map((item) => [item.month, item.value]));

  // Step 6: Generate complete results (optimized)
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
};

interface ExpensesResultItem {
  value: string;
  date: string;
  currency: string;
  recurring_value?: number;
}

export async function getExpenses(db: Database, params: GetExpensesParams) {
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
    ne(transactions.status, "excluded"),
    eq(transactions.internal, false),
    gte(transactions.date, format(fromDate, "yyyy-MM-dd")),
    lte(transactions.date, format(toDate, "yyyy-MM-dd")),
  ];

  // Add currency and amount conditions
  if (inputCurrency && targetCurrency) {
    conditions.push(
      and(
        eq(transactions.currency, targetCurrency),
        lt(transactions.amount, 0),
      )!,
    );
  } else if (targetCurrency) {
    conditions.push(
      and(
        eq(transactions.baseCurrency, targetCurrency),
        lt(transactions.baseAmount, 0),
      )!,
    );
  }

  // Step 4: Execute the aggregated query
  const monthlyData = await db
    .select({
      month: sql<string>`DATE_TRUNC('month', ${transactions.date})::date`,
      value: inputCurrency
        ? sql<number>`COALESCE(SUM(
            CASE
              WHEN (${transactions.recurring} = false OR ${transactions.recurring} IS NULL) THEN ABS(${transactions.amount})
              ELSE 0
            END
          ), 0)`
        : sql<number>`COALESCE(SUM(
            CASE
              WHEN (${transactions.recurring} = false OR ${transactions.recurring} IS NULL) THEN ABS(COALESCE(${transactions.baseAmount}, 0))
              ELSE 0
            END
          ), 0)`,
      recurringValue: inputCurrency
        ? sql<number>`COALESCE(SUM(
            CASE
              WHEN ${transactions.recurring} = true THEN ABS(${transactions.amount})
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
    gte(transactions.date, format(fromDate, "yyyy-MM-dd")),
    lte(transactions.date, format(toDate, "yyyy-MM-dd")),
    lt(transactions.baseAmount, 0),
  ];

  if (targetCurrency) {
    totalAmountConditions.push(
      or(
        eq(transactions.baseCurrency, targetCurrency),
        eq(transactions.currency, targetCurrency),
      )!,
    );
  }

  const totalAmountResult = await db
    .select({
      total: sql<number>`SUM(${
        inputCurrency
          ? transactions.amount
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
    gte(transactions.date, format(fromDate, "yyyy-MM-dd")),
    lte(transactions.date, format(toDate, "yyyy-MM-dd")),
    lt(transactions.baseAmount, 0),
    isNotNull(transactions.categorySlug), // Only categorized transactions
  ];

  if (targetCurrency) {
    spendingConditions.push(
      or(
        eq(transactions.baseCurrency, targetCurrency),
        eq(transactions.currency, targetCurrency),
      )!,
    );
  }

  // Single query replaces N queries (where N = number of categories)
  const categorySpending = await db
    .select({
      name: transactionCategories.name,
      slug: transactionCategories.slug,
      color: transactionCategories.color,
      amount: sql<number>`ABS(SUM(${
        inputCurrency
          ? transactions.amount
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
        inputCurrency
          ? transactions.amount
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
    gte(transactions.date, format(fromDate, "yyyy-MM-dd")),
    lte(transactions.date, format(toDate, "yyyy-MM-dd")),
    lt(transactions.baseAmount, 0),
    or(
      isNull(transactions.categorySlug),
      sql`NOT EXISTS (
        SELECT 1 FROM ${transactionCategories} tc 
        WHERE tc.slug = ${transactions.categorySlug} 
        AND tc.team_id = ${teamId}
      )`,
    )!,
  ];

  if (targetCurrency) {
    uncategorizedConditions.push(
      or(
        eq(transactions.baseCurrency, targetCurrency),
        eq(transactions.currency, targetCurrency),
      )!,
    );
  }

  const uncategorizedResult = await db
    .select({
      amount: sql<number>`SUM(${
        inputCurrency
          ? transactions.amount
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
  from: string;
  to: string;
  currency?: string;
};

export async function getRunway(db: Database, params: GetRunwayParams) {
  const { teamId, from, to, currency: inputCurrency } = params;

  const fromDate = startOfMonth(new UTCDate(parseISO(from)));
  const toDate = endOfMonth(new UTCDate(parseISO(to)));

  // Step 1: Get the target currency (cached)
  const targetCurrency = await getTargetCurrency(db, teamId, inputCurrency);

  if (!targetCurrency) {
    return 0;
  }

  // Step 2: Get total balance (equivalent to get_total_balance_v3)
  const balanceConditions = [
    eq(bankAccounts.teamId, teamId),
    eq(bankAccounts.enabled, true),
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

  // Step 3: Calculate number of months in the date range
  const fromYear = fromDate.getFullYear();
  const fromMonth = fromDate.getMonth();
  const toYear = toDate.getFullYear();
  const toMonth = toDate.getMonth();

  const numberOfMonths = (toYear - fromYear) * 12 + (toMonth - fromMonth);

  if (numberOfMonths <= 0) {
    return 0;
  }

  // Step 4: Get burn rate data using our existing getBurnRate function
  const burnRateData = await getBurnRate(db, {
    teamId,
    from,
    to,
    currency: inputCurrency,
  });

  // Step 5: Calculate average burn rate
  if (burnRateData.length === 0) {
    return 0;
  }

  const totalBurnRate = burnRateData.reduce((sum, item) => sum + item.value, 0);
  const avgBurnRate = Math.round(totalBurnRate / burnRateData.length);

  // Step 6: Calculate runway
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
};

export async function getSpendingForPeriod(
  db: Database,
  params: GetSpendingForPeriodParams,
) {
  const { teamId, from, to, currency: inputCurrency } = params;

  // Use existing getExpenses function for the specified period
  const expensesData = await getExpenses(db, {
    teamId,
    from,
    to,
    currency: inputCurrency,
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
    sql`t.date >= ${fromDate}`,
    sql`t.date <= ${toDate}`,
  ];

  // Add amount condition based on type (paid < 0, collected > 0)
  if (type === "paid") {
    conditions.push(sql`t.amount < 0`);
  } else {
    conditions.push(sql`t.amount > 0`);
  }

  // Add optional filters
  if (categorySlug) {
    conditions.push(sql`tc.slug = ${categorySlug}`);
  }

  if (taxType) {
    conditions.push(sql`(COALESCE(t.vat_type, tc.vat_type) = ${taxType})`);
  }

  if (inputCurrency) {
    conditions.push(sql`t.currency = ${inputCurrency}`);
  }

  // Add condition to only include transactions with tax rates
  conditions.push(sql`(t.tax_rate IS NOT NULL OR tc.tax_rate IS NOT NULL)`);

  const whereClause = sql.join(conditions, sql` AND `);

  const query = sql`
    SELECT 
      COALESCE(tc.slug, 'uncategorized') as category_slug,
      COALESCE(tc.name, 'Uncategorized') as category_name,
      SUM(t.amount * COALESCE(t.tax_rate, tc.tax_rate, 0) / (100 + COALESCE(t.tax_rate, tc.tax_rate, 0)))::text as total_tax_amount,
      SUM(t.amount)::text as total_transaction_amount,
      COUNT(t.id) as transaction_count,
      AVG(COALESCE(t.tax_rate, tc.tax_rate))::text as avg_tax_rate,
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
    ORDER BY ABS(SUM(t.amount * COALESCE(t.tax_rate, tc.tax_rate, 0) / (100 + COALESCE(t.tax_rate, tc.tax_rate, 0)))) DESC
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

  const fromDate = startOfMonth(new UTCDate(parseISO(from)));
  const toDate = endOfMonth(new UTCDate(parseISO(to)));

  // Get target currency
  const targetCurrency = await getTargetCurrency(db, teamId, inputCurrency);

  // Get revenue and profit data in parallel
  const [revenueData, profitData] = await Promise.all([
    getRevenue(db, {
      teamId,
      from,
      to,
      currency: inputCurrency,
      revenueType,
    }),
    getProfit(db, {
      teamId,
      from,
      to,
      currency: inputCurrency,
      revenueType,
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
};

export async function getCashFlow(db: Database, params: GetCashFlowParams) {
  const {
    teamId,
    from,
    to,
    currency: inputCurrency,
    period = "monthly",
  } = params;

  const fromDate = startOfMonth(new UTCDate(parseISO(from)));
  const toDate = endOfMonth(new UTCDate(parseISO(to)));

  // Get target currency
  const targetCurrency = await getTargetCurrency(db, teamId, inputCurrency);

  // Build query conditions
  const conditions = [
    eq(transactions.teamId, teamId),
    eq(transactions.internal, false),
    ne(transactions.status, "excluded"),
    gte(transactions.date, format(fromDate, "yyyy-MM-dd")),
    lte(transactions.date, format(toDate, "yyyy-MM-dd")),
  ];

  // Add currency conditions
  if (inputCurrency && targetCurrency) {
    conditions.push(eq(transactions.currency, targetCurrency));
  } else if (targetCurrency) {
    conditions.push(eq(transactions.baseCurrency, targetCurrency));
  }

  // Get all transactions with category exclusion
  const result = await db
    .select({
      totalAmount: inputCurrency
        ? sql<number>`COALESCE(SUM(${transactions.amount}), 0)`
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
        ...conditions,
        // Exclude transactions in excluded categories
        or(
          isNull(transactions.categorySlug),
          isNull(transactionCategories.excluded),
          eq(transactionCategories.excluded, false),
        )!,
      ),
    );

  const netCashFlow = Number(result[0]?.totalAmount || 0);

  return {
    summary: {
      netCashFlow: Number(netCashFlow.toFixed(2)),
      currency: targetCurrency || "USD",
      period,
    },
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
    const dueDate = new Date(oldestDueDate);
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
    lt(transactions.baseAmount, 0), // Expenses only
  ];

  // Filter by date range if provided
  if (from) {
    conditions.push(gte(transactions.date, from));
  }
  if (to) {
    conditions.push(lte(transactions.date, to));
  }

  if (targetCurrency) {
    conditions.push(
      or(
        eq(transactions.baseCurrency, targetCurrency),
        eq(transactions.currency, targetCurrency),
      )!,
    );
  }

  // Get all recurring expenses grouped by name and frequency
  const recurringExpenses = await db
    .select({
      name: transactions.name,
      frequency: transactions.frequency,
      categoryName: transactionCategories.name,
      categorySlug: transactionCategories.slug,
      amount: sql<number>`AVG(ABS(${
        inputCurrency
          ? transactions.amount
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
    .where(and(...conditions))
    .groupBy(
      transactions.name,
      transactions.frequency,
      transactionCategories.name,
      transactionCategories.slug,
    )
    .orderBy(
      sql`AVG(ABS(${
        inputCurrency
          ? transactions.amount
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

  // Fetch all required data in parallel for better performance
  const [historicalData, outstandingInvoicesData, billableHoursData] =
    await Promise.all([
      // Historical revenue data
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
    ]);

  // Convert to numbers - keep ALL months including zero revenue
  const historical = historicalData.map((item: ReportsResultItem) => ({
    date: item.date,
    value: Number.parseFloat(item.value),
    currency: item.currency,
  }));

  const currency = historical[0]?.currency || inputCurrency || "USD";

  // Need at least 3 months of data for meaningful forecast
  if (historical.length < 3) {
    // Not enough data - use simple average or last value
    const recentValues = historical.slice(-3);
    const avgValue =
      recentValues.reduce((sum, item) => sum + item.value, 0) /
      recentValues.length;
    const lastActualValue =
      historical[historical.length - 1]?.value ?? avgValue;

    const forecast: ForecastDataPoint[] = [];
    const currentDate = new UTCDate(parseISO(to));

    for (let i = 1; i <= forecastMonths; i++) {
      const forecastDate = endOfMonth(
        new UTCDate(currentDate.getFullYear(), currentDate.getMonth() + i, 1),
      );
      forecast.push({
        date: format(forecastDate, "yyyy-MM-dd"),
        value: Math.max(0, Number(lastActualValue.toFixed(2))),
        currency,
        type: "forecast",
      });
    }

    const combinedData: ForecastDataPoint[] = [
      ...historical.map((item: (typeof historical)[number]) => ({
        ...item,
        type: "actual" as const,
      })),
      ...forecast,
    ];

    return {
      summary: {
        nextMonthProjection: forecast[0]?.value || 0,
        avgMonthlyGrowthRate: 0,
        totalProjectedRevenue: Number(
          (forecast.reduce((sum, item) => sum + item.value, 0) ?? 0).toFixed(2),
        ),
        peakMonth: {
          date: forecast[0]?.date || "",
          value: forecast[0]?.value || 0,
        },
        currency,
        revenueType,
        forecastStartDate: forecast[0]?.date,
        unpaidInvoices: {
          count: outstandingInvoicesData.summary.count,
          totalAmount: outstandingInvoicesData.summary.totalAmount,
          currency: outstandingInvoicesData.summary.currency,
        },
        billableHours: {
          totalHours: Math.round(billableHoursData.totalDuration / 3600),
          totalAmount: Number(billableHoursData.totalAmount.toFixed(2)),
          currency: billableHoursData.currency,
        },
      },
      historical: historical.map((item: (typeof historical)[number]) => ({
        date: item.date,
        value: item.value,
        currency: item.currency,
      })),
      forecast: forecast.map((item: ForecastDataPoint) => ({
        date: item.date,
        value: item.value,
        currency: item.currency,
      })),
      combined: combinedData,
      meta: {
        historicalMonths: historical.length,
        forecastMonths,
        avgGrowthRate: 0,
        basedOnMonths: historical.length,
        currency,
        includesUnpaidInvoices: outstandingInvoicesData.summary.count > 0,
        includesBillableHours:
          Math.round(billableHoursData.totalDuration / 3600) > 0,
      },
    };
  }

  // Step 1: Detect and remove outliers using IQR method
  const values = historical.map((item) => item.value);
  const sortedValues = [...values].sort((a, b) => a - b);
  const q1 = sortedValues[Math.floor(sortedValues.length * 0.25)] || 0;
  const q3 = sortedValues[Math.floor(sortedValues.length * 0.75)] || 0;
  const iqr = q3 - q1;
  const lowerBound = q1 - 1.5 * iqr;
  const upperBound = q3 + 1.5 * iqr;

  // Filter outliers but keep at least last 3 months for trend
  const cleanedData = historical.map((item, index) => {
    const isOutlier = item.value < lowerBound || item.value > upperBound;
    const isRecent = index >= historical.length - 3;
    return {
      ...item,
      isOutlier: isOutlier && !isRecent,
    };
  });

  // Step 2: Calculate growth rates with exponential weighting (recent = more important)
  const growthRates: Array<{ rate: number; weight: number }> = [];

  for (let i = 1; i < cleanedData.length; i++) {
    const prev = cleanedData[i - 1];
    const curr = cleanedData[i];

    // Skip if either value is an outlier or if previous value is zero
    if (
      !prev ||
      !curr ||
      prev.isOutlier ||
      curr.isOutlier ||
      prev.value === 0
    ) {
      continue;
    }

    const rate = (curr.value - prev.value) / prev.value;

    // Exponential weight: recent months matter more (alpha = 0.3)
    const recencyWeight = Math.exp(-0.3 * (cleanedData.length - i));

    growthRates.push({
      rate,
      weight: recencyWeight,
    });
  }

  // Step 3: Calculate weighted average growth rate (or use median as fallback)
  let avgGrowthRate = 0;

  if (growthRates.length >= 2) {
    // Use weighted average
    const totalWeight = growthRates.reduce((sum, item) => sum + item.weight, 0);
    const weightedSum = growthRates.reduce(
      (sum, item) => sum + item.rate * item.weight,
      0,
    );
    avgGrowthRate = weightedSum / totalWeight;

    // Sanity check: Cap growth rate at realistic bounds (-50% to +100% per month)
    avgGrowthRate = Math.max(-0.5, Math.min(1.0, avgGrowthRate));
  } else {
    // Fallback to median growth rate
    const rates = growthRates.map((item) => item.rate).sort((a, b) => a - b);
    avgGrowthRate = rates[Math.floor(rates.length / 2)] || 0;
  }

  // Step 4: Detect seasonality patterns (if we have 12 months)
  let seasonalityFactor = 1.0;
  if (historical.length === 12) {
    // Calculate same-month-last-year comparison
    const currentMonthIndex = new Date().getMonth();
    const lastYearSameMonth = historical.find((item) => {
      const itemMonth = new Date(item.date).getMonth();
      return itemMonth === currentMonthIndex;
    });

    if (lastYearSameMonth && lastYearSameMonth.value > 0) {
      // Calculate year-over-year growth for this specific month
      const recentMonths = historical.slice(-3);
      const avgRecent =
        recentMonths.reduce((sum, item) => sum + item.value, 0) /
        recentMonths.length;

      if (avgRecent > 0) {
        seasonalityFactor = avgRecent / lastYearSameMonth.value;
        // Cap seasonality factor to reasonable bounds (0.5x to 2x)
        seasonalityFactor = Math.max(0.5, Math.min(2.0, seasonalityFactor));
      }
    }
  }

  // Step 5: Use exponential smoothing for baseline (weighted average of recent months)
  const alpha = 0.3; // Smoothing factor
  let smoothedValue = historical[0]?.value ?? 0;

  for (let i = 1; i < historical.length; i++) {
    const actualValue = historical[i]?.value ?? 0;
    smoothedValue = alpha * actualValue + (1 - alpha) * smoothedValue;
  }

  // Apply seasonality adjustment to smoothed baseline
  const lastActualValue = smoothedValue * seasonalityFactor;

  // Step 6: Generate forecast with conservative dampening
  const forecast: ForecastDataPoint[] = [];
  const currentDate = new UTCDate(parseISO(to));

  // Calculate expected collection rate from unpaid invoices
  // Assume 70% of unpaid invoices will be collected next month
  const expectedInvoiceCollection =
    outstandingInvoicesData.summary.totalAmount * 0.7;

  for (let i = 1; i <= forecastMonths; i++) {
    const forecastDate = endOfMonth(
      new UTCDate(currentDate.getFullYear(), currentDate.getMonth() + i, 1),
    );

    // Progressive dampening: The further out, the more conservative
    // Months 1-3: 98% of growth rate
    // Months 4-6: 95% of growth rate
    // Months 7+: 90% of growth rate
    let dampeningFactor = 1.0;
    if (i <= 3) {
      dampeningFactor = 0.98 ** i;
    } else if (i <= 6) {
      dampeningFactor = 0.98 ** 3 * 0.95 ** (i - 3);
    } else {
      dampeningFactor = 0.98 ** 3 * 0.95 ** 3 * 0.9 ** (i - 6);
    }

    // Apply dampened growth rate
    const effectiveGrowthRate = avgGrowthRate * dampeningFactor;
    const projectedValue = lastActualValue * (1 + effectiveGrowthRate) ** i;

    // Add slight regression to mean (pull towards historical average)
    const historicalAvg =
      historical.reduce((sum, item) => sum + item.value, 0) / historical.length;
    const regressionWeight = Math.min(0.15 * i, 0.6); // Max 60% weight on mean
    let finalValue =
      projectedValue * (1 - regressionWeight) +
      historicalAvg * regressionWeight;

    // Add expected invoice collection to first month only (one-time boost)
    if (i === 1 && expectedInvoiceCollection > 0) {
      finalValue += expectedInvoiceCollection;
    }

    forecast.push({
      date: format(forecastDate, "yyyy-MM-dd"),
      value: Math.max(0, Number(finalValue.toFixed(2))),
      currency,
      type: "forecast",
    });
  }

  // Step 7: Calculate summary metrics and volatility
  const nextMonthProjection = forecast[0]?.value || 0;
  const avgMonthlyGrowthRate = Number((avgGrowthRate * 100).toFixed(2));

  // Calculate volatility (standard deviation of growth rates)
  const volatility =
    growthRates.length >= 2
      ? Math.sqrt(
          growthRates.reduce((sum, item) => {
            const diff = item.rate - avgGrowthRate;
            return sum + diff * diff;
          }, 0) / growthRates.length,
        )
      : 0;

  // Calculate trend strength (how consistent is the direction?)
  const positiveMonths = growthRates.filter((item) => item.rate > 0).length;
  const trendStrength =
    growthRates.length > 0
      ? Math.abs((positiveMonths / growthRates.length) * 2 - 1) // 0 = no trend, 1 = strong trend
      : 0;

  // Calculate revenue stability (coefficient of variation)
  const revenueStdDev = Math.sqrt(
    historical.reduce((sum, item) => {
      const diff =
        item.value -
        historical.reduce((s, i) => s + i.value, 0) / historical.length;
      return sum + diff * diff;
    }, 0) / historical.length,
  );
  const revenueAvg =
    historical.reduce((sum, item) => sum + item.value, 0) / historical.length;
  const coefficientOfVariation =
    revenueAvg > 0 ? revenueStdDev / revenueAvg : 1;

  // Calculate confidence based on comprehensive data quality
  const dataQuality = {
    outlierCount: cleanedData.filter((item) => item.isOutlier).length,
    growthRateConsistency:
      growthRates.length >= 2
        ? 1 -
          Math.min(
            1,
            Math.abs(
              Math.max(...growthRates.map((r) => r.rate)) -
                Math.min(...growthRates.map((r) => r.rate)),
            ),
          )
        : 0.5,
    dataPoints: historical.length,
    trendStrength,
    volatility,
    stability: 1 - Math.min(1, coefficientOfVariation), // Lower CV = higher stability
  };

  // Comprehensive confidence score:
  // - Low outliers (25%)
  // - Consistent growth rates (20%)
  // - More data points (20%)
  // - Strong trend direction (20%)
  // - Low volatility (10%)
  // - Revenue stability (5%)
  const confidenceScore = Math.min(
    100,
    Math.max(
      30,
      Math.round(
        (1 - dataQuality.outlierCount / historical.length) * 25 +
          dataQuality.growthRateConsistency * 20 +
          Math.min(dataQuality.dataPoints / 12, 1) * 20 +
          dataQuality.trendStrength * 20 +
          (1 - Math.min(1, volatility * 2)) * 10 +
          dataQuality.stability * 5,
      ),
    ),
  );

  // Find peak month in forecast
  const peakForecast = forecast.reduce((max, curr) =>
    curr.value > max.value ? curr : max,
  );

  // Calculate total projected revenue for forecast period
  const totalProjectedRevenue = forecast.reduce(
    (sum, item) => sum + item.value,
    0,
  );

  // Combine historical and forecast data for charting
  const combinedData: ForecastDataPoint[] = [
    ...historical.map((item: (typeof historical)[number]) => ({
      ...item,
      type: "actual" as const,
    })),
    ...forecast,
  ];

  // Calculate billable hours in hours (convert from seconds)
  const billableHoursTotal = Math.round(billableHoursData.totalDuration / 3600);
  const billableHoursAmount = billableHoursData.totalAmount;

  return {
    summary: {
      nextMonthProjection,
      avgMonthlyGrowthRate,
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
        totalAmount: Number(billableHoursAmount.toFixed(2)),
        currency: billableHoursData.currency,
      },
    },
    historical: historical.map((item: (typeof historical)[number]) => ({
      date: item.date,
      value: item.value,
      currency: item.currency,
    })),
    forecast: forecast.map((item: ForecastDataPoint) => ({
      date: item.date,
      value: item.value,
      currency: item.currency,
    })),
    combined: combinedData,
    meta: {
      historicalMonths: historical.length,
      forecastMonths,
      avgGrowthRate: avgMonthlyGrowthRate,
      basedOnMonths: historical.length,
      currency,
      includesUnpaidInvoices: outstandingInvoicesData.summary.count > 0,
      includesBillableHours: billableHoursTotal > 0,
      confidenceScore,
      outlierMonths: dataQuality.outlierCount,
      forecastMethod: "exponential_smoothing_with_seasonality",
      // Advanced metrics
      volatility: Number((volatility * 100).toFixed(2)), // as percentage
      trendStrength: Number((trendStrength * 100).toFixed(2)), // 0-100%
      trendDirection:
        avgGrowthRate > 0.02
          ? "growing"
          : avgGrowthRate < -0.02
            ? "declining"
            : "stable",
      seasonalityDetected:
        historical.length === 12 && seasonalityFactor !== 1.0,
      seasonalityFactor: Number(seasonalityFactor.toFixed(2)),
      revenueStability: Number(((1 - coefficientOfVariation) * 100).toFixed(2)), // 0-100%
      expectedInvoiceCollection: Number(expectedInvoiceCollection.toFixed(2)),
    },
  };
}
