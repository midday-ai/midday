import { describe, expect, test } from "bun:test";
import type { DealFee } from "../../types";
import {
  calculateFinanceCharge,
  calculateNetAmountFinanced,
  calculateTotalFees,
  calculateTotalRepayment,
  getFeeBreakdown,
} from "../finance-charge";

const sampleFees: DealFee[] = [
  {
    feeType: "origination",
    feeName: "Origination Fee",
    amount: 2000,
    percentage: 4,
  },
  {
    feeType: "processing",
    feeName: "Processing Fee",
    amount: 500,
    percentage: null,
  },
];

describe("calculateTotalFees", () => {
  test("sums all fee amounts", () => {
    expect(calculateTotalFees(sampleFees)).toBe(2500);
  });

  test("returns 0 for empty fees array", () => {
    expect(calculateTotalFees([])).toBe(0);
  });
});

describe("calculateFinanceCharge", () => {
  test("calculates finance charge correctly with fees", () => {
    // $50,000 funded, $67,500 payback, $2,500 in fees
    // Finance charge = 67,500 - 50,000 + 2,500 = $20,000
    const charge = calculateFinanceCharge(50_000, 67_500, sampleFees);
    expect(charge).toBe(20_000);
  });

  test("calculates finance charge correctly without fees", () => {
    // $50,000 funded, $67,500 payback, no fees
    // Finance charge = 67,500 - 50,000 = $17,500
    const charge = calculateFinanceCharge(50_000, 67_500, []);
    expect(charge).toBe(17_500);
  });
});

describe("calculateTotalRepayment", () => {
  test("includes fees in total repayment", () => {
    // $67,500 payback + $2,500 fees = $70,000
    expect(calculateTotalRepayment(67_500, sampleFees)).toBe(70_000);
  });

  test("returns payback amount when no fees", () => {
    expect(calculateTotalRepayment(67_500, [])).toBe(67_500);
  });
});

describe("calculateNetAmountFinanced", () => {
  test("subtracts fees from funding amount", () => {
    // $50,000 - $2,500 = $47,500
    expect(calculateNetAmountFinanced(50_000, sampleFees)).toBe(47_500);
  });

  test("returns funding amount when no fees", () => {
    expect(calculateNetAmountFinanced(50_000, [])).toBe(50_000);
  });
});

describe("getFeeBreakdown", () => {
  test("returns name/amount pairs for all fees", () => {
    const breakdown = getFeeBreakdown(sampleFees);
    expect(breakdown).toEqual([
      { name: "Origination Fee", amount: 2000 },
      { name: "Processing Fee", amount: 500 },
    ]);
  });

  test("returns empty array for no fees", () => {
    expect(getFeeBreakdown([])).toEqual([]);
  });
});
