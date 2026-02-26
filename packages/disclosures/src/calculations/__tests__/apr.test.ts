import { describe, expect, test } from "bun:test";
import { calculateAPR, getPeriodsPerYear } from "../apr";

describe("calculateAPR", () => {
  test("returns 0 when total payments equal funded amount (no cost financing)", () => {
    // 100 payments of $100 = $10,000 funded
    const apr = calculateAPR(10_000, 100, 100, 252);
    expect(apr).toBe(0);
  });

  test("returns 0 for invalid inputs", () => {
    expect(calculateAPR(0, 100, 100, 252)).toBe(0);
    expect(calculateAPR(10_000, 0, 100, 252)).toBe(0);
    expect(calculateAPR(10_000, 100, 0, 252)).toBe(0);
  });

  test("calculates APR for a typical MCA deal with daily payments", () => {
    // $50,000 funded, $67,500 payback (1.35 factor), 126 daily payments (6 months)
    // Daily payment: $67,500 / 126 = $535.71
    const apr = calculateAPR(50_000, 535.71, 126, 252);
    expect(apr).toBeGreaterThan(0);
    // A 1.35 factor rate over 6 months should produce a high APR
    expect(apr).toBeGreaterThan(50);
    expect(apr).toBeLessThan(200);
  });

  test("calculates APR for a deal with weekly payments", () => {
    // $25,000 funded, $33,750 payback (1.35 factor), 26 weekly payments (6 months)
    // Weekly payment: $33,750 / 26 = $1,298.08
    const apr = calculateAPR(25_000, 1298.08, 26, 52);
    expect(apr).toBeGreaterThan(50);
    expect(apr).toBeLessThan(200);
  });

  test("calculates APR for a deal with monthly payments", () => {
    // $100,000 funded, $135,000 payback (1.35 factor), 12 monthly payments
    // Monthly payment: $135,000 / 12 = $11,250
    const apr = calculateAPR(100_000, 11_250, 12, 12);
    expect(apr).toBeGreaterThan(50);
    expect(apr).toBeLessThan(100);
  });

  test("higher factor rate produces higher APR", () => {
    // Same term (126 daily payments), different factor rates
    const apr135 = calculateAPR(50_000, 67_500 / 126, 126, 252);
    const apr150 = calculateAPR(50_000, 75_000 / 126, 126, 252);
    expect(apr150).toBeGreaterThan(apr135);
  });

  test("shorter term produces higher APR for same factor rate", () => {
    // Same factor rate 1.35, different terms
    const aprLong = calculateAPR(50_000, 67_500 / 252, 252, 252); // 1 year
    const aprShort = calculateAPR(50_000, 67_500 / 126, 126, 252); // 6 months
    expect(aprShort).toBeGreaterThan(aprLong);
  });

  test("accounts for fees deducted from proceeds", () => {
    // $50,000 funded, $2,000 origination fee deducted
    // Merchant receives $48,000 net
    // Same payback $67,500 over 126 daily payments
    const aprWithFees = calculateAPR(48_000, 535.71, 126, 252);
    const aprNoFees = calculateAPR(50_000, 535.71, 126, 252);
    // Lower net proceeds means higher effective APR
    expect(aprWithFees).toBeGreaterThan(aprNoFees);
  });

  test("returns reasonable APR for low-cost financing", () => {
    // 1.10 factor rate over 12 months = relatively low cost
    const apr = calculateAPR(100_000, 110_000 / 252, 252, 252);
    expect(apr).toBeGreaterThan(5);
    expect(apr).toBeLessThan(30);
  });
});

describe("getPeriodsPerYear", () => {
  test("returns correct periods for each frequency", () => {
    expect(getPeriodsPerYear("daily")).toBe(252);
    expect(getPeriodsPerYear("weekly")).toBe(52);
    expect(getPeriodsPerYear("bi_weekly")).toBe(26);
    expect(getPeriodsPerYear("monthly")).toBe(12);
  });
});
