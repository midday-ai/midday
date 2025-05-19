import { endOfMonth, parseISO, startOfMonth, subYears } from "date-fns";
import { sql } from "drizzle-orm";
import type { Database } from "..";

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

  const prevTotal =
    prevData?.reduce((value, item) => item.value + value, 0) ?? 0;
  const currentTotal =
    currentData?.reduce((value, item) => item.value + value, 0) ?? 0;

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
        precentage: {
          value: getPercentageIncrease(
            Math.abs(prevValue),
            Math.abs(recordValue),
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
      ? rawData.reduce(
          (sum, item) => sum + Number.parseFloat(item.value || "0"),
          0,
        ) / rawData.length
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
      const value = Number.parseFloat(item.value || "0");
      const recurring = Number.parseFloat(
        item.recurring_value !== undefined ? String(item.recurring_value) : "0",
      );
      return {
        date: item.date,
        value,
        currency: item.currency,
        recurring,
        total: value + recurring,
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
    sql`SELECT * FROM ${sql.raw("get_spending_v3")}(${teamId}, ${startOfMonth(parseISO(from)).toISOString()}, ${endOfMonth(parseISO(to)).toISOString()}, ${inputCurrency ?? null})`,
  )) as unknown as SpendingResultItem[];

  return rawData ?? [];
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
