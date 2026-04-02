import { beforeEach, describe, expect, test } from "bun:test";
import { createCallerFactory } from "../../trpc/init";
import { reportsRouter } from "../../trpc/routers/reports";
import { createTestContext } from "../helpers/test-context";
import { mocks } from "../setup";

const createCaller = createCallerFactory(reportsRouter);

const DATE_RANGE = { from: "2026-01-01", to: "2026-03-31" } as const;

describe("tRPC: reports.revenue", () => {
  beforeEach(() => {
    mocks.getReports.mockReset();
    mocks.getReports.mockImplementation(() =>
      Promise.resolve({
        summary: { currency: "USD", currentTotal: 0, prevTotal: 0 },
        meta: { type: "revenue", currency: "USD" },
        result: [],
      }),
    );
  });

  test("returns revenue report for date range", async () => {
    const caller = createCaller(createTestContext());
    const result = await caller.revenue(DATE_RANGE);

    expect(result).toMatchObject({
      summary: { currency: "USD", currentTotal: 0, prevTotal: 0 },
      meta: { type: "revenue", currency: "USD" },
    });
    expect(mocks.getReports).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        teamId: "test-team-id",
        from: DATE_RANGE.from,
        to: DATE_RANGE.to,
        type: "revenue",
      }),
    );
  });

  test("propagates when getReports fails", async () => {
    mocks.getReports.mockRejectedValueOnce(new Error("query failed"));

    const caller = createCaller(createTestContext());
    await expect(caller.revenue(DATE_RANGE)).rejects.toThrow("query failed");
  });
});

describe("tRPC: reports.profit", () => {
  beforeEach(() => {
    mocks.getReports.mockReset();
    mocks.getReports.mockImplementation(() =>
      Promise.resolve({
        summary: { currency: "USD", currentTotal: 0, prevTotal: 0 },
        meta: { type: "profit", currency: "USD" },
      }),
    );
  });

  test("returns profit report for date range", async () => {
    const caller = createCaller(createTestContext());
    const result = await caller.profit(DATE_RANGE);

    expect(result).toMatchObject({
      summary: { currency: "USD", currentTotal: 0, prevTotal: 0 },
      meta: { type: "profit", currency: "USD" },
    });
    expect(mocks.getReports).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        teamId: "test-team-id",
        type: "profit",
      }),
    );
  });

  test("propagates when getReports fails", async () => {
    mocks.getReports.mockRejectedValueOnce(new Error("profit query failed"));

    const caller = createCaller(createTestContext());
    await expect(caller.profit(DATE_RANGE)).rejects.toThrow(
      "profit query failed",
    );
  });
});

describe("tRPC: reports.burnRate", () => {
  beforeEach(() => {
    mocks.getBurnRate.mockReset();
    mocks.getBurnRate.mockImplementation(() => Promise.resolve([]));
  });

  test("returns burn rate for date range", async () => {
    const caller = createCaller(createTestContext());
    const result = await caller.burnRate(DATE_RANGE);

    expect(result).toEqual([]);
    expect(mocks.getBurnRate).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        teamId: "test-team-id",
        from: DATE_RANGE.from,
        to: DATE_RANGE.to,
      }),
    );
  });

  test("propagates when getBurnRate fails", async () => {
    mocks.getBurnRate.mockRejectedValueOnce(new Error("burn rate failed"));

    const caller = createCaller(createTestContext());
    await expect(caller.burnRate(DATE_RANGE)).rejects.toThrow(
      "burn rate failed",
    );
  });
});

describe("tRPC: reports.runway", () => {
  beforeEach(() => {
    mocks.getRunway.mockReset();
    mocks.getRunway.mockImplementation(() =>
      Promise.resolve({ months: 12, medianBurn: 5000 }),
    );
  });

  test("returns runway with empty input", async () => {
    const caller = createCaller(createTestContext());
    const result = await caller.runway({});

    expect(result).toEqual({ months: 12, medianBurn: 5000 });
    expect(mocks.getRunway).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ teamId: "test-team-id" }),
    );
  });

  test("passes optional currency to getRunway", async () => {
    const caller = createCaller(createTestContext());
    await caller.runway({ currency: "EUR" });

    expect(mocks.getRunway).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ teamId: "test-team-id", currency: "EUR" }),
    );
  });
});

describe("tRPC: reports.expense", () => {
  beforeEach(() => {
    mocks.getExpenses.mockReset();
    mocks.getExpenses.mockImplementation(() =>
      Promise.resolve({
        summary: { averageExpense: 0, currency: "USD" },
        meta: { type: "expense" as const, currency: "USD" },
        result: [],
      }),
    );
  });

  test("returns expenses for date range", async () => {
    const caller = createCaller(createTestContext());
    const result = await caller.expense(DATE_RANGE);

    expect(result).toMatchObject({
      summary: { averageExpense: 0, currency: "USD" },
      meta: { type: "expense", currency: "USD" },
      result: [],
    });
    expect(mocks.getExpenses).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        teamId: "test-team-id",
        from: DATE_RANGE.from,
        to: DATE_RANGE.to,
      }),
    );
  });

  test("propagates when getExpenses fails", async () => {
    mocks.getExpenses.mockRejectedValueOnce(new Error("expenses failed"));

    const caller = createCaller(createTestContext());
    await expect(caller.expense(DATE_RANGE)).rejects.toThrow("expenses failed");
  });
});

describe("tRPC: reports.spending", () => {
  beforeEach(() => {
    mocks.getSpending.mockReset();
    mocks.getSpending.mockImplementation(() => Promise.resolve([]));
  });

  test("returns spending for date range", async () => {
    const caller = createCaller(createTestContext());
    const result = await caller.spending(DATE_RANGE);

    expect(result).toEqual([]);
    expect(mocks.getSpending).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        teamId: "test-team-id",
        from: DATE_RANGE.from,
        to: DATE_RANGE.to,
      }),
    );
  });

  test("propagates when getSpending fails", async () => {
    mocks.getSpending.mockRejectedValueOnce(new Error("spending failed"));

    const caller = createCaller(createTestContext());
    await expect(caller.spending(DATE_RANGE)).rejects.toThrow(
      "spending failed",
    );
  });
});

describe("tRPC: reports.taxSummary", () => {
  beforeEach(() => {
    mocks.getTaxSummary.mockReset();
    mocks.getTaxSummary.mockImplementation(() =>
      Promise.resolve({
        summary: {
          totalTaxAmount: 0,
          totalTransactionAmount: 0,
          totalTransactions: 0,
          categoryCount: 0,
          type: "paid" as const,
          currency: "USD",
        },
        meta: { type: "tax", taxType: "paid", currency: "USD", period: {} },
        result: [],
      }),
    );
  });

  test("returns tax summary for date range", async () => {
    const caller = createCaller(createTestContext());
    const result = await caller.taxSummary({
      from: "2026-01-01",
      to: "2026-03-31",
      type: "paid",
    });

    expect(result.result).toEqual([]);
    expect(mocks.getTaxSummary).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        teamId: "test-team-id",
        from: "2026-01-01",
        to: "2026-03-31",
        type: "paid",
      }),
    );
  });
});

describe("tRPC: reports.create", () => {
  beforeEach(() => {
    mocks.createReport.mockReset();
    mocks.createReport.mockImplementation(() =>
      Promise.resolve({
        id: "report-row-id",
        linkId: "link-abc",
      }),
    );
  });

  test("creates shareable report and returns link id", async () => {
    const caller = createCaller(createTestContext());
    const result = await caller.create({
      type: "revenue",
      from: "2026-01-01",
      to: "2026-03-31",
    });

    expect(result).toMatchObject({
      id: "report-row-id",
      linkId: "link-abc",
      shortUrl: `${process.env.MIDDAY_DASHBOARD_URL}/r/link-abc`,
    });
    expect(mocks.createReport).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        teamId: "test-team-id",
        createdBy: "test-user-id",
        type: "revenue",
        from: "2026-01-01",
        to: "2026-03-31",
      }),
    );
  });
});

describe("tRPC: reports.getByLinkId (public)", () => {
  beforeEach(() => {
    mocks.getReportByLinkId.mockReset();
    mocks.getReportByLinkId.mockImplementation(() =>
      Promise.resolve({
        id: "report-row-id",
        type: "revenue",
        from: "2026-01-01",
        to: "2026-03-31",
      }),
    );
  });

  test("loads report metadata by public link id", async () => {
    const caller = createCaller(createTestContext());
    const result = await caller.getByLinkId({ linkId: "abc" });

    expect(result).toMatchObject({
      id: "report-row-id",
      type: "revenue",
    });
    expect(mocks.getReportByLinkId).toHaveBeenCalledWith(
      expect.anything(),
      "abc",
    );
  });
});
