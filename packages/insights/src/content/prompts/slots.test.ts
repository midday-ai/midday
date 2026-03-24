/**
 * Unit tests for slots computation
 *
 * Ensures profit change descriptions are semantically correct
 * and prevents misleading language like "profit doubled" when still in loss
 */
import { describe, expect, test } from "bun:test";
import { computeProfitChangeDescription } from "./slots";

describe("computeProfitChangeDescription", () => {
  describe("flat changes (< 5%)", () => {
    test("small positive change is flat", () => {
      expect(computeProfitChangeDescription(102, 100, 2)).toBe(
        "flat vs last week",
      );
    });

    test("small negative change is flat", () => {
      expect(computeProfitChangeDescription(98, 100, -2)).toBe(
        "flat vs last week",
      );
    });

    test("small change in loss territory is flat", () => {
      expect(computeProfitChangeDescription(-98, -100, 2)).toBe(
        "flat vs last week",
      );
    });
  });

  describe("both periods profitable", () => {
    test("profit up", () => {
      expect(computeProfitChangeDescription(75000, 50000, 50)).toBe(
        "up 50% vs last week",
      );
    });

    test("profit down", () => {
      expect(computeProfitChangeDescription(60000, 100000, -40)).toBe(
        "down 40% vs last week",
      );
    });

    test("large profit increase", () => {
      expect(computeProfitChangeDescription(200000, 50000, 300)).toBe(
        "up 300% vs last week",
      );
    });
  });

  describe("both periods in loss - THE BUG CASES", () => {
    test("loss decreased (the -189k to -7k scenario)", () => {
      // This is the critical bug case - must NOT say "up 96%" or "doubled"
      expect(computeProfitChangeDescription(-7148, -189376, 96)).toBe(
        "loss decreased 96% vs last week",
      );
    });

    test("loss decreased moderately", () => {
      expect(computeProfitChangeDescription(-50000, -100000, 50)).toBe(
        "loss decreased 50% vs last week",
      );
    });

    test("loss increased", () => {
      expect(computeProfitChangeDescription(-50000, -10000, -400)).toBe(
        "loss increased 400% vs last week",
      );
    });

    test("loss increased moderately", () => {
      expect(computeProfitChangeDescription(-30000, -20000, -50)).toBe(
        "loss increased 50% vs last week",
      );
    });
  });

  describe("crossing zero - profit/loss transitions", () => {
    test("loss to profit (recovery)", () => {
      expect(computeProfitChangeDescription(30000, -20000, 250)).toBe(
        "returned to profit",
      );
    });

    test("profit to loss", () => {
      expect(computeProfitChangeDescription(-10000, 50000, -120)).toBe(
        "turned to loss",
      );
    });

    test("small loss to small profit", () => {
      expect(computeProfitChangeDescription(5000, -5000, 200)).toBe(
        "returned to profit",
      );
    });

    test("small profit to small loss", () => {
      expect(computeProfitChangeDescription(-5000, 5000, -200)).toBe(
        "turned to loss",
      );
    });
  });

  describe("from zero", () => {
    test("zero to profit", () => {
      expect(computeProfitChangeDescription(25000, 0, 100)).toBe(
        "profit this week",
      );
    });

    test("zero to loss", () => {
      expect(computeProfitChangeDescription(-15000, 0, -100)).toBe(
        "loss this week",
      );
    });
  });

  describe("to zero (break-even)", () => {
    test("profit to break-even", () => {
      expect(computeProfitChangeDescription(0, 30000, -100)).toBe(
        "break-even this week",
      );
    });

    test("loss to break-even", () => {
      expect(computeProfitChangeDescription(0, -20000, 100)).toBe(
        "break-even this week",
      );
    });
  });

  describe("edge cases", () => {
    test("both zero", () => {
      expect(computeProfitChangeDescription(0, 0, 0)).toBe("flat vs last week");
    });

    test("very large numbers", () => {
      expect(computeProfitChangeDescription(10000000, 5000000, 100)).toBe(
        "up 100% vs last week",
      );
    });

    test("very small numbers", () => {
      expect(computeProfitChangeDescription(100, 50, 100)).toBe(
        "up 100% vs last week",
      );
    });

    test("rounds percentage to whole number", () => {
      expect(computeProfitChangeDescription(75500, 50000, 51.5)).toBe(
        "up 52% vs last week",
      );
    });
  });
});
