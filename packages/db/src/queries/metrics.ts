import type { Database } from "@db/client";
import { endOfMonth, parseISO, startOfMonth, subYears } from "date-fns";
import { sql } from "drizzle-orm";

function getPercentageIncrease(a: number, b: number) {
  return a > 0 && b > 0 ? Math.abs(((a - b) / b) * 100).toFixed() : 0;
}

export type GetMetricsParams = {
  teamId: string;
  from: string;
  to: string;
  currency?: string;
  type?: "revenue" | "profit";
};

interface MetricsResultItem {
  value: string;
  date: string;
  currency: string;
}

export async function getMetrics(db: Database, params: GetMetricsParams) {
  const { teamId, from, to, type = "profit", currency: inputCurrency } = params;

  const rpc = type === "profit" ? "get_profit_v3" : "get_revenue_v3";

  // Use sql.raw for function name to avoid parameterization of identifier
  const [prevData, currentData] = await db.transaction(async (tx) => {
    const rawPrev = (await tx.execute(
      sql`SELECT * FROM ${sql.raw(rpc)}(${teamId}, ${subYears(startOfMonth(parseISO(from)), 1).toISOString()}, ${subYears(endOfMonth(parseISO(to)), 1).toISOString()}, ${inputCurrency ?? null})`,
    )) as unknown as MetricsResultItem[];

    const prev = rawPrev.map((item) => ({
      ...item,
      value: Number.parseFloat(item.value),
    }));

    const rawCurr = (await tx.execute(
      sql`SELECT * FROM ${sql.raw(rpc)}(${teamId}, ${startOfMonth(parseISO(from)).toISOString()}, ${endOfMonth(parseISO(to)).toISOString()}, ${inputCurrency ?? null})`,
    )) as unknown as MetricsResultItem[];

    const curr = rawCurr.map((item) => ({
      ...item,
      value: Number.parseFloat(item.value),
    }));

    return [prev, curr];
  });

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

  const rawData = (await db.executeOnReplica(
    sql`SELECT * FROM ${sql.raw("get_burn_rate_v4")}(${teamId}, ${startOfMonth(parseISO(from)).toISOString()}, ${endOfMonth(parseISO(to)).toISOString()}, ${inputCurrency ?? null})`,
  )) as unknown as BurnRateResultItem[];

  return rawData.map((item) => ({
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

  const rawData = (await db.executeOnReplica(
    sql`SELECT * FROM ${sql.raw("get_expenses")}(${teamId}, ${startOfMonth(parseISO(from)).toISOString()}, ${endOfMonth(parseISO(to)).toISOString()}, ${inputCurrency ?? null})`,
  )) as unknown as ExpensesResultItem[];

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

  const rawData = (await db.executeOnReplica(
    sql`SELECT * FROM ${sql.raw("get_spending_v4")}(${teamId}, ${startOfMonth(parseISO(from)).toISOString()}, ${endOfMonth(parseISO(to)).toISOString()}, ${inputCurrency ?? null})`,
  )) as unknown as SpendingResultItem[];

  return Array.isArray(rawData)
    ? rawData.map((item) => ({
        ...item,
        amount: Number.parseFloat(Number(item.amount).toFixed(2)),
        percentage: Number.parseFloat(Number(item.percentage).toFixed(2)),
      }))
    : [];
}

export type GetRunwayParams = {
  teamId: string;
  from: string;
  to: string;
  currency?: string;
};

interface RunwayResultItem {
  get_runway_v4: string;
}

export async function getRunway(db: Database, params: GetRunwayParams) {
  const { teamId, from, to, currency: inputCurrency } = params;

  const rawData = (await db.executeOnReplica(
    sql`SELECT * FROM ${sql.raw("get_runway_v4")}(${teamId}, ${startOfMonth(parseISO(from)).toISOString()}, ${endOfMonth(parseISO(to)).toISOString()}, ${inputCurrency ?? null})`,
  )) as unknown as RunwayResultItem[];

  const runwayValue = rawData?.[0]?.get_runway_v4;

  if (runwayValue) {
    return Number.parseInt(runwayValue, 10);
  }

  return 0;
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

  const fromDate = startOfMonth(parseISO(from)).toISOString();
  const toDate = endOfMonth(parseISO(to)).toISOString();

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
