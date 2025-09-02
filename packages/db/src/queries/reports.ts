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
  teams,
  transactionCategories,
  transactions,
} from "../schema";

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
        CASE
          WHEN ${inputCurrency ? sql`${inputCurrency}` : sql`NULL`} IS NOT NULL THEN ${transactions.amount}
          ELSE COALESCE(${transactions.baseAmount}, 0)
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

  // Step 4: Execute the aggregated query
  const monthlyData = await db
    .select({
      month: sql<string>`DATE_TRUNC('month', ${transactions.date})::date`,
      value: sql<number>`COALESCE(SUM(
        CASE
          WHEN ${inputCurrency ? sql`${inputCurrency}` : sql`NULL`} IS NOT NULL THEN ${transactions.amount}
          ELSE COALESCE(${transactions.baseAmount}, 0)
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

export async function getReports(db: Database, params: GetReportsParams) {
  const { teamId, from, to, type = "profit", currency: inputCurrency } = params;

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
    }),
    reportFunction(db, {
      teamId,
      from,
      to,
      currency: inputCurrency,
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
      totalAmount: sql<number>`COALESCE(ABS(SUM(
        CASE
          WHEN ${inputCurrency ? sql`${inputCurrency}` : sql`NULL`} IS NOT NULL THEN
            CASE
              WHEN ${transactions.currency} = ${targetCurrency} THEN ${transactions.amount}
              ELSE COALESCE(${transactions.baseAmount}, 0)
            END
          ELSE COALESCE(${transactions.baseAmount}, 0)
        END
      )), 0)`,
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
      value: sql<number>`COALESCE(SUM(
        CASE
          WHEN ${inputCurrency ? sql`${inputCurrency}` : sql`NULL`} IS NOT NULL AND (${transactions.recurring} = false OR ${transactions.recurring} IS NULL) THEN ABS(${transactions.amount})
          WHEN ${inputCurrency ? sql`${inputCurrency}` : sql`NULL`} IS NULL AND (${transactions.recurring} = false OR ${transactions.recurring} IS NULL) THEN ABS(COALESCE(${transactions.baseAmount}, 0))
          ELSE 0
        END
      ), 0)`,
      recurringValue: sql<number>`COALESCE(SUM(
        CASE
          WHEN ${inputCurrency ? sql`${inputCurrency}` : sql`NULL`} IS NOT NULL AND ${transactions.recurring} = true THEN ABS(${transactions.amount})
          WHEN ${inputCurrency ? sql`${inputCurrency}` : sql`NULL`} IS NULL AND ${transactions.recurring} = true THEN ABS(COALESCE(${transactions.baseAmount}, 0))
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
      total: sql<number>`SUM(CASE
        WHEN ${inputCurrency ? sql`${inputCurrency}` : sql`NULL`} IS NOT NULL THEN ${transactions.amount}
        ELSE COALESCE(${transactions.baseAmount}, 0)
      END)`,
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
      amount: sql<number>`ABS(SUM(CASE
        WHEN ${inputCurrency ? sql`${inputCurrency}` : sql`NULL`} IS NOT NULL THEN ${transactions.amount}
        ELSE COALESCE(${transactions.baseAmount}, 0)
      END))`,
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
    .having(sql`SUM(CASE
      WHEN ${inputCurrency ? sql`${inputCurrency}` : sql`NULL`} IS NOT NULL THEN ${transactions.amount}
      ELSE COALESCE(${transactions.baseAmount}, 0)
    END) < 0`)
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
      amount: sql<number>`SUM(CASE
        WHEN ${inputCurrency ? sql`${inputCurrency}` : sql`NULL`} IS NOT NULL THEN ${transactions.amount}
        ELSE COALESCE(${transactions.baseAmount}, 0)
      END)`,
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

export type GetTaxParams = {
  teamId: string;
  type: "paid" | "collected";
  from: string;
  to: string;
  categorySlug?: string;
  taxType?: string;
  currency?: string;
};

interface TaxResultItem {
  amount: string;
  tax_rate: string;
  tax_type: string;
  date: string;
  currency: string;
  category_slug?: string;
}

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
