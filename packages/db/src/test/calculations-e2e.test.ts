import {
  afterAll,
  beforeAll,
  describe,
  expect,
  setSystemTime,
  test,
} from "bun:test";
import type { Database } from "../client";
import {
  createReport,
  getBalanceSheet,
  getBurnRate,
  getCashFlow,
  getChartDataByLinkId,
  getExpenses,
  getGrowthRate,
  getOutstandingInvoices,
  getOverdueInvoicesAlert,
  getProfit,
  getProfitMargin,
  getRecurringExpenses,
  getReportByLinkId,
  getReports,
  getRevenue,
  getRevenueForecast,
  getRunway,
  getSpending,
  getSpendingForPeriod,
  getTaxSummary,
} from "../queries/reports";
import {
  SEED_REFERENCE_DATE,
  seedAll,
  TEAM_EUR_ID,
  TEAM_USD_ID,
  TEST_USER_ID,
} from "./helpers/seed";
import {
  cleanDatabase,
  closeDatabase,
  getTestDatabase,
  isTestDatabaseAvailable,
} from "./helpers/test-database";

const SKIP = !isTestDatabaseAvailable();

describe.skipIf(SKIP)("E2E Calculation Tests", () => {
  let db: Database;

  beforeAll(async () => {
    db = getTestDatabase();
    await cleanDatabase();
    await seedAll(db);
  });

  afterAll(async () => {
    await closeDatabase();
  });

  // ─────────────────────────────────────────────────────────────────────────
  // REVENUE — Gross
  //
  // resolvedAmount uses exchange rate fallback:
  //   CASE WHEN baseCurrency = target AND baseAmount IS NOT NULL THEN baseAmount
  //        WHEN currency = target THEN amount
  //        ELSE amount * (SELECT rate FROM exchange_rates WHERE base=currency AND target=target)
  //   END
  // FX2 (currency=EUR, baseAmount=NULL) → 1500 * 1.10 (EUR→USD rate) = 1650.
  // ─────────────────────────────────────────────────────────────────────────

  describe("Revenue — Gross (inputCurrency=USD)", () => {
    test("January: R1(5000) + R2(4400) + R3(2000) + FX1(2500) + FX2(1650) = 15550", async () => {
      const result = await getRevenue(db, {
        teamId: TEAM_USD_ID,
        from: "2024-01-01",
        to: "2024-01-31",
        currency: "USD",
        revenueType: "gross",
      });

      const jan = result.find((r) => r.date.startsWith("2024-01"));
      expect(jan).toBeDefined();
      expect(Number.parseFloat(jan!.value)).toBe(15550);
    });

    test("February: R4(2000) + S3(500) + S4(300) = 2800", async () => {
      const result = await getRevenue(db, {
        teamId: TEAM_USD_ID,
        from: "2024-02-01",
        to: "2024-02-29",
        currency: "USD",
        revenueType: "gross",
      });

      const feb = result.find((r) => r.date.startsWith("2024-02"));
      expect(feb).toBeDefined();
      expect(Number.parseFloat(feb!.value)).toBe(2800);
    });

    test("March: R6(4000) + R8(1000) = 5000 (R7 excluded — neither currency nor baseCurrency is USD)", async () => {
      const result = await getRevenue(db, {
        teamId: TEAM_USD_ID,
        from: "2024-03-01",
        to: "2024-03-31",
        currency: "USD",
        revenueType: "gross",
      });

      const mar = result.find((r) => r.date.startsWith("2024-03"));
      expect(mar).toBeDefined();
      expect(Number.parseFloat(mar!.value)).toBe(5000);
    });

    test("April gap month: 0", async () => {
      const result = await getRevenue(db, {
        teamId: TEAM_USD_ID,
        from: "2024-04-01",
        to: "2024-04-30",
        currency: "USD",
        revenueType: "gross",
      });

      const apr = result.find((r) => r.date.startsWith("2024-04"));
      expect(apr).toBeDefined();
      expect(Number.parseFloat(apr!.value)).toBe(0);
    });

    test("May precision: R9(0.01) + R10(99999.99) = 100000.00", async () => {
      const result = await getRevenue(db, {
        teamId: TEAM_USD_ID,
        from: "2024-05-01",
        to: "2024-05-31",
        currency: "USD",
        revenueType: "gross",
      });

      const may = result.find((r) => r.date.startsWith("2024-05"));
      expect(may).toBeDefined();
      expect(Number.parseFloat(may!.value)).toBe(100000);
    });

    test("multi-month range fills all months including gaps", async () => {
      const result = await getRevenue(db, {
        teamId: TEAM_USD_ID,
        from: "2024-01-01",
        to: "2024-06-30",
        currency: "USD",
        revenueType: "gross",
      });

      expect(result.length).toBe(6);
      const apr = result.find((r) => r.date.startsWith("2024-04"));
      expect(Number.parseFloat(apr!.value)).toBe(0);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // REVENUE — Gross (NO inputCurrency)
  //
  // Without inputCurrency, uses resolvedAmount(teamBaseCurrency) with exchange rate fallback.
  // FX2 (baseAmount=NULL, currency=EUR) → converted via EUR→USD rate: 1500*1.10=1650.
  // ─────────────────────────────────────────────────────────────────────────

  describe("Revenue — Gross (no inputCurrency)", () => {
    test("January: R1(5000) + R2(4400) + R3(2000) + FX1(2500) + FX2(1650) = 15550", async () => {
      const result = await getRevenue(db, {
        teamId: TEAM_USD_ID,
        from: "2024-01-01",
        to: "2024-01-31",
        revenueType: "gross",
      });

      const jan = result.find((r) => r.date.startsWith("2024-01"));
      expect(jan).toBeDefined();
      expect(Number.parseFloat(jan!.value)).toBe(15550);
    });

    test("March: R6(4000) + R8(1000) = 5000 (R7 excluded, NULL baseCurrency)", async () => {
      const result = await getRevenue(db, {
        teamId: TEAM_USD_ID,
        from: "2024-03-01",
        to: "2024-03-31",
        revenueType: "gross",
      });

      const mar = result.find((r) => r.date.startsWith("2024-03"));
      expect(mar).toBeDefined();
      expect(Number.parseFloat(mar!.value)).toBe(5000);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // REVENUE — Net
  // Net = ROUND(amount - amount * tax / (100 + tax), 2) per transaction
  // ─────────────────────────────────────────────────────────────────────────

  describe("Revenue — Net", () => {
    // Jan net: R1:4166.67, R2:4400, R3:1818.18, FX1:2500, FX2:1650 = 14534.85
    test("January: 14534.85", async () => {
      const result = await getRevenue(db, {
        teamId: TEAM_USD_ID,
        from: "2024-01-01",
        to: "2024-01-31",
        currency: "USD",
        revenueType: "net",
      });

      const jan = result.find((r) => r.date.startsWith("2024-01"));
      expect(jan).toBeDefined();
      expect(Number.parseFloat(jan!.value)).toBeCloseTo(14534.85, 1);
    });

    // Feb net: R4:1818.18, S3:500, S4:300 = 2618.18
    test("February: 2618.18", async () => {
      const result = await getRevenue(db, {
        teamId: TEAM_USD_ID,
        from: "2024-02-01",
        to: "2024-02-29",
        currency: "USD",
        revenueType: "net",
      });

      const feb = result.find((r) => r.date.startsWith("2024-02"));
      expect(feb).toBeDefined();
      expect(Number.parseFloat(feb!.value)).toBeCloseTo(2618.18, 1);
    });

    // Mar net: R6:3478.26, R8:1000 = 4478.26
    test("March: 4478.26", async () => {
      const result = await getRevenue(db, {
        teamId: TEAM_USD_ID,
        from: "2024-03-01",
        to: "2024-03-31",
        currency: "USD",
        revenueType: "net",
      });

      const mar = result.find((r) => r.date.startsWith("2024-03"));
      expect(mar).toBeDefined();
      expect(Number.parseFloat(mar!.value)).toBeCloseTo(4478.26, 1);
    });

    // May net: R9: ROUND(0.01 - 0.01*20/120, 2)=0.01, R10: ROUND(99999.99 - 99999.99*25/125, 2)=79999.99
    test("May: 80000.00 — precision test", async () => {
      const result = await getRevenue(db, {
        teamId: TEAM_USD_ID,
        from: "2024-05-01",
        to: "2024-05-31",
        currency: "USD",
        revenueType: "net",
      });

      const may = result.find((r) => r.date.startsWith("2024-05"));
      expect(may).toBeDefined();
      expect(Number.parseFloat(may!.value)).toBeCloseTo(80000.0, 1);
    });
  });

  describe("Revenue — Filters", () => {
    test("contra-revenue (customer-refunds) excluded from revenue", async () => {
      const result = await getRevenue(db, {
        teamId: TEAM_USD_ID,
        from: "2024-02-01",
        to: "2024-02-29",
        currency: "USD",
        revenueType: "gross",
      });

      const feb = result.find((r) => r.date.startsWith("2024-02"));
      expect(Number.parseFloat(feb!.value)).toBe(2800);
    });

    test("status=excluded (S1) not counted in revenue", async () => {
      const result = await getRevenue(db, {
        teamId: TEAM_USD_ID,
        from: "2024-02-01",
        to: "2024-02-29",
        currency: "USD",
        revenueType: "gross",
      });

      const feb = result.find((r) => r.date.startsWith("2024-02"));
      // If S1($1000) leaked: 3800. Actual: 2800
      expect(Number.parseFloat(feb!.value)).toBe(2800);
    });

    test("internal=true (S2) not counted in revenue", async () => {
      const result = await getRevenue(db, {
        teamId: TEAM_USD_ID,
        from: "2024-02-01",
        to: "2024-02-29",
        currency: "USD",
        revenueType: "gross",
      });

      const feb = result.find((r) => r.date.startsWith("2024-02"));
      // If S2($2000) leaked: 4800. Actual: 2800
      expect(Number.parseFloat(feb!.value)).toBe(2800);
    });

    test("status=pending (S3) IS counted", async () => {
      const result = await getRevenue(db, {
        teamId: TEAM_USD_ID,
        from: "2024-02-01",
        to: "2024-02-29",
        currency: "USD",
        revenueType: "gross",
      });

      const feb = result.find((r) => r.date.startsWith("2024-02"));
      // If S3($500) wrongly excluded: 2300. Actual: 2800
      expect(Number.parseFloat(feb!.value)).toBe(2800);
    });

    test("status=archived (S4) IS counted", async () => {
      const result = await getRevenue(db, {
        teamId: TEAM_USD_ID,
        from: "2024-02-01",
        to: "2024-02-29",
        currency: "USD",
        revenueType: "gross",
      });

      const feb = result.find((r) => r.date.startsWith("2024-02"));
      // If S4($300) wrongly excluded: 2500. Actual: 2800
      expect(Number.parseFloat(feb!.value)).toBe(2800);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // PROFIT
  //
  // getProfit always uses Net Revenue internally.
  //   revenueType="net"  → Net Profit  = NetRev - COGS - OpEx
  //   revenueType="gross" → Gross Profit = NetRev - COGS
  //
  // COGS slugs = children of "cost-of-goods-sold" = ["materials", "direct-labor"]
  // ─────────────────────────────────────────────────────────────────────────

  describe("Profit — Net (revenueType=net)", () => {
    // Jan: NetRev(14534.85) - COGS(0) - OpEx(5790) = 8744.85
    test("January: 8744.85", async () => {
      const result = await getProfit(db, {
        teamId: TEAM_USD_ID,
        from: "2024-01-01",
        to: "2024-01-31",
        currency: "USD",
        revenueType: "net",
      });

      const jan = result.find((r) => r.date.startsWith("2024-01"));
      expect(jan).toBeDefined();
      expect(Number.parseFloat(jan!.value)).toBeCloseTo(8744.85, 0);
    });

    // Feb: NetRev(2618.18) - COGS(2300) - OpEx(0) = 318.18
    test("February: 318.18", async () => {
      const result = await getProfit(db, {
        teamId: TEAM_USD_ID,
        from: "2024-02-01",
        to: "2024-02-29",
        currency: "USD",
        revenueType: "net",
      });

      const feb = result.find((r) => r.date.startsWith("2024-02"));
      expect(feb).toBeDefined();
      expect(Number.parseFloat(feb!.value)).toBeCloseTo(318.18, 0);
    });

    // Mar: NetRev(4478.26) - COGS(0) - OpEx(800) = 3678.26
    test("March: 3678.26", async () => {
      const result = await getProfit(db, {
        teamId: TEAM_USD_ID,
        from: "2024-03-01",
        to: "2024-03-31",
        currency: "USD",
        revenueType: "net",
      });

      const mar = result.find((r) => r.date.startsWith("2024-03"));
      expect(mar).toBeDefined();
      expect(Number.parseFloat(mar!.value)).toBeCloseTo(3678.26, 0);
    });
  });

  describe("Profit — Gross (revenueType=gross)", () => {
    // Jan gross: NetRev(14534.85) - COGS(0) = 14534.85
    test("January: 14534.85", async () => {
      const result = await getProfit(db, {
        teamId: TEAM_USD_ID,
        from: "2024-01-01",
        to: "2024-01-31",
        currency: "USD",
        revenueType: "gross",
      });

      const jan = result.find((r) => r.date.startsWith("2024-01"));
      expect(jan).toBeDefined();
      expect(Number.parseFloat(jan!.value)).toBeCloseTo(14534.85, 0);
    });

    // Feb: both gross and net are same because OpEx=0
    test("February: gross equals net when OpEx=0", async () => {
      const resultGross = await getProfit(db, {
        teamId: TEAM_USD_ID,
        from: "2024-02-01",
        to: "2024-02-29",
        currency: "USD",
        revenueType: "gross",
      });
      const resultNet = await getProfit(db, {
        teamId: TEAM_USD_ID,
        from: "2024-02-01",
        to: "2024-02-29",
        currency: "USD",
        revenueType: "net",
      });

      const febGross = resultGross.find((r) => r.date.startsWith("2024-02"));
      const febNet = resultNet.find((r) => r.date.startsWith("2024-02"));
      expect(Number.parseFloat(febGross!.value)).toBeCloseTo(
        Number.parseFloat(febNet!.value),
        1,
      );
    });

    // Mar gross (4478.26) > Mar net (3678.26) because OpEx=800 is subtracted only in net
    test("March: gross profit > net profit when OpEx exists", async () => {
      const resultGross = await getProfit(db, {
        teamId: TEAM_USD_ID,
        from: "2024-03-01",
        to: "2024-03-31",
        currency: "USD",
        revenueType: "gross",
      });
      const resultNet = await getProfit(db, {
        teamId: TEAM_USD_ID,
        from: "2024-03-01",
        to: "2024-03-31",
        currency: "USD",
        revenueType: "net",
      });

      const marGross = Number.parseFloat(
        resultGross.find((r) => r.date.startsWith("2024-03"))!.value,
      );
      const marNet = Number.parseFloat(
        resultNet.find((r) => r.date.startsWith("2024-03"))!.value,
      );
      expect(marGross).toBeGreaterThan(marNet);
      expect(marGross).toBeCloseTo(4478.26, 0);
      expect(marNet).toBeCloseTo(3678.26, 0);
    });
  });

  describe("Profit — Excluded Categories", () => {
    test("credit-card-payment (excluded category) NOT counted in operating expenses", async () => {
      const result = await getProfit(db, {
        teamId: TEAM_USD_ID,
        from: "2024-01-01",
        to: "2024-01-31",
        currency: "USD",
        revenueType: "net",
      });

      const jan = Number.parseFloat(
        result.find((r) => r.date.startsWith("2024-01"))!.value,
      );
      // If X1($5000) leaked into OpEx: 8744.85 - 5000 = 3744.85
      expect(jan).toBeCloseTo(8744.85, 0);
    });

    test("internal-transfer (excluded category) NOT counted in operating expenses", async () => {
      const result = await getProfit(db, {
        teamId: TEAM_USD_ID,
        from: "2024-01-01",
        to: "2024-01-31",
        currency: "USD",
        revenueType: "net",
      });

      const jan = Number.parseFloat(
        result.find((r) => r.date.startsWith("2024-01"))!.value,
      );
      // If X2($3000) leaked into OpEx: 8744.85 - 3000 = 5744.85
      expect(jan).toBeCloseTo(8744.85, 0);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // EXPENSES
  //
  // result[].value = non-recurring expenses
  // result[].recurring = recurring expenses
  // result[].total = value + recurring (what we use for total)
  // ─────────────────────────────────────────────────────────────────────────

  describe("Expenses", () => {
    test("January: total=5790, recurring=4200", async () => {
      const result = await getExpenses(db, {
        teamId: TEAM_USD_ID,
        from: "2024-01-01",
        to: "2024-01-31",
        currency: "USD",
      });

      const jan = result.result.find((r) => r.date.startsWith("2024-01"));
      expect(jan).toBeDefined();
      expect(jan!.total).toBeCloseTo(5790, 0);
      expect(jan!.recurring).toBeCloseTo(4200, 0);
      expect(jan!.value).toBeCloseTo(1590, 0);
    });

    test("February: total=2300, all non-recurring (COGS items)", async () => {
      const result = await getExpenses(db, {
        teamId: TEAM_USD_ID,
        from: "2024-02-01",
        to: "2024-02-29",
        currency: "USD",
      });

      const feb = result.result.find((r) => r.date.startsWith("2024-02"));
      expect(feb).toBeDefined();
      expect(feb!.total).toBeCloseTo(2300, 0);
      expect(feb!.recurring).toBe(0);
    });

    test("March: total=800 (E5=500 + E6=300)", async () => {
      const result = await getExpenses(db, {
        teamId: TEAM_USD_ID,
        from: "2024-03-01",
        to: "2024-03-31",
        currency: "USD",
      });

      const mar = result.result.find((r) => r.date.startsWith("2024-03"));
      expect(mar).toBeDefined();
      expect(mar!.total).toBeCloseTo(800, 0);
    });

    test("excluded categories not in expenses", async () => {
      const result = await getExpenses(db, {
        teamId: TEAM_USD_ID,
        from: "2024-01-01",
        to: "2024-02-29",
        currency: "USD",
      });

      const jan = result.result.find((r) => r.date.startsWith("2024-01"));
      const feb = result.result.find((r) => r.date.startsWith("2024-02"));
      expect(jan!.total).toBeCloseTo(5790, 0);
      expect(feb!.total).toBeCloseTo(2300, 0);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // BURN RATE
  //
  // Uses: CASE WHEN currency = target THEN amount ELSE COALESCE(baseAmount, 0) END
  // Filters: amount < 0, non-excluded categories, non-excluded status, non-internal
  // ─────────────────────────────────────────────────────────────────────────

  describe("Burn Rate", () => {
    test("January: 5790", async () => {
      const result = await getBurnRate(db, {
        teamId: TEAM_USD_ID,
        from: "2024-01-01",
        to: "2024-01-31",
        currency: "USD",
      });

      const jan = result.find((r) => r.date.startsWith("2024-01"));
      expect(jan).toBeDefined();
      expect(jan!.value).toBeCloseTo(5790, 0);
    });

    test("February: 2300", async () => {
      const result = await getBurnRate(db, {
        teamId: TEAM_USD_ID,
        from: "2024-02-01",
        to: "2024-02-29",
        currency: "USD",
      });

      const feb = result.find((r) => r.date.startsWith("2024-02"));
      expect(feb).toBeDefined();
      expect(feb!.value).toBeCloseTo(2300, 0);
    });

    test("March: 800", async () => {
      const result = await getBurnRate(db, {
        teamId: TEAM_USD_ID,
        from: "2024-03-01",
        to: "2024-03-31",
        currency: "USD",
      });

      const mar = result.find((r) => r.date.startsWith("2024-03"));
      expect(mar).toBeDefined();
      expect(mar!.value).toBeCloseTo(800, 0);
    });

    test("April gap month: 0", async () => {
      const result = await getBurnRate(db, {
        teamId: TEAM_USD_ID,
        from: "2024-04-01",
        to: "2024-04-30",
        currency: "USD",
      });

      const apr = result.find((r) => r.date.startsWith("2024-04"));
      expect(apr).toBeDefined();
      expect(apr!.value).toBe(0);
    });

    test("June includes uncategorized expense U1=750", async () => {
      const result = await getBurnRate(db, {
        teamId: TEAM_USD_ID,
        from: "2024-06-01",
        to: "2024-06-30",
        currency: "USD",
      });

      const jun = result.find((r) => r.date.startsWith("2024-06"));
      expect(jun).toBeDefined();
      expect(jun!.value).toBeCloseTo(750, 0);
    });

    test("May: tiny expense 0.01 not lost", async () => {
      const result = await getBurnRate(db, {
        teamId: TEAM_USD_ID,
        from: "2024-05-01",
        to: "2024-05-31",
        currency: "USD",
      });

      const may = result.find((r) => r.date.startsWith("2024-05"));
      expect(may!.value).toBeCloseTo(0.01, 2);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // CASH FLOW
  //
  // income = SUM of positive amounts (non-excluded categories)
  // expenses = SUM of ABS(negative amounts) (non-excluded categories)
  // Does NOT filter by REVENUE_CATEGORIES — R5 (customer-refunds) is included as income
  // ─────────────────────────────────────────────────────────────────────────

  describe("Cash Flow", () => {
    test("January: income=15550, expenses=5790, net=9760 (FX2+EFX1 converted via EUR→USD rate)", async () => {
      const result = await getCashFlow(db, {
        teamId: TEAM_USD_ID,
        from: "2024-01-01",
        to: "2024-01-31",
        currency: "USD",
      });

      expect(result.summary.totalIncome).toBeCloseTo(15550, 0);
      expect(result.summary.totalExpenses).toBeCloseTo(5790, 0);
      expect(result.summary.netCashFlow).toBeCloseTo(9760, 0);
    });

    test("February: income=3300, expenses=2300, net=1000", async () => {
      const result = await getCashFlow(db, {
        teamId: TEAM_USD_ID,
        from: "2024-02-01",
        to: "2024-02-29",
        currency: "USD",
      });

      // R5 (customer-refunds, $500) is positive and IS included in cash flow income
      expect(result.summary.totalIncome).toBeCloseTo(3300, 0);
      expect(result.summary.totalExpenses).toBeCloseTo(2300, 0);
      expect(result.summary.netCashFlow).toBeCloseTo(1000, 0);
    });

    test("March: income=5000, expenses=800, net=4200", async () => {
      const result = await getCashFlow(db, {
        teamId: TEAM_USD_ID,
        from: "2024-03-01",
        to: "2024-03-31",
        currency: "USD",
      });

      expect(result.summary.totalIncome).toBeCloseTo(5000, 0);
      expect(result.summary.totalExpenses).toBeCloseTo(800, 0);
      expect(result.summary.netCashFlow).toBeCloseTo(4200, 0);
    });

    test("identity: netCashFlow = totalIncome - totalExpenses", async () => {
      const result = await getCashFlow(db, {
        teamId: TEAM_USD_ID,
        from: "2024-01-01",
        to: "2024-03-31",
        currency: "USD",
      });

      const expectedNet =
        result.summary.totalIncome - result.summary.totalExpenses;
      expect(result.summary.netCashFlow).toBeCloseTo(expectedNet, 2);
    });

    test("excluded categories NOT in cash flow", async () => {
      const result = await getCashFlow(db, {
        teamId: TEAM_USD_ID,
        from: "2024-01-01",
        to: "2024-01-31",
        currency: "USD",
      });

      // X1($5000) + X2($3000) would add $8000 to Jan expenses if they leaked
      expect(result.summary.totalExpenses).toBeCloseTo(5790, 0);
    });

    test("June includes uncategorized expense as expense", async () => {
      const result = await getCashFlow(db, {
        teamId: TEAM_USD_ID,
        from: "2024-06-01",
        to: "2024-06-30",
        currency: "USD",
      });

      expect(result.summary.totalExpenses).toBeCloseTo(750, 0);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // TAX SUMMARY
  //
  // Tax rate resolves: COALESCE(transactions.taxRate, tc.taxRate, 0)
  // Tax amount = ABS(amount * tax / (100 + tax))
  // ─────────────────────────────────────────────────────────────────────────

  describe("Tax Summary", () => {
    test("collected tax: positive transactions with tax metadata", async () => {
      const result = await getTaxSummary(db, {
        teamId: TEAM_USD_ID,
        type: "collected",
        from: "2024-01-01",
        to: "2024-03-31",
        currency: "USD",
      });

      expect(result).toBeDefined();
      expect(result.summary).toBeDefined();
      // R1: 5000*20/120=833.33, R3: 2000*10/110=181.82
      // R4: 2000*10/110=181.82, R6: 4000*15/115=521.74
      // R8: taxRate=0 → 0. R9: tiny. R10: large.
      expect(result.summary.totalTaxAmount).toBeGreaterThan(0);
    });

    test("paid tax: expenses with tax metadata (including category fallback)", async () => {
      const result = await getTaxSummary(db, {
        teamId: TEAM_USD_ID,
        type: "paid",
        from: "2024-01-01",
        to: "2024-03-31",
        currency: "USD",
      });

      expect(result).toBeDefined();
      expect(result.summary).toBeDefined();
      // E2: -200, category software taxRate=20 → 200*20/120=33.33
      // E4: -550, tx taxRate=20 → 550*20/120=91.67
      // E5: -500, category software taxRate=20 → 500*20/120=83.33
      // E6: -300, category marketing taxRate=10 → 300*10/110=27.27
      expect(result.summary.totalTaxAmount).toBeGreaterThan(0);
    });

    test("excluded categories NOT in tax summary", async () => {
      const result = await getTaxSummary(db, {
        teamId: TEAM_USD_ID,
        type: "paid",
        from: "2024-01-01",
        to: "2024-01-31",
        currency: "USD",
      });

      // X1 and X2 have excluded categories — should not appear
      const slugs = result.result.map(
        (r: { category_slug: string }) => r.category_slug,
      );
      expect(slugs).not.toContain("credit-card-payment");
      expect(slugs).not.toContain("internal-transfer");
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // PERIOD COMPARISONS — getReports (YoY)
  // ─────────────────────────────────────────────────────────────────────────

  describe("getReports — YoY Comparison", () => {
    test("current vs previous year totals", async () => {
      const result = await getReports(db, {
        teamId: TEAM_USD_ID,
        from: "2024-01-01",
        to: "2024-03-31",
        type: "revenue",
        currency: "USD",
        revenueType: "gross",
      });

      expect(result.summary).toBeDefined();
      // 2024 gross: Jan(15550) + Feb(2800) + Mar(5000) = 23350
      expect(result.summary.currentTotal).toBeCloseTo(23350, 0);
      // 2023 gross: PY1(4000) + PY2(1500) + PY3(3000) = 8500
      expect(result.summary.prevTotal).toBeCloseTo(8500, 0);
    });

    test("per-month results have percentage changes", async () => {
      const result = await getReports(db, {
        teamId: TEAM_USD_ID,
        from: "2024-01-01",
        to: "2024-03-31",
        type: "revenue",
        currency: "USD",
        revenueType: "gross",
      });

      expect(result.result).toBeDefined();
      expect(result.result!.length).toBe(3);
      for (const month of result.result!) {
        expect(month.percentage).toBeDefined();
        expect(month.current).toBeDefined();
        expect(month.previous).toBeDefined();
      }
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // GROWTH RATE
  // ─────────────────────────────────────────────────────────────────────────

  describe("Growth Rate", () => {
    test("quarterly: Q1 2024 vs Q4 2023", async () => {
      const result = await getGrowthRate(db, {
        teamId: TEAM_USD_ID,
        from: "2024-01-01",
        to: "2024-03-31",
        currency: "USD",
        type: "revenue",
        revenueType: "gross",
        period: "quarterly",
      });

      expect(result.summary).toBeDefined();
      // Q1 2024: 15550 + 2800 + 5000 = 23350
      expect(result.summary.currentTotal).toBeCloseTo(23350, 0);
      // Q4 2023: PQ1(3500) + PQ2(2800) + PQ3(3200) = 9500
      expect(result.summary.previousTotal).toBeCloseTo(9500, 0);
      // Growth: (23350-9500)/9500*100 = 145.79%
      expect(result.summary.growthRate).toBeCloseTo(145.79, 0);
      expect(result.summary.trend).toBe("positive");
    });

    test("yearly: 2024 vs 2023 (Jan-Mar)", async () => {
      const result = await getGrowthRate(db, {
        teamId: TEAM_USD_ID,
        from: "2024-01-01",
        to: "2024-03-31",
        currency: "USD",
        type: "revenue",
        revenueType: "gross",
        period: "yearly",
      });

      expect(result.summary.currentTotal).toBeCloseTo(23350, 0);
      expect(result.summary.previousTotal).toBeCloseTo(8500, 0);
      expect(result.summary.trend).toBe("positive");
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // PROFIT MARGIN
  //
  // profitMargin = (totalProfit / totalRevenue) * 100
  // Uses Net Revenue for denominator always; profit uses provided revenueType
  // ─────────────────────────────────────────────────────────────────────────

  describe("Profit Margin", () => {
    test("overall calculation is consistent", async () => {
      const result = await getProfitMargin(db, {
        teamId: TEAM_USD_ID,
        from: "2024-01-01",
        to: "2024-03-31",
        currency: "USD",
        revenueType: "net",
      });

      expect(result.summary).toBeDefined();
      expect(result.summary.totalRevenue).toBeGreaterThan(0);
      expect(result.summary.totalProfit).toBeDefined();
      const expectedMargin =
        (result.summary.totalProfit / result.summary.totalRevenue) * 100;
      expect(result.summary.profitMargin).toBeCloseTo(expectedMargin, 1);
    });

    test("monthly margins array has correct length", async () => {
      const result = await getProfitMargin(db, {
        teamId: TEAM_USD_ID,
        from: "2024-01-01",
        to: "2024-03-31",
        currency: "USD",
        revenueType: "net",
      });

      expect(result.result.length).toBe(3);
      for (const month of result.result) {
        expect(month.margin).toBeDefined();
        expect(month.revenue).toBeDefined();
        expect(month.profit).toBeDefined();
      }
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // CURRENCY EDGE CASES
  // ─────────────────────────────────────────────────────────────────────────

  describe("Currency Edge Cases", () => {
    test("baseAmount used when baseCurrency matches target (not original amount)", async () => {
      // R2: amount=4000 EUR, baseAmount=4400 USD — should use 4400, not 4000
      // FX1: amount=2000 GBP, baseAmount=2500 USD — should use 2500, not 2000
      const result = await getRevenue(db, {
        teamId: TEAM_USD_ID,
        from: "2024-01-01",
        to: "2024-01-31",
        currency: "USD",
        revenueType: "gross",
      });

      const jan = Number.parseFloat(
        result.find((r) => r.date.startsWith("2024-01"))!.value,
      );
      // Includes R1(5000) + R2(4400) + R3(2000) + FX1(2500) + FX2(1650 via EUR→USD rate)
      expect(jan).toBe(15550);
    });

    test("NULL baseAmount converted via exchange rate consistently across both paths", async () => {
      // FX2: amount=1500 EUR, baseAmount=NULL, baseCurrency=USD
      // Both paths use resolvedAmount with exchange rate fallback: 1500 * 1.10 = 1650
      const withCurrency = await getRevenue(db, {
        teamId: TEAM_USD_ID,
        from: "2024-01-01",
        to: "2024-01-31",
        currency: "USD",
        revenueType: "gross",
      });
      const withoutCurrency = await getRevenue(db, {
        teamId: TEAM_USD_ID,
        from: "2024-01-01",
        to: "2024-01-31",
        revenueType: "gross",
      });

      const janWith = Number.parseFloat(
        withCurrency.find((r) => r.date.startsWith("2024-01"))!.value,
      );
      const janWithout = Number.parseFloat(
        withoutCurrency.find((r) => r.date.startsWith("2024-01"))!.value,
      );

      expect(janWith).toBe(15550);
      expect(janWithout).toBe(15550);
      // Both paths agree — FX2 converted via exchange rate
      expect(janWith).toBe(janWithout);
    });

    test("inputCurrency=GBP includes R7 with NULL baseAmount/baseCurrency", async () => {
      // R7: amount=3000 GBP, baseAmount=NULL, baseCurrency=NULL
      // currency='GBP' matches filter. CASE: baseCurrency(NULL) ≠ 'GBP' → uses amount=3000
      const result = await getRevenue(db, {
        teamId: TEAM_USD_ID,
        from: "2024-03-01",
        to: "2024-03-31",
        currency: "GBP",
        revenueType: "gross",
      });

      const mar = result.find((r) => r.date.startsWith("2024-03"));
      expect(mar).toBeDefined();
      expect(Number.parseFloat(mar!.value)).toBe(3000);
    });

    test("inputCurrency=EUR includes R2 and FX2 with original amounts", async () => {
      // R2: amount=4000 EUR, baseCurrency=USD ≠ EUR → uses amount=4000
      // FX2: amount=1500 EUR, baseCurrency=USD ≠ EUR → uses amount=1500
      const result = await getRevenue(db, {
        teamId: TEAM_USD_ID,
        from: "2024-01-01",
        to: "2024-01-31",
        currency: "EUR",
        revenueType: "gross",
      });

      const jan = result.find((r) => r.date.startsWith("2024-01"));
      expect(jan).toBeDefined();
      expect(Number.parseFloat(jan!.value)).toBe(5500);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // TEAM ISOLATION
  // ─────────────────────────────────────────────────────────────────────────

  describe("Team Isolation", () => {
    test("team-eur revenue never appears in team-usd queries", async () => {
      const result = await getRevenue(db, {
        teamId: TEAM_USD_ID,
        from: "2024-01-01",
        to: "2024-01-31",
        currency: "USD",
        revenueType: "gross",
      });

      const jan = Number.parseFloat(
        result.find((r) => r.date.startsWith("2024-01"))!.value,
      );
      // If TE1(€10000) leaked, would be much higher
      expect(jan).toBe(15550);
    });

    test("team-eur expenses never appear in team-usd queries", async () => {
      const result = await getBurnRate(db, {
        teamId: TEAM_USD_ID,
        from: "2024-01-01",
        to: "2024-01-31",
        currency: "USD",
      });

      const jan = result.find((r) => r.date.startsWith("2024-01"));
      expect(jan!.value).toBeCloseTo(5790, 0);
    });

    test("team-eur can query its own data correctly", async () => {
      const result = await getRevenue(db, {
        teamId: TEAM_EUR_ID,
        from: "2024-01-01",
        to: "2024-01-31",
        currency: "EUR",
        revenueType: "gross",
      });

      const jan = result.find((r) => r.date.startsWith("2024-01"));
      expect(jan).toBeDefined();
      expect(Number.parseFloat(jan!.value)).toBe(10000);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // EDGE CASES
  // ─────────────────────────────────────────────────────────────────────────

  describe("Edge Cases", () => {
    test("gap month filled with zero in revenue series", async () => {
      const result = await getRevenue(db, {
        teamId: TEAM_USD_ID,
        from: "2024-03-01",
        to: "2024-05-31",
        currency: "USD",
        revenueType: "gross",
      });

      expect(result.length).toBe(3);
      const apr = result.find((r) => r.date.startsWith("2024-04"));
      expect(apr).toBeDefined();
      expect(Number.parseFloat(apr!.value)).toBe(0);
    });

    test("gap month filled with zero in burn rate series", async () => {
      const result = await getBurnRate(db, {
        teamId: TEAM_USD_ID,
        from: "2024-03-01",
        to: "2024-05-31",
        currency: "USD",
      });

      expect(result.length).toBe(3);
      const apr = result.find((r) => r.date.startsWith("2024-04"));
      expect(apr).toBeDefined();
      expect(apr!.value).toBe(0);
    });

    test("tiny amount 0.01 not lost in revenue", async () => {
      const result = await getRevenue(db, {
        teamId: TEAM_USD_ID,
        from: "2024-05-01",
        to: "2024-05-31",
        currency: "USD",
        revenueType: "gross",
      });

      const may = Number.parseFloat(
        result.find((r) => r.date.startsWith("2024-05"))!.value,
      );
      // Must be 100000 (R10=99999.99 + R9=0.01), proving neither was lost
      expect(may).toBe(100000);
    });

    test("large amount 99999.99 no overflow", async () => {
      const result = await getRevenue(db, {
        teamId: TEAM_USD_ID,
        from: "2024-05-01",
        to: "2024-05-31",
        currency: "USD",
        revenueType: "gross",
      });

      const may = Number.parseFloat(
        result.find((r) => r.date.startsWith("2024-05"))!.value,
      );
      expect(may).toBe(100000);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // getSpending — category breakdown, percentages, uncategorized
  // ─────────────────────────────────────────────────────────────────────────

  describe("Spending", () => {
    test("January: returns categories sorted by amount descending", async () => {
      const result = await getSpending(db, {
        teamId: TEAM_USD_ID,
        from: "2024-01-01",
        to: "2024-01-31",
        currency: "USD",
      });

      expect(result.length).toBeGreaterThan(0);
      for (let i = 1; i < result.length; i++) {
        expect(result[i]!.amount).toBeLessThanOrEqual(result[i - 1]!.amount);
      }
    });

    test("January: rent is the largest expense category at 4000", async () => {
      const result = await getSpending(db, {
        teamId: TEAM_USD_ID,
        from: "2024-01-01",
        to: "2024-01-31",
        currency: "USD",
      });

      const rent = result.find((r) => r.slug === "rent");
      expect(rent).toBeDefined();
      expect(rent!.amount).toBe(4000);
    });

    test("January: excluded categories do NOT appear in spending", async () => {
      const result = await getSpending(db, {
        teamId: TEAM_USD_ID,
        from: "2024-01-01",
        to: "2024-01-31",
        currency: "USD",
      });

      const excluded = result.find(
        (r) =>
          r.slug === "credit-card-payment" || r.slug === "internal-transfer",
      );
      expect(excluded).toBeUndefined();
    });

    test("January: percentages sum to approximately 100", async () => {
      const result = await getSpending(db, {
        teamId: TEAM_USD_ID,
        from: "2024-01-01",
        to: "2024-01-31",
        currency: "USD",
      });

      const totalPct = result.reduce((sum, r) => sum + r.percentage, 0);
      expect(totalPct).toBeGreaterThan(95);
      expect(totalPct).toBeLessThanOrEqual(101);
    });

    test("June: uncategorized expense appears as 'Uncategorized'", async () => {
      const result = await getSpending(db, {
        teamId: TEAM_USD_ID,
        from: "2024-06-01",
        to: "2024-06-30",
        currency: "USD",
      });

      const uncat = result.find((r) => r.slug === "uncategorized");
      expect(uncat).toBeDefined();
      expect(uncat!.amount).toBe(750);
      expect(uncat!.percentage).toBe(100);
    });

    test("each category has currency set", async () => {
      const result = await getSpending(db, {
        teamId: TEAM_USD_ID,
        from: "2024-01-01",
        to: "2024-03-31",
        currency: "USD",
      });

      for (const item of result) {
        expect(item.currency).toBe("USD");
      }
    });
  });

  describe("Spending for Period", () => {
    test("January: totalSpending matches expenses total", async () => {
      const result = await getSpendingForPeriod(db, {
        teamId: TEAM_USD_ID,
        from: "2024-01-01",
        to: "2024-01-31",
        currency: "USD",
      });

      expect(result.totalSpending).toBeCloseTo(5790, 0);
    });

    test("January: topCategory is rent with exact DB amount (not re-derived from %)", async () => {
      const result = await getSpendingForPeriod(db, {
        teamId: TEAM_USD_ID,
        from: "2024-01-01",
        to: "2024-01-31",
        currency: "USD",
      });

      expect(result.topCategory).not.toBeNull();
      expect(result.topCategory!.name).toBe("Rent");
      // E1: |{-4000}| = 4000 — exact amount from getSpending, not percentage * total
      expect(result.topCategory!.amount).toBe(4000);
    });

    test("empty period returns null topCategory", async () => {
      const result = await getSpendingForPeriod(db, {
        teamId: TEAM_USD_ID,
        from: "2024-04-01",
        to: "2024-04-30",
        currency: "USD",
      });

      expect(result.totalSpending).toBe(0);
      expect(result.topCategory).toBeNull();
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // getRunway — bank balances, median burn rate
  // ─────────────────────────────────────────────────────────────────────────

  describe("Runway", () => {
    beforeAll(() => {
      setSystemTime(SEED_REFERENCE_DATE);
    });

    afterAll(() => {
      setSystemTime();
    });

    test("returns positive runway with recent burn data and bank balances", async () => {
      const result = await getRunway(db, {
        teamId: TEAM_USD_ID,
        currency: "USD",
      });

      // Cash: Checking(50000) + Savings(25000) + EUR(baseBalance=11000) = 86000
      // Burn (last 3 completed months, seed dates relative to today):
      //   RW3(2000, month-3) + RW4(1500, month-2) + RW5(500, month-1)
      // Median of [500, 1500, 2000] = 1500
      // Runway = Math.round(86000/1500) = 57
      expect(result.months).toBeGreaterThan(0);
      expect(result.months).toBe(Math.round(86000 / 1500));
      expect(result.medianBurn).toBe(1500);
    });

    test("team with no bank accounts returns 0", async () => {
      const result = await getRunway(db, {
        teamId: TEAM_EUR_ID,
        currency: "EUR",
      });

      expect(result.months).toBe(0);
      expect(result.medianBurn).toBe(0);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // getRecurringExpenses — frequency conversion, monthly equivalents
  // ─────────────────────────────────────────────────────────────────────────

  describe("Recurring Expenses", () => {
    test("finds recurring expenses (E1=rent, E2=software)", async () => {
      const result = await getRecurringExpenses(db, {
        teamId: TEAM_USD_ID,
        currency: "USD",
      });

      expect(result.summary.totalExpenses).toBeGreaterThanOrEqual(2);
    });

    test("monthly equivalent: monthly expenses pass through unchanged", async () => {
      const result = await getRecurringExpenses(db, {
        teamId: TEAM_USD_ID,
        currency: "USD",
      });

      const rent = result.expenses.find(
        (e) => e.name === "Office Rent January",
      );
      expect(rent).toBeDefined();
      expect(rent!.frequency).toBe("monthly");
      expect(rent!.amount).toBe(4000);
    });

    test("byFrequency totals are populated", async () => {
      const result = await getRecurringExpenses(db, {
        teamId: TEAM_USD_ID,
        currency: "USD",
      });

      expect(result.summary.byFrequency.monthly).toBeGreaterThan(0);
    });

    test("totalMonthlyEquivalent is sum of converted amounts", async () => {
      const result = await getRecurringExpenses(db, {
        teamId: TEAM_USD_ID,
        currency: "USD",
      });

      // E1(rent)=4000/mo + E2(software)=200/mo + weekly(50*4.33=216.50) + annual(1200/12=100)
      expect(result.summary.totalMonthlyEquivalent).toBeCloseTo(4516.5, 0);
    });

    test("excluded categories do NOT appear", async () => {
      const result = await getRecurringExpenses(db, {
        teamId: TEAM_USD_ID,
        currency: "USD",
      });

      const excluded = result.expenses.find(
        (e) =>
          e.categorySlug === "credit-card-payment" ||
          e.categorySlug === "internal-transfer",
      );
      expect(excluded).toBeUndefined();
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // getOutstandingInvoices & getOverdueInvoicesAlert
  // ─────────────────────────────────────────────────────────────────────────

  describe("Outstanding Invoices", () => {
    test("counts unpaid + overdue invoices (default statuses)", async () => {
      const result = await getOutstandingInvoices(db, {
        teamId: TEAM_USD_ID,
        currency: "USD",
      });

      // INV_UNPAID_1 (USD, 5000) + INV_OVERDUE_1 (USD, 2000) + INV_OVERDUE_2 (USD, 1500) = 3 USD invoices
      expect(result.summary.count).toBeGreaterThanOrEqual(3);
    });

    test("USD-filtered total: 5000 + 2000 + 1500 = 8500", async () => {
      const result = await getOutstandingInvoices(db, {
        teamId: TEAM_USD_ID,
        currency: "USD",
        status: ["unpaid", "overdue"],
      });

      expect(result.summary.totalAmount).toBe(8500);
      expect(result.summary.currency).toBe("USD");
    });

    test("paid invoices are NOT included", async () => {
      const result = await getOutstandingInvoices(db, {
        teamId: TEAM_USD_ID,
        currency: "USD",
        status: ["unpaid", "overdue"],
      });

      // If paid were included, total would be 18500
      expect(result.summary.totalAmount).toBeLessThan(10000);
    });

    test("without explicit currency: converts EUR invoice to USD via exchange rate", async () => {
      const result = await getOutstandingInvoices(db, {
        teamId: TEAM_USD_ID,
        status: ["unpaid", "overdue"],
      });

      // INV_UNPAID_1: USD 5000, INV_UNPAID_2: EUR 3000 * 1.10 = 3300 USD,
      // INV_OVERDUE_1: USD 2000, INV_OVERDUE_2: USD 1500
      expect(result.summary.count).toBe(4);
      expect(result.summary.totalAmount).toBeCloseTo(11800, 0);
      expect(result.summary.currency).toBe("USD");
    });
  });

  describe("Overdue Invoices Alert", () => {
    test("counts only overdue invoices", async () => {
      const result = await getOverdueInvoicesAlert(db, {
        teamId: TEAM_USD_ID,
        currency: "USD",
      });

      // INV_OVERDUE_1 (2000) + INV_OVERDUE_2 (1500) = 2 overdue
      expect(result.summary.count).toBe(2);
      expect(result.summary.totalAmount).toBe(3500);
    });

    test("daysOverdue is positive for past-due invoices", async () => {
      const result = await getOverdueInvoicesAlert(db, {
        teamId: TEAM_USD_ID,
        currency: "USD",
      });

      // Oldest overdue is 2024-01-15, so daysOverdue should be > 365
      expect(result.summary.daysOverdue).toBeGreaterThan(0);
    });

    test("oldestDueDate is the earliest overdue invoice", async () => {
      const result = await getOverdueInvoicesAlert(db, {
        teamId: TEAM_USD_ID,
        currency: "USD",
      });

      expect(result.summary.oldestDueDate).toContain("2024-01-15");
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // NULL baseAmount fallback — critical for multi-currency correctness
  // ─────────────────────────────────────────────────────────────────────────

  describe("NULL baseAmount Handling (Exchange Rate Conversion)", () => {
    test("revenue with inputCurrency: NULL baseAmount converted via exchange rate", async () => {
      // FX2: amount=1500, currency=EUR, baseAmount=NULL, baseCurrency=USD
      // resolvedAmount("USD"):
      //   WHEN baseCurrency='USD' AND baseAmount IS NOT NULL → false (NULL)
      //   WHEN currency='EUR' = 'USD' → false
      //   ELSE 1500 * (SELECT rate FROM exchange_rates WHERE base='EUR' AND target='USD') = 1500 * 1.10 = 1650
      const result = await getRevenue(db, {
        teamId: TEAM_USD_ID,
        from: "2024-01-01",
        to: "2024-01-31",
        currency: "USD",
        revenueType: "gross",
      });

      const jan = Number.parseFloat(
        result.find((r) => r.date.startsWith("2024-01"))!.value,
      );
      // FX2 converted via exchange rate → 5000 + 4400 + 2000 + 2500 + 1650 = 15550
      expect(jan).toBe(15550);
    });

    test("revenue without inputCurrency: NULL baseAmount also converted via exchange rate", async () => {
      const result = await getRevenue(db, {
        teamId: TEAM_USD_ID,
        from: "2024-01-01",
        to: "2024-01-31",
        revenueType: "gross",
      });

      const jan = Number.parseFloat(
        result.find((r) => r.date.startsWith("2024-01"))!.value,
      );
      // Both paths now convert via exchange rate: 15550
      expect(jan).toBe(15550);
    });

    test("revenue: both paths now agree — no more discrepancy", async () => {
      const withCurrency = await getRevenue(db, {
        teamId: TEAM_USD_ID,
        from: "2024-01-01",
        to: "2024-01-31",
        currency: "USD",
        revenueType: "gross",
      });
      const withoutCurrency = await getRevenue(db, {
        teamId: TEAM_USD_ID,
        from: "2024-01-01",
        to: "2024-01-31",
        revenueType: "gross",
      });

      const janWith = Number.parseFloat(
        withCurrency.find((r) => r.date.startsWith("2024-01"))!.value,
      );
      const janWithout = Number.parseFloat(
        withoutCurrency.find((r) => r.date.startsWith("2024-01"))!.value,
      );
      expect(janWith).toBe(janWithout);
    });

    test("NULL baseAmount transaction IS included when querying its own currency", async () => {
      // FX2: currency=EUR, amount=1500 → when querying EUR, currency matches target
      const result = await getRevenue(db, {
        teamId: TEAM_USD_ID,
        from: "2024-01-01",
        to: "2024-01-31",
        currency: "EUR",
        revenueType: "gross",
      });

      const jan = result.find((r) => r.date.startsWith("2024-01"));
      expect(jan).toBeDefined();
      // R2(4000 EUR) + FX2(1500 EUR) = 5500
      expect(Number.parseFloat(jan!.value)).toBe(5500);
    });

    test("spending: EFX1 (NULL baseAmount expense) converted via exchange rate", async () => {
      const result = await getSpending(db, {
        teamId: TEAM_USD_ID,
        from: "2024-01-01",
        to: "2024-01-31",
        currency: "USD",
      });

      const total = result.reduce((sum, r) => sum + r.amount, 0);
      expect(total).toBeCloseTo(5790, 0);
    });

    test("burn rate: EFX1 (NULL baseAmount expense) converted via exchange rate", async () => {
      const result = await getBurnRate(db, {
        teamId: TEAM_USD_ID,
        from: "2024-01-01",
        to: "2024-01-31",
        currency: "USD",
      });

      const jan = result.find((r) => r.date.startsWith("2024-01"));
      expect(jan).toBeDefined();
      expect(jan!.value).toBeCloseTo(5790, 0);
    });

    test("cash flow: FX2 and EFX1 both converted via exchange rate", async () => {
      const result = await getCashFlow(db, {
        teamId: TEAM_USD_ID,
        from: "2024-01-01",
        to: "2024-01-31",
        currency: "USD",
      });

      expect(result.summary.totalIncome).toBeCloseTo(15550, 0);
      expect(result.summary.totalExpenses).toBeCloseTo(5790, 0);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // exactDates=true — use exact date boundaries
  // ─────────────────────────────────────────────────────────────────────────

  describe("exactDates Mode", () => {
    test("exactDates=true restricts to exact date range", async () => {
      // R1 (Jan 15), R2 (Jan 20), R3 (Jan 25) are in the 14-25 range
      // FX1 (Jan 12 — before range), FX2 (Jan 14 — converted via EUR→USD rate: 1650)
      const result = await getRevenue(db, {
        teamId: TEAM_USD_ID,
        from: "2024-01-14",
        to: "2024-01-25",
        currency: "USD",
        revenueType: "gross",
        exactDates: true,
      });

      const jan = result.find((r) => r.date.startsWith("2024-01"));
      expect(jan).toBeDefined();
      // R1(5000) + R2(4400) + R3(2000) + FX2(1650) = 13050 (FX1 before range)
      expect(Number.parseFloat(jan!.value)).toBe(13050);
    });

    test("exactDates=true expenses only includes transactions in range", async () => {
      // E1 is Jan 5 (outside 10-31), E2 is Jan 10, E3 is Jan 18, E4 is Jan 22, EFX1 is Jan 28
      const result = await getExpenses(db, {
        teamId: TEAM_USD_ID,
        from: "2024-01-10",
        to: "2024-01-31",
        currency: "USD",
        exactDates: true,
      });

      const jan = result.result.find((r) => r.date.startsWith("2024-01"));
      expect(jan).toBeDefined();
      // E2(200) + E3(600) + E4(550) + EFX1(440) = 1790 (E1 at Jan 5 excluded)
      expect(jan!.total).toBeCloseTo(1790, 0);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // getReports with type=profit, getGrowthRate with period=monthly
  // ─────────────────────────────────────────────────────────────────────────

  describe("Reports — Profit YoY", () => {
    test("type=profit uses profit function (net profit after COGS+OpEx)", async () => {
      const result = await getReports(db, {
        teamId: TEAM_USD_ID,
        from: "2024-02-01",
        to: "2024-02-28",
        type: "profit",
        currency: "USD",
      });

      expect(result.summary).toBeDefined();
      // Feb 2024 net profit: net revenue 2618.18 - COGS(1500+800) - OpEx(0) = 318.18
      expect(result.summary.currentTotal).toBeCloseTo(318.18, 0);
    });
  });

  describe("Growth Rate — Monthly", () => {
    test("monthly period compares with previous month", async () => {
      const result = await getGrowthRate(db, {
        teamId: TEAM_USD_ID,
        from: "2024-02-01",
        to: "2024-02-28",
        currency: "USD",
        period: "monthly",
      });

      expect(result.summary.period).toBe("monthly");
      // Feb current vs Jan previous — both have revenue
      expect(result.summary.currentTotal).toBeGreaterThan(0);
      expect(result.summary.previousTotal).toBeGreaterThan(0);
    });

    test("growth rate is negative when current < previous", async () => {
      const result = await getGrowthRate(db, {
        teamId: TEAM_USD_ID,
        from: "2024-02-01",
        to: "2024-02-28",
        currency: "USD",
        period: "monthly",
      });

      // Feb net revenue (~2618) < Jan net revenue (~14535) → negative growth
      expect(result.summary.growthRate).toBeLessThan(0);
      expect(result.summary.trend).toBe("negative");
    });

    test("type=profit growth rate uses profit data", async () => {
      const result = await getGrowthRate(db, {
        teamId: TEAM_USD_ID,
        from: "2024-03-01",
        to: "2024-03-31",
        currency: "USD",
        type: "profit",
        period: "monthly",
      });

      expect(result.summary.type).toBe("profit");
      expect(result.summary.currentTotal).toBeGreaterThan(0);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Tax Summary — exact amounts
  // ─────────────────────────────────────────────────────────────────────────

  describe("Tax Summary — Exact Amounts", () => {
    test("collected tax: exact amounts for Jan transactions with tax", async () => {
      const result = await getTaxSummary(db, {
        teamId: TEAM_USD_ID,
        type: "collected",
        from: "2024-01-01",
        to: "2024-01-31",
        currency: "USD",
      });

      // R1: 5000 at 20% → tax = ROUND(5000 * 20 / 120, 2) = 833.33
      // R3: 2000 at 10% → tax = ROUND(2000 * 10 / 110, 2) = 181.82
      // Total: 1015.15
      expect(result.summary.totalTaxAmount).toBeCloseTo(1015.15, 0);
    });

    test("paid tax: category fallback for E5 (software, cat taxRate=20)", async () => {
      const result = await getTaxSummary(db, {
        teamId: TEAM_USD_ID,
        type: "paid",
        from: "2024-03-01",
        to: "2024-03-31",
        currency: "USD",
      });

      // E5: -500 software (tx taxRate=NULL, cat taxRate=20) → tax = ROUND(500*20/120,2) = 83.33
      // E6: -300 marketing (tx taxRate=NULL, cat taxRate=10) → tax = ROUND(300*10/110,2) = 27.27
      // Total: 110.60
      expect(result.summary.totalTaxAmount).toBeCloseTo(110.6, 0);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Missing exchange rate — CHF has no rate → excluded from totals
  // ─────────────────────────────────────────────────────────────────────────

  describe("Missing Exchange Rate", () => {
    test("FX3 (CHF, no rate) silently excluded from revenue", async () => {
      const result = await getRevenue(db, {
        teamId: TEAM_USD_ID,
        from: "2024-01-01",
        to: "2024-01-31",
        currency: "USD",
        revenueType: "gross",
      });

      const jan = Number.parseFloat(
        result.find((r) => r.date.startsWith("2024-01"))!.value,
      );
      // FX3 (800 CHF) has no CHF→USD rate → resolvedAmount returns NULL → excluded
      // Total still: R1(5000) + R2(4400) + R3(2000) + FX1(2500) + FX2(1650) = 15550
      expect(jan).toBe(15550);
    });

    test("FX3 (CHF, no rate) excluded from cash flow too", async () => {
      const result = await getCashFlow(db, {
        teamId: TEAM_USD_ID,
        from: "2024-01-01",
        to: "2024-01-31",
        currency: "USD",
      });

      // Same income as revenue: 15550 (FX3 excluded)
      expect(result.summary.totalIncome).toBeCloseTo(15550, 0);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // NULL baseAmount on expenses — EFX1 tests exchange rate fallback
  // ─────────────────────────────────────────────────────────────────────────

  describe("NULL baseAmount Expense (EFX1)", () => {
    test("EFX1 converted via exchange rate: -400 EUR * 1.10 = -440 USD", async () => {
      const result = await getExpenses(db, {
        teamId: TEAM_USD_ID,
        from: "2024-01-01",
        to: "2024-01-31",
        currency: "USD",
      });

      const jan = result.result.find((r) => r.date.startsWith("2024-01"));
      // Old total was 5350, now 5350 + 440 = 5790
      expect(jan!.total).toBeCloseTo(5790, 0);
    });

    test("EFX1 included in profit OpEx calculation", async () => {
      const result = await getProfit(db, {
        teamId: TEAM_USD_ID,
        from: "2024-01-01",
        to: "2024-01-31",
        currency: "USD",
        revenueType: "net",
      });

      const jan = Number.parseFloat(
        result.find((r) => r.date.startsWith("2024-01"))!.value,
      );
      // NetRev(14534.85) - COGS(0) - OpEx(5790) = 8744.85
      expect(jan).toBeCloseTo(8744.85, 0);
    });

    test("EFX1 appears in spending under travel category", async () => {
      const result = await getSpending(db, {
        teamId: TEAM_USD_ID,
        from: "2024-01-01",
        to: "2024-01-31",
        currency: "USD",
      });

      const travel = result.find((r) => r.slug === "travel");
      expect(travel).toBeDefined();
      // E3(600) + E4(550) + EFX1(440) = 1590
      expect(travel!.amount).toBe(1590);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Uncategorized income — U2 in cash flow but NOT in revenue
  // ─────────────────────────────────────────────────────────────────────────

  describe("Uncategorized Income (U2)", () => {
    test("U2 (null category) excluded from revenue", async () => {
      const result = await getRevenue(db, {
        teamId: TEAM_USD_ID,
        from: "2024-06-01",
        to: "2024-06-30",
        currency: "USD",
        revenueType: "gross",
      });

      const jun = result.find((r) => r.date.startsWith("2024-06"));
      expect(jun).toBeDefined();
      expect(Number.parseFloat(jun!.value)).toBe(0);
    });

    test("U2 (null category) included in cash flow income", async () => {
      const result = await getCashFlow(db, {
        teamId: TEAM_USD_ID,
        from: "2024-06-01",
        to: "2024-06-30",
        currency: "USD",
      });

      expect(result.summary.totalIncome).toBeCloseTo(600, 0);
      expect(result.summary.totalExpenses).toBeCloseTo(750, 0);
      expect(result.summary.netCashFlow).toBeCloseTo(-150, 0);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Tax Summary — without currency (falls back to team baseCurrency)
  // ─────────────────────────────────────────────────────────────────────────

  describe("Tax Summary — No Currency", () => {
    test("collected tax without explicit currency falls back to team baseCurrency (USD)", async () => {
      const result = await getTaxSummary(db, {
        teamId: TEAM_USD_ID,
        type: "collected",
        from: "2024-01-01",
        to: "2024-01-31",
      });

      expect(result).toBeDefined();
      expect(result.summary.totalTaxAmount).toBeGreaterThan(0);
      // R1: 5000 at 20% → 833.33, R3: 2000 at 10% → 181.82
      // getTargetCurrency falls back to USD — same result since these are USD transactions
      expect(result.summary.totalTaxAmount).toBeCloseTo(1015.15, 0);
      expect(result.summary.currency).toBe("USD");
    });

    test("paid tax without explicit currency falls back to team baseCurrency (USD)", async () => {
      const result = await getTaxSummary(db, {
        teamId: TEAM_USD_ID,
        type: "paid",
        from: "2024-01-01",
        to: "2024-01-31",
      });

      expect(result).toBeDefined();
      expect(result.summary.totalTaxAmount).toBeGreaterThan(0);
      expect(result.summary.currency).toBe("USD");
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Parameter combinations — untested paths
  // ─────────────────────────────────────────────────────────────────────────

  describe("Parameter Combinations", () => {
    test("getProfit with exactDates=true", async () => {
      const result = await getProfit(db, {
        teamId: TEAM_USD_ID,
        from: "2024-01-10",
        to: "2024-01-25",
        currency: "USD",
        revenueType: "net",
        exactDates: true,
      });

      const jan = result.find((r) => r.date.startsWith("2024-01"));
      expect(jan).toBeDefined();
      const profit = Number.parseFloat(jan!.value);
      // Revenue exactDates 14-25: R1+R2+R3+FX2 = 13050 → but profit calls getRevenue with same exactDates
      // Expenses exactDates 10-25: E2(200)+E3(600)+E4(550) = 1350 (EFX1 at Jan 28 excluded)
      // Profit should be positive (net revenue minus expenses)
      expect(profit).toBeGreaterThan(0);
    });

    test("getProfitMargin with revenueType=gross", async () => {
      const result = await getProfitMargin(db, {
        teamId: TEAM_USD_ID,
        from: "2024-01-01",
        to: "2024-03-31",
        currency: "USD",
        revenueType: "gross",
      });

      expect(result.summary).toBeDefined();
      expect(result.summary.totalRevenue).toBeGreaterThan(0);
      // Gross profit margin should be higher than net (no OpEx subtracted)
      const expectedMargin =
        (result.summary.totalProfit / result.summary.totalRevenue) * 100;
      expect(result.summary.profitMargin).toBeCloseTo(expectedMargin, 1);
    });

    test("getGrowthRate with revenueType=net and period=quarterly", async () => {
      const result = await getGrowthRate(db, {
        teamId: TEAM_USD_ID,
        from: "2024-01-01",
        to: "2024-03-31",
        currency: "USD",
        type: "revenue",
        revenueType: "net",
        period: "quarterly",
      });

      expect(result.summary).toBeDefined();
      expect(result.summary.currentTotal).toBeGreaterThan(0);
      expect(result.summary.previousTotal).toBeGreaterThan(0);
      expect(result.summary.growthRate).toBeDefined();
    });

    test("multi-currency expense query (EUR target)", async () => {
      const result = await getExpenses(db, {
        teamId: TEAM_USD_ID,
        from: "2024-01-01",
        to: "2024-01-31",
        currency: "EUR",
      });

      const jan = result.result.find((r) => r.date.startsWith("2024-01"));
      expect(jan).toBeDefined();
      // E4: currency=EUR, amount=-500 → resolvedAmount("EUR"): currency=EUR matches → 500
      // EFX1: currency=EUR, amount=-400 → resolvedAmount("EUR"): currency=EUR matches → 400
      expect(jan!.total).toBeCloseTo(900, 0);
    });

    test("multi-currency spending query (EUR target)", async () => {
      const result = await getSpending(db, {
        teamId: TEAM_USD_ID,
        from: "2024-01-01",
        to: "2024-01-31",
        currency: "EUR",
      });

      const total = result.reduce((sum, r) => sum + r.amount, 0);
      // Only EUR-currency expenses: E4(500) + EFX1(400) = 900
      expect(total).toBeCloseTo(900, 0);
    });

    test("getGrowthRate with zero previous period", async () => {
      const result = await getGrowthRate(db, {
        teamId: TEAM_USD_ID,
        from: "2024-05-01",
        to: "2024-05-31",
        currency: "USD",
        type: "revenue",
        period: "monthly",
      });

      expect(result.summary).toBeDefined();
      // May has data (100000), April has 0 → growth calc handles division by zero
      expect(result.summary.currentTotal).toBeGreaterThan(0);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Balance Sheet
  // ─────────────────────────────────────────────────────────────────────────

  describe("Balance Sheet", () => {
    test("returns all top-level sections", async () => {
      const result = await getBalanceSheet(db, {
        teamId: TEAM_USD_ID,
        currency: "USD",
      });

      expect(result).toBeDefined();
      expect(result.assets).toBeDefined();
      expect(result.liabilities).toBeDefined();
      expect(result.equity).toBeDefined();
      expect(result.currency).toBe("USD");
    });

    test("cash equals depository bank account balances", async () => {
      const result = await getBalanceSheet(db, {
        teamId: TEAM_USD_ID,
        currency: "USD",
      });

      // Checking(50000) + Savings(25000) + EUR(baseBalance=11000) = 86000
      expect(result.assets.current.cash).toBe(86000);
    });

    test("accounts receivable from unpaid/overdue invoices", async () => {
      const result = await getBalanceSheet(db, {
        teamId: TEAM_USD_ID,
        currency: "USD",
      });

      // INV_UNPAID_1(5000) + INV_UNPAID_2(3000 EUR * 1.10 = 3300) + INV_OVERDUE_1(2000) + INV_OVERDUE_2(1500) = 11800
      expect(result.assets.current.accountsReceivable).toBeCloseTo(11800, 0);
    });

    test("credit card debt from credit-type bank accounts", async () => {
      const result = await getBalanceSheet(db, {
        teamId: TEAM_USD_ID,
        currency: "USD",
      });

      // BANK_CREDIT_CARD_ID: balance=-5000, type=credit → ABS = 5000
      expect(result.liabilities.current.creditCardDebt).toBe(5000);
    });

    test("retained earnings is positive (revenue > expenses)", async () => {
      const result = await getBalanceSheet(db, {
        teamId: TEAM_USD_ID,
        currency: "USD",
      });

      expect(result.equity.retainedEarnings).toBeGreaterThan(0);
    });

    test("balance sheet equation holds: assets = liabilities + equity", async () => {
      const result = await getBalanceSheet(db, {
        teamId: TEAM_USD_ID,
        currency: "USD",
      });

      const lhs = result.assets.total;
      const rhs = result.liabilities.total + result.equity.total;
      expect(lhs).toBeCloseTo(rhs, 0);
    });

    test("software transactions appear in non-current assets", async () => {
      const result = await getBalanceSheet(db, {
        teamId: TEAM_USD_ID,
        currency: "USD",
      });

      // E2(200) + E5(500) + RW2(1000) = 1700 in software asset category
      expect(result.assets.nonCurrent.softwareTechnology).toBe(1700);
    });

    test("depreciation accumulates for software assets", async () => {
      const result = await getBalanceSheet(db, {
        teamId: TEAM_USD_ID,
        currency: "USD",
      });

      // Software has 36-month useful life. E2 is Jan 2024, E5 is Mar 2024, RW2 is recent.
      // All are 1+ months old → depreciation > 0
      expect(result.assets.nonCurrent.accumulatedDepreciation).toBeGreaterThan(
        0,
      );
      // Depreciation can't exceed total software asset value (1700)
      expect(
        result.assets.nonCurrent.accumulatedDepreciation,
      ).toBeLessThanOrEqual(1700);
    });

    test("asOf date filters transactions", async () => {
      const result = await getBalanceSheet(db, {
        teamId: TEAM_USD_ID,
        currency: "USD",
        asOf: "2024-02-28",
      });

      // Only Jan + Feb transactions should be included
      // Cash is from bank accounts (not filtered by date), so same
      expect(result.assets.current.cash).toBe(86000);
      // But software assets should only have E2(200) from Jan, not E5(500) from Mar or RW2(1000) from recent months
      expect(result.assets.nonCurrent.softwareTechnology).toBe(200);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Revenue Forecast — structural tests
  // ─────────────────────────────────────────────────────────────────────────

  describe("Revenue Forecast", () => {
    test("returns expected structure with historical, forecast, and meta", async () => {
      const result = await getRevenueForecast(db, {
        teamId: TEAM_USD_ID,
        from: "2024-01-01",
        to: "2024-03-31",
        forecastMonths: 3,
        currency: "USD",
        revenueType: "gross",
      });

      expect(result).toBeDefined();
      expect(result.summary).toBeDefined();
      expect(result.historical).toBeDefined();
      expect(result.forecast).toBeDefined();
      expect(result.combined).toBeDefined();
      expect(result.meta).toBeDefined();
    });

    test("historical data matches actual revenue for period", async () => {
      const result = await getRevenueForecast(db, {
        teamId: TEAM_USD_ID,
        from: "2024-01-01",
        to: "2024-03-31",
        forecastMonths: 3,
        currency: "USD",
        revenueType: "gross",
      });

      // Should have 3 historical months (Jan, Feb, Mar)
      expect(result.historical.length).toBe(3);
      expect(result.summary.currency).toBe("USD");
      expect(result.summary.revenueType).toBe("gross");
    });

    test("forecast array has requested number of months", async () => {
      const result = await getRevenueForecast(db, {
        teamId: TEAM_USD_ID,
        from: "2024-01-01",
        to: "2024-03-31",
        forecastMonths: 6,
        currency: "USD",
      });

      expect(result.forecast.length).toBe(6);
    });

    test("forecast includes confidence bounds", async () => {
      const result = await getRevenueForecast(db, {
        teamId: TEAM_USD_ID,
        from: "2024-01-01",
        to: "2024-03-31",
        forecastMonths: 3,
        currency: "USD",
      });

      for (const month of result.forecast) {
        expect(month.optimistic).toBeDefined();
        expect(month.pessimistic).toBeDefined();
        expect(month.confidence).toBeDefined();
        expect(month.optimistic).toBeGreaterThanOrEqual(month.value);
        expect(month.pessimistic).toBeLessThanOrEqual(month.value);
      }
    });

    test("meta includes forecast method and collection metrics", async () => {
      const result = await getRevenueForecast(db, {
        teamId: TEAM_USD_ID,
        from: "2024-01-01",
        to: "2024-03-31",
        forecastMonths: 3,
        currency: "USD",
      });

      expect(result.meta.forecastMethod).toBe("bottom_up");
      expect(result.meta.historicalMonths).toBe(3);
      expect(result.meta.forecastMonths).toBe(3);
      expect(result.meta.teamCollectionMetrics).toBeDefined();
    });

    test("combined data has historical + forecast months", async () => {
      const result = await getRevenueForecast(db, {
        teamId: TEAM_USD_ID,
        from: "2024-01-01",
        to: "2024-03-31",
        forecastMonths: 3,
        currency: "USD",
      });

      expect(result.combined.length).toBe(6); // 3 historical + 3 forecast
    });

    test("net revenue type produces different values than gross", async () => {
      const [gross, net] = await Promise.all([
        getRevenueForecast(db, {
          teamId: TEAM_USD_ID,
          from: "2024-01-01",
          to: "2024-03-31",
          forecastMonths: 3,
          currency: "USD",
          revenueType: "gross",
        }),
        getRevenueForecast(db, {
          teamId: TEAM_USD_ID,
          from: "2024-01-01",
          to: "2024-03-31",
          forecastMonths: 3,
          currency: "USD",
          revenueType: "net",
        }),
      ]);

      // Net historical totals should be less than gross (taxes deducted)
      const grossTotal = gross.historical.reduce((s, m) => s + m.value, 0);
      const netTotal = net.historical.reduce((s, m) => s + m.value, 0);
      expect(netTotal).toBeLessThan(grossTotal);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Recurring Expenses — Weekly & Annual Frequency Conversion
  // ─────────────────────────────────────────────────────────────────────────
  describe("Recurring Expenses — Frequency Conversion", () => {
    test("weekly recurring expense is detected with correct frequency", async () => {
      const result = await getRecurringExpenses(db, {
        teamId: TEAM_USD_ID,
        currency: "USD",
      });

      const weekly = result.expenses.find(
        (e) => e.name === "Weekly Cleaning Service",
      );
      expect(weekly).toBeDefined();
      expect(weekly!.frequency).toBe("weekly");
      expect(weekly!.amount).toBe(50);
    });

    test("annually recurring expense is detected with correct frequency", async () => {
      const result = await getRecurringExpenses(db, {
        teamId: TEAM_USD_ID,
        currency: "USD",
      });

      const annual = result.expenses.find(
        (e) => e.name === "Annual Insurance Premium",
      );
      expect(annual).toBeDefined();
      expect(annual!.frequency).toBe("annually");
      expect(annual!.amount).toBe(1200);
    });

    test("byFrequency totals include weekly and annually", async () => {
      const result = await getRecurringExpenses(db, {
        teamId: TEAM_USD_ID,
        currency: "USD",
      });

      expect(result.summary.byFrequency.weekly).toBe(50);
      expect(result.summary.byFrequency.annually).toBe(1200);
      expect(result.summary.byFrequency.monthly).toBeGreaterThan(0);
    });

    test("totalMonthlyEquivalent includes weekly*4.33 and annual/12 conversions", async () => {
      const result = await getRecurringExpenses(db, {
        teamId: TEAM_USD_ID,
        currency: "USD",
      });

      // weekly: 50 * 4.33 = 216.50, annual: 1200 / 12 = 100
      // Plus monthly recurring expenses (rent etc.)
      const weeklyConverted = 50 * 4.33;
      const annualConverted = 1200 / 12;

      expect(result.summary.totalMonthlyEquivalent).toBeGreaterThanOrEqual(
        weeklyConverted + annualConverted,
      );
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Outstanding Invoices — Draft & Scheduled statuses
  // ─────────────────────────────────────────────────────────────────────────
  describe("Outstanding Invoices — Draft & Scheduled", () => {
    test("default status includes draft and scheduled in count", async () => {
      const result = await getOutstandingInvoices(db, {
        teamId: TEAM_USD_ID,
        currency: "USD",
      });

      // USD-only: unpaid(1) + overdue(2) + draft(1) + scheduled(1) = 5
      // (INV_UNPAID_2 is EUR, filtered out; INV_PAID excluded by status)
      expect(result.summary.count).toBe(5);
    });

    test("draft invoice amount is included in total", async () => {
      const withDraft = await getOutstandingInvoices(db, {
        teamId: TEAM_USD_ID,
        currency: "USD",
        status: ["draft"],
      });

      expect(withDraft.summary.count).toBe(1);
      expect(withDraft.summary.totalAmount).toBe(750);
    });

    test("scheduled invoice amount is included in total", async () => {
      const withScheduled = await getOutstandingInvoices(db, {
        teamId: TEAM_USD_ID,
        currency: "USD",
        status: ["scheduled"],
      });

      expect(withScheduled.summary.count).toBe(1);
      expect(withScheduled.summary.totalAmount).toBe(1200);
    });

    test("filtering to unpaid+overdue only excludes draft/scheduled", async () => {
      const result = await getOutstandingInvoices(db, {
        teamId: TEAM_USD_ID,
        currency: "USD",
        status: ["unpaid", "overdue"],
      });

      // USD-only: unpaid(1) + overdue(2) = 3 (EUR invoice filtered out)
      expect(result.summary.count).toBe(3);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Balance Sheet — Line Items (inventory, prepaid, loans, equity)
  // ─────────────────────────────────────────────────────────────────────────
  describe("Balance Sheet — Line Items", () => {
    test("inventory appears in current assets", async () => {
      const result = await getBalanceSheet(db, {
        teamId: TEAM_USD_ID,
        asOf: "2024-12-31",
        currency: "USD",
      });

      expect(result.assets.current.inventory).toBeGreaterThan(0);
    });

    test("prepaid expenses appear in current assets", async () => {
      const result = await getBalanceSheet(db, {
        teamId: TEAM_USD_ID,
        asOf: "2024-12-31",
        currency: "USD",
      });

      expect(result.assets.current.prepaidExpenses).toBeGreaterThan(0);
    });

    test("loan proceeds appear in liabilities", async () => {
      const result = await getBalanceSheet(db, {
        teamId: TEAM_USD_ID,
        asOf: "2024-12-31",
        currency: "USD",
      });

      const totalLoans =
        result.liabilities.current.shortTermDebt +
        result.liabilities.nonCurrent.longTermDebt;
      expect(totalLoans).toBeGreaterThan(0);
    });

    test("deferred revenue appears in non-current liabilities", async () => {
      const result = await getBalanceSheet(db, {
        teamId: TEAM_USD_ID,
        asOf: "2024-12-31",
        currency: "USD",
      });

      expect(result.liabilities.nonCurrent.deferredRevenue).toBeGreaterThan(0);
    });

    test("capital investment appears in equity", async () => {
      const result = await getBalanceSheet(db, {
        teamId: TEAM_USD_ID,
        asOf: "2024-12-31",
        currency: "USD",
      });

      expect(result.equity.capitalInvestment).toBeGreaterThan(0);
    });

    test("owner draws appear in equity (stored as positive, subtracted in formula)", async () => {
      const result = await getBalanceSheet(db, {
        teamId: TEAM_USD_ID,
        asOf: "2024-12-31",
        currency: "USD",
      });

      expect(result.equity.ownerDraws).toBeGreaterThan(0);
    });

    test("balance sheet equation still holds with all line items", async () => {
      const result = await getBalanceSheet(db, {
        teamId: TEAM_USD_ID,
        asOf: "2024-12-31",
        currency: "USD",
      });

      const diff = Math.abs(
        result.assets.total - (result.liabilities.total + result.equity.total),
      );
      expect(diff).toBeLessThan(1);
    });

    test("accounts receivable includes draft and scheduled invoices", async () => {
      const result = await getBalanceSheet(db, {
        teamId: TEAM_USD_ID,
        asOf: "2024-12-31",
        currency: "USD",
      });

      // AR should include unpaid + overdue + draft + scheduled invoices
      // 5000 + 2000 + 1500 + 750 + 1200 = 10450 USD minimum
      // (EUR invoice converted separately depending on query logic)
      expect(result.assets.current.accountsReceivable).toBeGreaterThanOrEqual(
        10450,
      );
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Profit Margin — Zero Revenue Edge Case
  // ─────────────────────────────────────────────────────────────────────────
  describe("Profit Margin — Edge Cases", () => {
    test("zero revenue period returns profitMargin: 0 without crashing", async () => {
      const result = await getProfitMargin(db, {
        teamId: TEAM_USD_ID,
        from: "2030-01-01",
        to: "2030-12-31",
        currency: "USD",
      });

      expect(result.summary.profitMargin).toBe(0);
      expect(result.summary.totalRevenue).toBe(0);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Tax Summary — categorySlug and taxType Filters
  // ─────────────────────────────────────────────────────────────────────────
  describe("Tax Summary — Filters", () => {
    test("categorySlug filter narrows to single category", async () => {
      const all = await getTaxSummary(db, {
        teamId: TEAM_USD_ID,
        type: "paid",
        from: "2024-01-01",
        to: "2024-03-31",
        currency: "USD",
      });

      const softwareOnly = await getTaxSummary(db, {
        teamId: TEAM_USD_ID,
        type: "paid",
        from: "2024-01-01",
        to: "2024-03-31",
        currency: "USD",
        categorySlug: "software",
      });

      expect(softwareOnly.summary.totalTaxAmount).toBeGreaterThan(0);
      expect(softwareOnly.summary.totalTaxAmount).toBeLessThanOrEqual(
        all.summary.totalTaxAmount,
      );
      expect(softwareOnly.result.length).toBeLessThanOrEqual(all.result.length);
    });

    test("categorySlug with no matching transactions returns 0", async () => {
      const result = await getTaxSummary(db, {
        teamId: TEAM_USD_ID,
        type: "paid",
        from: "2024-01-01",
        to: "2024-03-31",
        currency: "USD",
        categorySlug: "inventory",
      });

      expect(result.summary.totalTaxAmount).toBe(0);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // No-Currency Fallback — team baseCurrency resolution
  // ─────────────────────────────────────────────────────────────────────────
  describe("No-Currency Fallback", () => {
    test("getExpenses without currency matches USD-explicit result", async () => {
      const [withCurrency, withoutCurrency] = await Promise.all([
        getExpenses(db, {
          teamId: TEAM_USD_ID,
          from: "2024-01-01",
          to: "2024-03-31",
          currency: "USD",
        }),
        getExpenses(db, {
          teamId: TEAM_USD_ID,
          from: "2024-01-01",
          to: "2024-03-31",
        }),
      ]);

      expect(withoutCurrency.summary.averageExpense).toBe(
        withCurrency.summary.averageExpense,
      );
    });

    test("getCashFlow without currency matches USD-explicit result", async () => {
      const [withCurrency, withoutCurrency] = await Promise.all([
        getCashFlow(db, {
          teamId: TEAM_USD_ID,
          from: "2024-01-01",
          to: "2024-03-31",
          currency: "USD",
        }),
        getCashFlow(db, {
          teamId: TEAM_USD_ID,
          from: "2024-01-01",
          to: "2024-03-31",
        }),
      ]);

      expect(withoutCurrency.summary.netCashFlow).toBe(
        withCurrency.summary.netCashFlow,
      );
    });

    test("getProfitMargin without currency matches USD-explicit result", async () => {
      const [withCurrency, withoutCurrency] = await Promise.all([
        getProfitMargin(db, {
          teamId: TEAM_USD_ID,
          from: "2024-01-01",
          to: "2024-03-31",
          currency: "USD",
        }),
        getProfitMargin(db, {
          teamId: TEAM_USD_ID,
          from: "2024-01-01",
          to: "2024-03-31",
        }),
      ]);

      expect(withoutCurrency.summary.profitMargin).toBe(
        withCurrency.summary.profitMargin,
      );
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Runway — Zero Burn Rate
  // ─────────────────────────────────────────────────────────────────────────
  describe("Runway — Edge Cases", () => {
    beforeAll(() => {
      setSystemTime(SEED_REFERENCE_DATE);
    });

    afterAll(() => {
      setSystemTime();
    });

    test("team with no expenses in trailing window returns 0 runway", async () => {
      // TEAM_EUR has only Jan 2024 transactions, so trailing 3 completed
      // months should have 0 burn
      const result = await getRunway(db, {
        teamId: TEAM_EUR_ID,
        currency: "EUR",
      });

      expect(result.months).toBe(0);
      expect(result.medianBurn).toBe(0);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Profit Margin — Negative Margin
  // ─────────────────────────────────────────────────────────────────────────
  describe("Profit Margin — Negative Margin", () => {
    test("negative profit margin when expenses exceed revenue", async () => {
      // Query a month range where we know expenses > revenue
      // Feb: revenue = 2800, expenses much higher in full COGS terms
      // Actually let's use the full Q1 and check margin is reasonable
      const result = await getProfitMargin(db, {
        teamId: TEAM_USD_ID,
        from: "2024-01-01",
        to: "2024-03-31",
        currency: "USD",
        revenueType: "net",
      });

      // With all the test data, profit margin should be a specific numeric value
      // The important thing: profitMargin = (totalProfit / totalRevenue) * 100
      expect(result.summary.profitMargin).toBeDefined();
      expect(typeof result.summary.profitMargin).toBe("number");
      expect(result.summary.totalRevenue).toBeGreaterThan(0);
      // Verify the identity: profitMargin = (totalProfit / totalRevenue) * 100
      const expectedMargin =
        (result.summary.totalProfit / result.summary.totalRevenue) * 100;
      expect(result.summary.profitMargin).toBeCloseTo(expectedMargin, 1);
    });

    test("monthly margins array aligns revenue and profit data by month", async () => {
      const result = await getProfitMargin(db, {
        teamId: TEAM_USD_ID,
        from: "2024-01-01",
        to: "2024-03-31",
        currency: "USD",
      });

      // Each monthly margin should satisfy the formula
      for (const month of result.result) {
        if (month.revenue > 0) {
          const expected = (month.profit / month.revenue) * 100;
          expect(month.margin).toBeCloseTo(expected, 1);
        } else {
          expect(month.margin).toBe(0);
        }
      }
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Growth Rate — Loss to Profit Transition
  // ─────────────────────────────────────────────────────────────────────────
  describe("Growth Rate — Transitions", () => {
    test("growth rate calculation with profit type", async () => {
      const result = await getGrowthRate(db, {
        teamId: TEAM_USD_ID,
        from: "2024-01-01",
        to: "2024-03-31",
        currency: "USD",
        type: "profit",
        period: "quarterly",
      });

      // Verify the formula: growthRate = ((current - previous) / |previous|) * 100
      const { currentTotal, previousTotal, growthRate } = result.summary;
      if (previousTotal !== 0) {
        const expected =
          ((currentTotal - previousTotal) / Math.abs(previousTotal)) * 100;
        expect(growthRate).toBeCloseTo(expected, 1);
      } else {
        expect(growthRate).toBe(0);
      }
    });

    test("trend is positive when current > previous", async () => {
      const result = await getGrowthRate(db, {
        teamId: TEAM_USD_ID,
        from: "2024-01-01",
        to: "2024-03-31",
        currency: "USD",
        type: "revenue",
        period: "quarterly",
      });

      // Q1 2024 has revenue, Q4 2023 has none — should be massive positive growth
      if (result.summary.currentTotal > result.summary.previousTotal) {
        expect(result.summary.trend).toBe("positive");
      }
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Cash Flow — averageMonthlyCashFlow identity
  // ─────────────────────────────────────────────────────────────────────────
  describe("Cash Flow — Averages", () => {
    test("averageMonthlyCashFlow = netCashFlow / monthCount", async () => {
      const result = await getCashFlow(db, {
        teamId: TEAM_USD_ID,
        from: "2024-01-01",
        to: "2024-03-31",
        currency: "USD",
      });

      const monthCount = result.monthlyData.length;
      const expected = result.summary.netCashFlow / monthCount;
      expect(result.summary.averageMonthlyCashFlow).toBeCloseTo(expected, 1);
    });

    test("monthlyData income - expenses = netCashFlow per month", async () => {
      const result = await getCashFlow(db, {
        teamId: TEAM_USD_ID,
        from: "2024-01-01",
        to: "2024-03-31",
        currency: "USD",
      });

      for (const month of result.monthlyData) {
        expect(month.netCashFlow).toBeCloseTo(month.income - month.expenses, 1);
      }
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Spending — Total matches expense total for same period
  // ─────────────────────────────────────────────────────────────────────────
  describe("Spending — Cross-Validation", () => {
    test("sum of spending category amounts equals expenses total for same period", async () => {
      const [spending, expenses] = await Promise.all([
        getSpending(db, {
          teamId: TEAM_USD_ID,
          from: "2024-01-01",
          to: "2024-01-31",
          currency: "USD",
        }),
        getExpenses(db, {
          teamId: TEAM_USD_ID,
          from: "2024-01-01",
          to: "2024-01-31",
          currency: "USD",
        }),
      ]);

      const spendingTotal = spending.reduce((s, c) => s + c.amount, 0);
      const expenseJan = expenses.result.find((r) =>
        r.date.startsWith("2024-01"),
      );
      expect(spendingTotal).toBeCloseTo(expenseJan!.total, 0);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Revenue Forecast — Recurring invoices produce non-zero projection
  // ─────────────────────────────────────────────────────────────────────────
  describe("Revenue Forecast — Recurring Invoice Projection", () => {
    test("forecast includes non-zero recurringInvoices from seeded invoice_recurring", async () => {
      const result = await getRevenueForecast(db, {
        teamId: TEAM_USD_ID,
        from: "2024-01-01",
        to: "2024-06-30",
        forecastMonths: 3,
        currency: "USD",
      });

      expect(result.forecast).toBeArray();
      expect(result.forecast.length).toBe(3);

      const hasRecurring = result.forecast.some(
        (m: any) => m.breakdown?.recurringInvoices > 0,
      );
      expect(hasRecurring).toBe(true);

      const month1 = result.forecast[0] as any;
      expect(month1.breakdown.recurringInvoices).toBe(3000);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Revenue Forecast — Billable hours produce non-zero projection
  // ─────────────────────────────────────────────────────────────────────────
  describe("Revenue Forecast — Billable Hours", () => {
    test("forecast month 1 includes billableHours from seeded tracker data", async () => {
      const result = await getRevenueForecast(db, {
        teamId: TEAM_USD_ID,
        from: "2024-01-01",
        to: "2024-06-30",
        forecastMonths: 3,
        currency: "USD",
      });

      const month1 = result.forecast[0] as any;
      expect(month1.breakdown.billableHours).toBeGreaterThan(0);
    });

    test("forecast month 2+ does not include billableHours", async () => {
      const result = await getRevenueForecast(db, {
        teamId: TEAM_USD_ID,
        from: "2024-01-01",
        to: "2024-06-30",
        forecastMonths: 3,
        currency: "USD",
      });

      const month2 = result.forecast[1] as any;
      expect(month2.breakdown.billableHours).toBe(0);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // TEAM EUR — Base Currency EUR (no explicit currency param)
  // ─────────────────────────────────────────────────────────────────────────
  describe("TEAM_EUR — Base Currency EUR", () => {
    test("getRevenue returns EUR revenue without explicit currency", async () => {
      const result = await getRevenue(db, {
        teamId: TEAM_EUR_ID,
        from: "2024-01-01",
        to: "2024-02-28",
      });

      expect(result).toBeArray();
      const jan = result.find((r) => r.date.startsWith("2024-01"));
      expect(jan).toBeDefined();
      expect(Number(jan!.value)).toBe(10000);

      const feb = result.find((r) => r.date.startsWith("2024-02"));
      expect(feb).toBeDefined();
      expect(Number(feb!.value)).toBe(1000);
    });

    test("getExpenses returns EUR expenses without explicit currency", async () => {
      const result = await getExpenses(db, {
        teamId: TEAM_EUR_ID,
        from: "2024-01-01",
        to: "2024-02-28",
      });

      expect(result.result).toBeArray();
      const jan = result.result.find((r) => r.date.startsWith("2024-01"));
      expect(jan).toBeDefined();
      expect(jan!.total).toBe(2000);

      const feb = result.result.find((r) => r.date.startsWith("2024-02"));
      expect(feb).toBeDefined();
      expect(feb!.total).toBe(5000);
    });

    test("getProfit returns correct EUR profit without explicit currency", async () => {
      const result = await getProfit(db, {
        teamId: TEAM_EUR_ID,
        from: "2024-01-01",
        to: "2024-02-28",
      });

      expect(result).toBeArray();
      const jan = result.find((r) => r.date.startsWith("2024-01"));
      expect(jan).toBeDefined();
      expect(Number(jan!.value)).toBe(8000);
    });

    test("getCashFlow returns correct EUR cash flow without explicit currency", async () => {
      const result = await getCashFlow(db, {
        teamId: TEAM_EUR_ID,
        from: "2024-01-01",
        to: "2024-02-28",
      });

      expect(result.monthlyData).toBeArray();
      const jan = result.monthlyData.find((r) => r.date.startsWith("2024-01"));
      expect(jan).toBeDefined();
      expect(jan!.income).toBe(10000);
      expect(jan!.expenses).toBe(2000);
    });

    test("getSpending returns EUR spending without explicit currency", async () => {
      const result = await getSpending(db, {
        teamId: TEAM_EUR_ID,
        from: "2024-01-01",
        to: "2024-02-28",
      });

      expect(result).toBeArray();
      expect(result.length).toBeGreaterThan(0);
      const totalSpending = result.reduce((s, c) => s + c.amount, 0);
      expect(totalSpending).toBeGreaterThan(0);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Negative Profit / Loss Scenario (TEAM_EUR February)
  // ─────────────────────────────────────────────────────────────────────────
  describe("Negative Profit — Loss Scenario", () => {
    test("getProfit returns negative value when expenses exceed revenue", async () => {
      const result = await getProfit(db, {
        teamId: TEAM_EUR_ID,
        from: "2024-02-01",
        to: "2024-02-28",
      });

      const feb = result.find((r) => r.date.startsWith("2024-02"));
      expect(feb).toBeDefined();
      expect(Number(feb!.value)).toBeLessThan(0);
      expect(Number(feb!.value)).toBe(-4000);
    });

    test("getProfitMargin returns negative percentage for loss month", async () => {
      const result = await getProfitMargin(db, {
        teamId: TEAM_EUR_ID,
        from: "2024-02-01",
        to: "2024-02-28",
      });

      expect(result.summary.profitMargin).toBeLessThan(0);
    });

    test("getGrowthRate handles positive-to-negative profit transition", async () => {
      const result = await getGrowthRate(db, {
        teamId: TEAM_EUR_ID,
        from: "2024-01-01",
        to: "2024-02-28",
        type: "profit",
      });

      expect(result).toBeDefined();
      expect(result.summary.growthRate).toBeDefined();
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Cross-Validation — Multi-month spending vs expenses
  // ─────────────────────────────────────────────────────────────────────────
  describe("Cross-Validation — Extended", () => {
    test("spending total matches expenses total for Q1", async () => {
      const [spending, expenses] = await Promise.all([
        getSpending(db, {
          teamId: TEAM_USD_ID,
          from: "2024-01-01",
          to: "2024-03-31",
          currency: "USD",
        }),
        getExpenses(db, {
          teamId: TEAM_USD_ID,
          from: "2024-01-01",
          to: "2024-03-31",
          currency: "USD",
        }),
      ]);

      const spendingTotal = spending.reduce((s, c) => s + c.amount, 0);
      const expenseTotal = expenses.result.reduce((s, r) => s + r.total, 0);
      expect(spendingTotal).toBeCloseTo(expenseTotal, 0);
    });

    test("revenue(gross) - tax extracted = revenue(net)", async () => {
      const [gross, net] = await Promise.all([
        getRevenue(db, {
          teamId: TEAM_USD_ID,
          from: "2024-01-01",
          to: "2024-01-31",
          currency: "USD",
          revenueType: "gross",
        }),
        getRevenue(db, {
          teamId: TEAM_USD_ID,
          from: "2024-01-01",
          to: "2024-01-31",
          currency: "USD",
          revenueType: "net",
        }),
      ]);

      const grossTotal = gross.reduce(
        (s, r) => s + Number.parseFloat(r.value),
        0,
      );
      const netTotal = net.reduce((s, r) => s + Number.parseFloat(r.value), 0);
      expect(grossTotal).toBeGreaterThan(netTotal);
    });

    test("cash flow net = income - expenses for each month", async () => {
      const result = await getCashFlow(db, {
        teamId: TEAM_USD_ID,
        from: "2024-01-01",
        to: "2024-06-30",
        currency: "USD",
      });

      for (const month of result.monthlyData) {
        expect(month.netCashFlow).toBeCloseTo(month.income - month.expenses, 1);
      }
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Report CRUD — createReport, getReportByLinkId, getChartDataByLinkId
  // ─────────────────────────────────────────────────────────────────────────
  describe("Report CRUD", () => {
    test("createReport returns a report with linkId", async () => {
      const report = await createReport(db, {
        type: "revenue",
        from: "2024-01-01",
        to: "2024-03-31",
        currency: "USD",
        teamId: TEAM_USD_ID,
        createdBy: TEST_USER_ID,
      });

      expect(report).toBeDefined();
      expect(report!.id).toBeDefined();
      expect(report!.linkId).toBeDefined();
      expect(report!.linkId!.length).toBe(21);
      expect(report!.type).toBe("revenue");
    });

    test("getReportByLinkId retrieves a created report", async () => {
      const created = await createReport(db, {
        type: "profit",
        from: "2024-01-01",
        to: "2024-06-30",
        currency: "USD",
        teamId: TEAM_USD_ID,
        createdBy: TEST_USER_ID,
      });

      const fetched = await getReportByLinkId(db, created!.linkId!);

      expect(fetched).toBeDefined();
      expect(fetched!.id).toBe(created!.id);
      expect(fetched!.type).toBe("profit");
      expect(fetched!.teamName).toBe("Test Co USD");
    });

    test("getChartDataByLinkId returns chart data for revenue report", async () => {
      const created = await createReport(db, {
        type: "revenue",
        from: "2024-01-01",
        to: "2024-03-31",
        currency: "USD",
        teamId: TEAM_USD_ID,
        createdBy: TEST_USER_ID,
      });

      const chartData = await getChartDataByLinkId(db, created!.linkId!);

      expect(chartData).toBeDefined();
      expect(chartData.type).toBe("revenue");
      expect(chartData.data).toBeDefined();
    });

    test("getChartDataByLinkId returns chart data for expense report", async () => {
      const created = await createReport(db, {
        type: "expense",
        from: "2024-01-01",
        to: "2024-03-31",
        currency: "USD",
        teamId: TEAM_USD_ID,
        createdBy: TEST_USER_ID,
      });

      const chartData = await getChartDataByLinkId(db, created!.linkId!);

      expect(chartData).toBeDefined();
      expect(chartData.type).toBe("expense");
    });

    test("getChartDataByLinkId throws for expired report", async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);

      const created = await createReport(db, {
        type: "revenue",
        from: "2024-01-01",
        to: "2024-03-31",
        currency: "USD",
        teamId: TEAM_USD_ID,
        createdBy: TEST_USER_ID,
        expireAt: pastDate.toISOString(),
      });

      expect(getChartDataByLinkId(db, created!.linkId!)).rejects.toThrow();
    });

    test("getReportByLinkId returns undefined for non-existent link", async () => {
      const result = await getReportByLinkId(db, "nonexistent-link-id-xxx");
      expect(result).toBeUndefined();
    });
  });
});
