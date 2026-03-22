import { beforeEach, describe, expect, test } from "bun:test";
import { createCallerFactory } from "../../trpc/init";
import { widgetsRouter } from "../../trpc/routers/widgets";
import { createTestContext } from "../helpers/test-context";
import { mocks } from "../setup";

const createCaller = createCallerFactory(widgetsRouter);

const RANGE = { from: "2026-01-01", to: "2026-03-31" } as const;

describe("tRPC: widgets.getRunway", () => {
  beforeEach(() => {
    mocks.getRunway.mockReset();
    mocks.getRunway.mockImplementation(() => Promise.resolve(12));
  });

  test("returns runway result", async () => {
    const caller = createCaller(createTestContext());
    const result = await caller.getRunway({});

    expect(result).toEqual({
      result: 12,
    });
    expect(mocks.getRunway).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ teamId: "test-team-id" }),
    );
  });

  test("rejects without session", async () => {
    const ctx = createTestContext();
    const caller = createCaller({ ...ctx, session: null });

    await expect(caller.getRunway({})).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });
});

describe("tRPC: widgets.getTopCustomer", () => {
  beforeEach(() => {
    mocks.getTopRevenueClient.mockReset();
    mocks.getTopRevenueClient.mockImplementation(() => Promise.resolve(null));
  });

  test("returns null when there is no top customer", async () => {
    const caller = createCaller(createTestContext());
    const result = await caller.getTopCustomer();

    expect(result).toEqual({ result: null });
    expect(mocks.getTopRevenueClient).toHaveBeenCalledWith(expect.anything(), {
      teamId: "test-team-id",
    });
  });

  test("rejects without session", async () => {
    const ctx = createTestContext();
    const caller = createCaller({ ...ctx, session: null });

    await expect(caller.getTopCustomer()).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });
});

describe("tRPC: widgets.getRevenueSummary", () => {
  beforeEach(() => {
    mocks.getReports.mockReset();
    mocks.getReports.mockImplementation(() =>
      Promise.resolve({
        summary: { currency: "USD", currentTotal: 12_000, prevTotal: 9000 },
        meta: { type: "revenue", currency: "USD" },
        result: [{}, {}, {}],
      }),
    );
  });

  test("maps getReports into widget shape", async () => {
    const caller = createCaller(createTestContext());
    const result = await caller.getRevenueSummary({ ...RANGE });

    expect(result).toEqual({
      result: {
        totalRevenue: 12_000,
        currency: "USD",
        revenueType: "net",
        monthCount: 3,
      },
    });
    expect(mocks.getReports).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        teamId: "test-team-id",
        from: RANGE.from,
        to: RANGE.to,
        type: "revenue",
        revenueType: "net",
      }),
    );
  });
});

describe("tRPC: widgets.getGrowthRate", () => {
  beforeEach(() => {
    mocks.getGrowthRate.mockReset();
    mocks.getGrowthRate.mockImplementation(() =>
      Promise.resolve({
        summary: {
          currentTotal: 120,
          previousTotal: 100,
          growthRate: 20,
          periodGrowthRate: 15,
          currency: "USD",
          trend: "positive",
          period: "quarterly",
          type: "revenue",
          revenueType: "net",
        },
        meta: {
          type: "growth_rate",
          period: "quarterly",
          currency: "USD",
          dateRange: {
            current: { from: "2026-01-01", to: "2026-03-31" },
            previous: { from: "2025-10-01", to: "2025-12-31" },
          },
        },
      }),
    );
  });

  test("returns growth summary from getGrowthRate", async () => {
    const caller = createCaller(createTestContext());
    const result = await caller.getGrowthRate({ ...RANGE });

    expect(result).toEqual({
      result: {
        currentTotal: 120,
        prevTotal: 100,
        growthRate: 20,
        quarterlyGrowthRate: 15,
        currency: "USD",
        type: "revenue",
        revenueType: "net",
        period: "quarterly",
        trend: "positive",
        meta: {
          type: "growth_rate",
          period: "quarterly",
          currency: "USD",
          dateRange: {
            current: { from: "2026-01-01", to: "2026-03-31" },
            previous: { from: "2025-10-01", to: "2025-12-31" },
          },
        },
      },
    });
    expect(mocks.getGrowthRate).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        teamId: "test-team-id",
        from: RANGE.from,
        to: RANGE.to,
      }),
    );
  });
});

describe("tRPC: widgets.getProfitMargin", () => {
  beforeEach(() => {
    mocks.getProfitMargin.mockReset();
    mocks.getProfitMargin.mockImplementation(() =>
      Promise.resolve({
        summary: {
          totalRevenue: 1000,
          totalProfit: 200,
          profitMargin: 20,
          averageMargin: 18,
          currency: "USD",
          revenueType: "net",
          trend: "positive",
          monthCount: 2,
        },
        meta: {
          type: "profit_margin",
          currency: "USD",
          revenueType: "net",
          period: { from: RANGE.from, to: RANGE.to },
        },
        result: [
          {
            date: "2026-01-01",
            revenue: 500,
            profit: 100,
            margin: 10,
            currency: "USD",
          },
        ],
      }),
    );
  });

  test("returns profit margin payload", async () => {
    const caller = createCaller(createTestContext());
    const result = await caller.getProfitMargin({ ...RANGE });

    expect(result.result.totalRevenue).toBe(1000);
    expect(result.result.monthlyData).toEqual([
      {
        date: "2026-01-01",
        revenue: 500,
        profit: 100,
        margin: 10,
        currency: "USD",
      },
    ]);
    expect(result.result.meta).toMatchObject({ type: "profit_margin" });
    expect(mocks.getProfitMargin).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ teamId: "test-team-id", ...RANGE }),
    );
  });
});

describe("tRPC: widgets.getCashFlow", () => {
  beforeEach(() => {
    mocks.getCashFlow.mockReset();
    mocks.getCashFlow.mockImplementation(() =>
      Promise.resolve({
        summary: {
          netCashFlow: 500,
          currency: "USD",
          period: "monthly",
        },
        meta: {
          type: "cash_flow",
          currency: "USD",
          period: { from: RANGE.from, to: RANGE.to },
        },
      }),
    );
  });

  test("returns net cash flow summary", async () => {
    const caller = createCaller(createTestContext());
    const result = await caller.getCashFlow({ ...RANGE });

    expect(result).toEqual({
      result: {
        netCashFlow: 500,
        currency: "USD",
        period: "monthly",
        meta: {
          type: "cash_flow",
          currency: "USD",
          period: { from: RANGE.from, to: RANGE.to },
        },
      },
    });
    expect(mocks.getCashFlow).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        teamId: "test-team-id",
        ...RANGE,
        period: "monthly",
      }),
    );
  });
});

describe("tRPC: widgets.getOutstandingInvoices", () => {
  beforeEach(() => {
    mocks.getOutstandingInvoices.mockReset();
    mocks.getOutstandingInvoices.mockImplementation(() =>
      Promise.resolve({
        summary: {
          count: 2,
          totalAmount: 300,
          currency: "USD",
          status: ["unpaid", "overdue"],
        },
        meta: {
          type: "outstanding_invoices",
          currency: "USD",
          status: ["unpaid", "overdue"],
        },
      }),
    );
  });

  test("returns outstanding invoice summary", async () => {
    const caller = createCaller(createTestContext());
    const result = await caller.getOutstandingInvoices({});

    expect(result.result.count).toBe(2);
    expect(result.result.meta).toMatchObject({
      type: "outstanding_invoices",
      currency: "USD",
      status: ["unpaid", "overdue"],
    });
    expect(mocks.getOutstandingInvoices).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        teamId: "test-team-id",
        status: ["unpaid", "overdue"],
      }),
    );
  });
});

describe("tRPC: widgets.getInboxStats", () => {
  beforeEach(() => {
    mocks.getInboxStats.mockReset();
    mocks.getInboxStats.mockImplementation(() =>
      Promise.resolve({
        result: {
          newItems: 1,
          pendingItems: 0,
          analyzingItems: 0,
          suggestedMatches: 0,
          recentMatches: 2,
          totalItems: 1,
        },
        meta: {},
      }),
    );
  });

  test("returns inbox stats result", async () => {
    const caller = createCaller(createTestContext());
    const result = await caller.getInboxStats({ ...RANGE });

    expect(result.result.recentMatches).toBe(2);
    expect(mocks.getInboxStats).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ teamId: "test-team-id", ...RANGE }),
    );
  });
});

describe("tRPC: widgets.getTrackedTime", () => {
  beforeEach(() => {
    mocks.getTrackedTime.mockReset();
    mocks.getTrackedTime.mockImplementation(() =>
      Promise.resolve({
        totalDuration: 3600,
        from: RANGE.from,
        to: RANGE.to,
      }),
    );
  });

  test("uses session user when assignedId omitted", async () => {
    const caller = createCaller(createTestContext());
    const result = await caller.getTrackedTime({ ...RANGE });

    expect(result.result.totalDuration).toBe(3600);
    expect(mocks.getTrackedTime).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        teamId: "test-team-id",
        assignedId: "test-user-id",
        ...RANGE,
      }),
    );
  });
});

describe("tRPC: widgets.getVaultActivity", () => {
  beforeEach(() => {
    mocks.getRecentDocuments.mockReset();
    mocks.getRecentDocuments.mockImplementation(() =>
      Promise.resolve({
        data: [{ id: "doc-1", name: "a.pdf" }],
        total: 1,
      }),
    );
  });

  test("calls getRecentDocuments with limit", async () => {
    const caller = createCaller(createTestContext());
    const result = await caller.getVaultActivity({});

    expect(result.result.total).toBe(1);
    expect(mocks.getRecentDocuments).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ teamId: "test-team-id", limit: 5 }),
    );
  });
});

describe("tRPC: widgets.getAccountBalances", () => {
  beforeEach(() => {
    mocks.getCashBalance.mockReset();
    mocks.getCashBalance.mockImplementation(() =>
      Promise.resolve({
        totalBalance: 10_000,
        currency: "USD",
        accountCount: 2,
        accountBreakdown: [],
      }),
    );
  });

  test("returns getCashBalance result", async () => {
    const caller = createCaller(createTestContext());
    const result = await caller.getAccountBalances({});

    expect(result.result.totalBalance).toBe(10_000);
    expect(mocks.getCashBalance).toHaveBeenCalledWith(expect.anything(), {
      teamId: "test-team-id",
      currency: undefined,
    });
  });
});

describe("tRPC: widgets.getNetPosition", () => {
  beforeEach(() => {
    mocks.getNetPosition.mockReset();
    mocks.getNetPosition.mockImplementation(() =>
      Promise.resolve({
        cash: 10_000,
        creditDebt: 2000,
        netPosition: 8000,
        currency: "USD",
        cashAccountCount: 1,
        creditAccountCount: 1,
      }),
    );
  });

  test("returns net position", async () => {
    const caller = createCaller(createTestContext());
    const result = await caller.getNetPosition({});

    expect(result.result.netPosition).toBe(8000);
    expect(mocks.getNetPosition).toHaveBeenCalledWith(expect.anything(), {
      teamId: "test-team-id",
      currency: undefined,
    });
  });
});

describe("tRPC: widgets.getMonthlySpending", () => {
  beforeEach(() => {
    mocks.getSpendingForPeriod.mockReset();
    mocks.getSpendingForPeriod.mockImplementation(() =>
      Promise.resolve({
        totalSpending: 1500,
        currency: "EUR",
        topCategory: { name: "Travel", amount: 400, percentage: 30 },
      }),
    );
  });

  test("returns spending and tool metadata", async () => {
    const caller = createCaller(createTestContext());
    const result = await caller.getMonthlySpending({ ...RANGE });

    expect(result).toEqual({
      result: {
        totalSpending: 1500,
        currency: "EUR",
        topCategory: { name: "Travel", amount: 400, percentage: 30 },
      },
    });
    expect(mocks.getSpendingForPeriod).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ teamId: "test-team-id", ...RANGE }),
    );
  });
});

describe("tRPC: widgets.getRecurringExpenses", () => {
  beforeEach(() => {
    mocks.getRecurringExpenses.mockReset();
    mocks.getRecurringExpenses.mockImplementation(() =>
      Promise.resolve({
        summary: {
          totalMonthlyEquivalent: 400,
          totalExpenses: 2,
          currency: "USD",
          byFrequency: {
            weekly: 0,
            monthly: 400,
            annually: 0,
            irregular: 0,
          },
        },
        expenses: [],
        meta: { type: "recurring_expenses", currency: "USD" },
      }),
    );
  });

  test("returns recurring expenses payload", async () => {
    const caller = createCaller(createTestContext());
    const result = await caller.getRecurringExpenses({ ...RANGE });

    expect(result.result.summary.totalExpenses).toBe(2);
    expect(mocks.getRecurringExpenses).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ teamId: "test-team-id", ...RANGE }),
    );
  });
});

describe("tRPC: widgets.getTaxSummary", () => {
  beforeEach(() => {
    mocks.getTaxSummary.mockReset();
    mocks.getTaxSummary.mockImplementation((_db, params: { type: string }) =>
      Promise.resolve({
        summary: {
          totalTaxAmount: 100,
          totalTransactionAmount: 1000,
          totalTransactions: 5,
          categoryCount: 1,
          type: params.type,
          currency: "USD",
        },
        meta: {},
        result: [],
      }),
    );
  });

  test("merges paid and collected tax summaries", async () => {
    const caller = createCaller(createTestContext());
    const result = await caller.getTaxSummary({ ...RANGE });

    expect(result.result.paid.type).toBe("paid");
    expect(result.result.collected.type).toBe("collected");
    expect(result.result.currency).toBe("USD");
    expect(mocks.getTaxSummary).toHaveBeenCalledTimes(2);
  });
});

describe("tRPC: widgets.getCategoryExpenses", () => {
  beforeEach(() => {
    mocks.getSpending.mockReset();
    mocks.getSpending.mockImplementation(() =>
      Promise.resolve([
        {
          name: "Travel",
          slug: "travel",
          amount: 200,
          currency: "USD",
          color: "#000",
          percentage: 40,
        },
        {
          name: "Office",
          slug: "office",
          amount: 100,
          currency: "USD",
          color: "#111",
          percentage: 20,
        },
      ]),
    );
  });

  test("sorts categories and aggregates top slice", async () => {
    const caller = createCaller(createTestContext());
    const result = await caller.getCategoryExpenses({ ...RANGE });

    expect(result.result.categories[0]?.slug).toBe("travel");
    expect(result.result.totalAmount).toBe(300);
    expect(result.result.totalCategories).toBe(2);
    expect(mocks.getSpending).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ teamId: "test-team-id", ...RANGE }),
    );
  });
});

describe("tRPC: widgets.getOverdueInvoicesAlert", () => {
  beforeEach(() => {
    mocks.getOverdueInvoicesAlert.mockReset();
    mocks.getOverdueInvoicesAlert.mockImplementation(() =>
      Promise.resolve({
        summary: {
          count: 1,
          totalAmount: 99,
          currency: "USD",
          oldestDueDate: "2026-01-01",
          daysOverdue: 5,
        },
        meta: {},
      }),
    );
  });

  test("returns overdue summary only", async () => {
    const caller = createCaller(createTestContext());
    const result = await caller.getOverdueInvoicesAlert({});

    expect(result.result.count).toBe(1);
    expect(mocks.getOverdueInvoicesAlert).toHaveBeenCalledWith(
      expect.anything(),
      { teamId: "test-team-id", currency: undefined },
    );
  });
});

describe("tRPC: widgets.getBillableHours", () => {
  beforeEach(() => {
    mocks.getBillableHours.mockReset();
    mocks.getBillableHours.mockImplementation(() =>
      Promise.resolve({
        totalDuration: 7200,
        totalAmount: 500,
        earningsByCurrency: { USD: 500 },
        projectBreakdown: [],
        currency: "USD",
      }),
    );
  });

  test("returns billable hours directly", async () => {
    const caller = createCaller(createTestContext());
    const result = await caller.getBillableHours({
      date: "2026-03-21",
      view: "week",
    });

    expect(result.totalDuration).toBe(7200);
    expect(mocks.getBillableHours).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        teamId: "test-team-id",
        date: "2026-03-21",
        view: "week",
        weekStartsOnMonday: false,
      }),
    );
  });
});

describe("tRPC: widgets.getCustomerLifetimeValue", () => {
  beforeEach(() => {
    mocks.getCustomerLifetimeValue.mockReset();
    mocks.getCustomerLifetimeValue.mockImplementation(() =>
      Promise.resolve({
        summary: {
          averageCLV: 1000,
          medianCLV: 800,
          totalCustomers: 3,
          activeCustomers: 2,
          averageLifespanDays: 365,
          currency: "USD",
        },
        topCustomers: [],
        meta: { type: "customer_lifetime_value", currency: "USD" },
      }),
    );
  });

  test("returns CLV result", async () => {
    const caller = createCaller(createTestContext());
    const result = await caller.getCustomerLifetimeValue({});

    expect(result.result.summary.averageCLV).toBe(1000);
    expect(mocks.getCustomerLifetimeValue).toHaveBeenCalledWith(
      expect.anything(),
      { teamId: "test-team-id", currency: undefined },
    );
  });
});

describe("tRPC: widgets.getWidgetPreferences", () => {
  beforeEach(() => {
    mocks.widgetPreferencesGet.mockReset();
    mocks.widgetPreferencesGet.mockImplementation(() =>
      Promise.resolve({
        primaryWidgets: ["runway"],
        availableWidgets: ["vault"],
      }),
    );
  });

  test("returns cached preferences", async () => {
    const caller = createCaller(createTestContext());
    const result = await caller.getWidgetPreferences();

    expect(result).toEqual({
      primaryWidgets: ["runway"],
      availableWidgets: ["vault"],
    });
    expect(mocks.widgetPreferencesGet).toHaveBeenCalledWith(
      "test-team-id",
      "test-user-id",
    );
  });
});

describe("tRPC: widgets.updateWidgetPreferences", () => {
  beforeEach(() => {
    mocks.widgetPreferencesUpdatePrimaryWidgets.mockReset();
    mocks.widgetPreferencesUpdatePrimaryWidgets.mockImplementation(
      (_teamId, _userId, primaryWidgets) =>
        Promise.resolve({
          primaryWidgets,
          availableWidgets: ["cash-flow", "vault"],
        }),
    );
  });

  test("updates primary widgets via cache", async () => {
    const caller = createCaller(createTestContext());
    const result = await caller.updateWidgetPreferences({
      primaryWidgets: ["runway"],
    });

    expect(result).toEqual({
      primaryWidgets: ["runway"],
      availableWidgets: ["cash-flow", "vault"],
    });
    expect(mocks.widgetPreferencesUpdatePrimaryWidgets).toHaveBeenCalledWith(
      "test-team-id",
      "test-user-id",
      ["runway"],
    );
  });
});
