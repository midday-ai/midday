import { describe, expect, test } from "bun:test";
import {
  calculateNumberOfPayments,
  calculatePaymentAmount,
  calculateTermLengthDays,
} from "../payment-schedule";

describe("calculateTermLengthDays", () => {
  test("calculates days between funded and payoff dates", () => {
    // 6 months: Jan 1 to Jul 1 = 181 days
    const days = calculateTermLengthDays("2024-01-01", "2024-07-01");
    expect(days).toBe(182); // 2024 is a leap year
  });

  test("calculates exactly 365 days for a full year", () => {
    const days = calculateTermLengthDays("2025-01-01", "2026-01-01");
    expect(days).toBe(365);
  });

  test("handles short terms", () => {
    const days = calculateTermLengthDays("2024-01-01", "2024-02-01");
    expect(days).toBe(31);
  });
});

describe("calculateNumberOfPayments", () => {
  test("calculates daily business-day payments (~5/7 of calendar days)", () => {
    // 182 calendar days -> ~130 business days
    const payments = calculateNumberOfPayments(182, "daily");
    expect(payments).toBe(130);
  });

  test("calculates weekly payments", () => {
    // 182 calendar days -> 26 weeks
    const payments = calculateNumberOfPayments(182, "weekly");
    expect(payments).toBe(26);
  });

  test("calculates bi-weekly payments", () => {
    // 182 calendar days -> 13 bi-weekly periods
    const payments = calculateNumberOfPayments(182, "bi_weekly");
    expect(payments).toBe(13);
  });

  test("calculates monthly payments", () => {
    // 182 calendar days -> ~6 months
    const payments = calculateNumberOfPayments(182, "monthly");
    expect(payments).toBe(6);
  });

  test("calculates 12 monthly payments for 365 days", () => {
    const payments = calculateNumberOfPayments(365, "monthly");
    expect(payments).toBe(12);
  });
});

describe("calculatePaymentAmount", () => {
  test("returns daily payment when provided for daily frequency", () => {
    const amount = calculatePaymentAmount(67_500, 130, 535.71, "daily");
    expect(amount).toBe(535.71);
  });

  test("derives weekly payment from daily payment", () => {
    // $535.71/day * 5 business days = $2,678.55/week
    const amount = calculatePaymentAmount(67_500, 26, 535.71, "weekly");
    expect(amount).toBe(535.71 * 5);
  });

  test("derives bi-weekly payment from daily payment", () => {
    // $535.71/day * 10 business days = $5,357.10/bi-week
    const amount = calculatePaymentAmount(67_500, 13, 535.71, "bi_weekly");
    expect(amount).toBe(535.71 * 10);
  });

  test("derives monthly payment from daily payment", () => {
    // $535.71/day * 21 business days = $11,249.91/month
    const amount = calculatePaymentAmount(67_500, 6, 535.71, "monthly");
    expect(amount).toBe(535.71 * 21);
  });

  test("falls back to even division when no daily payment", () => {
    // $67,500 / 130 payments = $519.23
    const amount = calculatePaymentAmount(67_500, 130, null, "daily");
    expect(amount).toBe(519.23);
  });

  test("returns 0 when no payments", () => {
    expect(calculatePaymentAmount(67_500, 0, null, "daily")).toBe(0);
  });
});
