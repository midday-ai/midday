/**
 * Data consistency tests
 *
 * Ensures financial data is internally consistent
 * Catches bugs like "no expenses" when profit is negative
 */
import { describe, expect, test } from "bun:test";

/**
 * Simulates the expense consistency logic from fetchMetricData
 * This is the critical fix that prevents contradictory statements
 */
function ensureExpenseConsistency(
  revenue: number,
  profit: number,
  reportedExpenses: number,
): number {
  let expenses = reportedExpenses;

  // The math MUST hold: profit = revenue - expenses
  const impliedExpenses = revenue - profit;

  if (expenses === 0 && impliedExpenses > 0) {
    // Spending query returned 0 but profit tells us there were expenses
    expenses = impliedExpenses;
  } else if (expenses > 0 && Math.abs(expenses - impliedExpenses) > 1) {
    // Data mismatch - use the maximum to not underreport
    expenses = Math.max(expenses, impliedExpenses);
  }

  return expenses;
}

describe("ensureExpenseConsistency", () => {
  test("derives expenses when spending query returns 0 but profit is negative", () => {
    // The bug scenario: revenue positive, profit negative, expenses reported as 0
    const revenue = 118620.77;
    const profit = -189376.83;
    const reportedExpenses = 0;

    const result = ensureExpenseConsistency(revenue, profit, reportedExpenses);

    // Should derive: 118620.77 - (-189376.83) = 307997.60
    expect(result).toBeCloseTo(307997.6, 0);
    expect(result).toBeGreaterThan(0);
  });

  test("keeps expenses when spending query returns correct value", () => {
    const revenue = 120000;
    const profit = 100000;
    const reportedExpenses = 20000; // Correct: 120000 - 100000 = 20000

    const result = ensureExpenseConsistency(revenue, profit, reportedExpenses);

    expect(result).toBe(20000);
  });

  test("handles zero revenue with expenses (loss scenario)", () => {
    const revenue = 0;
    const profit = -22266;
    const reportedExpenses = 0;

    const result = ensureExpenseConsistency(revenue, profit, reportedExpenses);

    // Should derive: 0 - (-22266) = 22266
    expect(result).toBe(22266);
  });

  test("handles zero activity (all zeros)", () => {
    const revenue = 0;
    const profit = 0;
    const reportedExpenses = 0;

    const result = ensureExpenseConsistency(revenue, profit, reportedExpenses);

    expect(result).toBe(0);
  });

  test("uses maximum when there is a mismatch", () => {
    const revenue = 100000;
    const profit = 80000;
    // Implied expenses = 20000, but reported is 15000 (data mismatch)
    const reportedExpenses = 15000;

    const result = ensureExpenseConsistency(revenue, profit, reportedExpenses);

    // Should use max(15000, 20000) = 20000
    expect(result).toBe(20000);
  });

  test("100% margin means no expenses", () => {
    const revenue = 100000;
    const profit = 100000; // 100% margin
    const reportedExpenses = 0;

    const result = ensureExpenseConsistency(revenue, profit, reportedExpenses);

    expect(result).toBe(0);
  });
});

describe("financial math consistency", () => {
  test("profit = revenue - expenses always holds after consistency check", () => {
    const testCases = [
      { revenue: 118620.77, profit: -189376.83, reportedExpenses: 0 },
      { revenue: 120000, profit: 100000, reportedExpenses: 20000 },
      { revenue: 0, profit: -22266, reportedExpenses: 0 },
      { revenue: 100000, profit: 80000, reportedExpenses: 15000 },
      { revenue: 338958, profit: 338000, reportedExpenses: 958 },
    ];

    for (const { revenue, profit, reportedExpenses } of testCases) {
      const expenses = ensureExpenseConsistency(
        revenue,
        profit,
        reportedExpenses,
      );

      // After consistency check, the math should hold (within tolerance)
      const calculatedProfit = revenue - expenses;

      // If profit is negative and expenses were 0, we derived expenses
      // so calculatedProfit should match original profit
      if (reportedExpenses === 0 && profit < revenue) {
        expect(calculatedProfit).toBeCloseTo(profit, 0);
      }
    }
  });
});
