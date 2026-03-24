import { describe, expect, it } from "bun:test";
import type { InsightMetric } from "../types";
import { detectAnomalies, selectTopMetrics } from "./analyzer";

// Helper to create test metrics
function createTestMetric(
  type: string,
  value: number,
  previousValue: number,
  change: number,
  changeDirection: "up" | "down" | "flat" = "flat",
): InsightMetric {
  return {
    type,
    label: type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    value,
    previousValue,
    change,
    changeDirection,
  };
}

describe("selectTopMetrics", () => {
  it("should return top 4 metrics by default", () => {
    // Include metrics from different categories to ensure we can get 4
    const metrics: InsightMetric[] = [
      createTestMetric("revenue", 10000, 8000, 25, "up"), // financial
      createTestMetric("expenses", 5000, 4000, 25, "up"), // financial
      createTestMetric("hours_tracked", 40, 35, 14, "up"), // time
      createTestMetric("new_customers", 5, 3, 67, "up"), // customers
      createTestMetric("invoices_sent", 10, 8, 25, "up"), // invoicing
      createTestMetric("runway_months", 12, 10, 20, "up"), // runway
    ];

    const result = selectTopMetrics(metrics);

    expect(result.length).toBe(4);
  });

  it("should accept custom count parameter", () => {
    const metrics: InsightMetric[] = [
      createTestMetric("revenue", 10000, 8000, 25, "up"),
      createTestMetric("expenses", 5000, 4000, 25, "up"),
      createTestMetric("net_profit", 5000, 4000, 25, "up"),
    ];

    const result = selectTopMetrics(metrics, 2);

    expect(result.length).toBe(2);
  });

  it("should ensure category diversity (max 2 from same category)", () => {
    // Mix of financial and profitability metrics
    const metrics: InsightMetric[] = [
      createTestMetric("revenue", 10000, 8000, 25, "up"), // financial
      createTestMetric("expenses", 5000, 4000, 25, "up"), // financial
      createTestMetric("cash_flow", 3000, 2000, 50, "up"), // financial
      createTestMetric("net_profit", 5000, 4000, 25, "up"), // profitability
      createTestMetric("profit_margin", 50, 45, 11, "up"), // profitability
      createTestMetric("hours_tracked", 40, 35, 14, "up"), // time category
    ];

    const result = selectTopMetrics(metrics, 4);

    // Count metrics from the "financial" category (revenue, expenses, cash_flow)
    const financialTypes = ["revenue", "expenses", "cash_flow"];
    const financialCount = result.filter((m) =>
      financialTypes.includes(m.type),
    ).length;

    // Should have max 2 from financial category
    expect(financialCount).toBeLessThanOrEqual(2);

    // Count metrics from the "profitability" category (net_profit, profit_margin)
    const profitabilityTypes = ["net_profit", "profit_margin"];
    const profitabilityCount = result.filter((m) =>
      profitabilityTypes.includes(m.type),
    ).length;

    // Should have max 2 from profitability category
    expect(profitabilityCount).toBeLessThanOrEqual(2);
  });

  it("should guarantee at least one core financial metric", () => {
    // Metrics without core financial
    const metrics: InsightMetric[] = [
      createTestMetric("hours_tracked", 40, 35, 14, "up"),
      createTestMetric("new_customers", 5, 3, 67, "up"),
      createTestMetric("invoices_sent", 10, 8, 25, "up"),
      createTestMetric("receipts_matched", 20, 15, 33, "up"),
      createTestMetric("revenue", 100, 90, 11, "up"), // core financial
    ];

    const result = selectTopMetrics(metrics, 4);

    const coreFinancial = ["revenue", "net_profit", "cash_flow", "expenses"];
    const hasCoreFinancial = result.some((m) => coreFinancial.includes(m.type));

    expect(hasCoreFinancial).toBe(true);
  });

  it("should prioritize metrics with significant changes", () => {
    const metrics: InsightMetric[] = [
      createTestMetric("revenue", 10000, 9900, 1, "up"), // small change
      createTestMetric("expenses", 5000, 2500, 100, "up"), // huge change
      createTestMetric("net_profit", 5000, 4900, 2, "up"), // small change
    ];

    const result = selectTopMetrics(metrics, 2);

    // Expenses should be included due to significant change
    expect(result.some((m) => m.type === "expenses")).toBe(true);
  });

  it("should accept Record<string, InsightMetric> input", () => {
    // Include metrics from different categories
    const metrics: Record<string, InsightMetric> = {
      revenue: createTestMetric("revenue", 10000, 8000, 25, "up"), // financial
      hours_tracked: createTestMetric("hours_tracked", 40, 35, 14, "up"), // time
      new_customers: createTestMetric("new_customers", 5, 3, 67, "up"), // customers
    };

    const result = selectTopMetrics(metrics);

    expect(result.length).toBe(3);
  });

  it("should handle empty input", () => {
    const result = selectTopMetrics([]);
    expect(result.length).toBe(0);
  });

  it("should boost metrics with anomalies", () => {
    const metrics: InsightMetric[] = [
      createTestMetric("runway_months", 3, 6, -50, "down"), // Low runway - alert
      createTestMetric("new_customers", 10, 8, 25, "up"),
      createTestMetric("hours_tracked", 40, 35, 14, "up"),
      createTestMetric("invoices_sent", 5, 4, 25, "up"),
    ];

    const result = selectTopMetrics(metrics, 2);

    // Low runway should be prioritized
    expect(result.some((m) => m.type === "runway_months")).toBe(true);
  });
});

describe("detectAnomalies", () => {
  it("should detect significant increase", () => {
    const metrics: InsightMetric[] = [
      createTestMetric("revenue", 15000, 10000, 50, "up"),
    ];

    const anomalies = detectAnomalies(metrics);

    expect(anomalies.length).toBe(1);
    expect(anomalies[0]?.type).toBe("significant_increase");
    expect(anomalies[0]?.severity).toBe("info");
  });

  it("should detect significant expense increase as warning", () => {
    const metrics: InsightMetric[] = [
      createTestMetric("expenses", 15000, 10000, 50, "up"),
    ];

    const anomalies = detectAnomalies(metrics);

    expect(anomalies.length).toBe(1);
    expect(anomalies[0]?.type).toBe("significant_expense_increase");
    expect(anomalies[0]?.severity).toBe("warning");
  });

  it("should detect significant decrease", () => {
    const metrics: InsightMetric[] = [
      createTestMetric("revenue", 5000, 10000, -50, "down"),
    ];

    const anomalies = detectAnomalies(metrics);

    expect(anomalies.length).toBe(1);
    expect(anomalies[0]?.type).toBe("significant_decrease");
    expect(anomalies[0]?.severity).toBe("warning");
  });

  it("should detect low runway warning", () => {
    const metrics: InsightMetric[] = [
      createTestMetric("runway_months", 5, 8, -37.5, "down"),
    ];

    const anomalies = detectAnomalies(metrics);

    const runwayAnomaly = anomalies.find((a) => a.type === "low_runway");
    expect(runwayAnomaly).toBeDefined();
    expect(runwayAnomaly?.severity).toBe("warning");
  });

  it("should detect critical runway as alert", () => {
    const metrics: InsightMetric[] = [
      createTestMetric("runway_months", 2, 5, -60, "down"),
    ];

    const anomalies = detectAnomalies(metrics);

    const runwayAnomaly = anomalies.find((a) => a.type === "low_runway");
    expect(runwayAnomaly).toBeDefined();
    expect(runwayAnomaly?.severity).toBe("alert");
  });

  it("should detect negative profit", () => {
    const metrics: InsightMetric[] = [
      createTestMetric("net_profit", -1000, 2000, -150, "down"),
    ];

    const anomalies = detectAnomalies(metrics);

    const profitAnomaly = anomalies.find((a) => a.type === "negative_profit");
    expect(profitAnomaly).toBeDefined();
    expect(profitAnomaly?.severity).toBe("warning");
  });

  it("should detect overdue invoices", () => {
    const metrics: InsightMetric[] = [
      createTestMetric("invoices_overdue", 3, 1, 200, "up"),
    ];

    const anomalies = detectAnomalies(metrics);

    const overdueAnomaly = anomalies.find((a) => a.type === "overdue_invoices");
    expect(overdueAnomaly).toBeDefined();
    expect(overdueAnomaly?.severity).toBe("warning");
  });

  it("should return empty array for normal metrics", () => {
    const metrics: InsightMetric[] = [
      createTestMetric("revenue", 10500, 10000, 5, "up"),
      createTestMetric("expenses", 4900, 5000, -2, "down"),
    ];

    const anomalies = detectAnomalies(metrics);

    expect(anomalies.length).toBe(0);
  });

  it("should accept Record<string, InsightMetric> input", () => {
    const metrics: Record<string, InsightMetric> = {
      revenue: createTestMetric("revenue", 15000, 10000, 50, "up"),
    };

    const anomalies = detectAnomalies(metrics);

    expect(anomalies.length).toBe(1);
  });
});
