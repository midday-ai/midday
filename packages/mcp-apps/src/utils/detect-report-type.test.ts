import { describe, expect, test } from "bun:test";
import {
  balanceSheetData,
  burnRateData,
  cashFlowData,
  forecastData,
  growthRateData,
  profitMarginData,
  recurringExpensesData,
  revenueData,
  taxSummaryData,
} from "../dev/mock-data";
import { detectReportType } from "./detect-report-type";

describe("detectReportType", () => {
  test("detects forecast report", () => {
    expect(detectReportType(forecastData)).toBe("forecast");
  });

  test("detects cash_flow report", () => {
    expect(detectReportType(cashFlowData)).toBe("cash_flow");
  });

  test("detects growth_rate report", () => {
    expect(detectReportType(growthRateData)).toBe("growth_rate");
  });

  test("detects profit_margin report", () => {
    expect(detectReportType(profitMarginData)).toBe("profit_margin");
  });

  test("detects burn_rate report", () => {
    expect(detectReportType(burnRateData)).toBe("burn_rate");
  });

  test("detects recurring_expenses report", () => {
    expect(detectReportType(recurringExpensesData)).toBe("recurring_expenses");
  });

  test("detects tax_summary report", () => {
    expect(detectReportType(taxSummaryData)).toBe("tax_summary");
  });

  test("detects period report (revenue)", () => {
    expect(detectReportType(revenueData)).toBe("period");
  });

  test("returns unknown for unrecognized shape", () => {
    expect(detectReportType({})).toBe("unknown");
    expect(detectReportType({ something: "else" })).toBe("unknown");
  });

  test("returns unknown for null/undefined", () => {
    expect(detectReportType(null)).toBe("unknown");
    expect(detectReportType(undefined)).toBe("unknown");
  });

  test("does not misclassify balance sheet as a report type", () => {
    expect(detectReportType(balanceSheetData)).toBe("unknown");
  });

  test("forecast takes precedence when multiple keys present", () => {
    const hybrid = {
      combined: [],
      forecast: [],
      historical: [],
      summary: {},
      result: [],
    };
    expect(detectReportType(hybrid)).toBe("forecast");
  });
});
