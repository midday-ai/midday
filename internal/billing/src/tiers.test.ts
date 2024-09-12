import { describe, expect, test } from "vitest";

import { SchemaError } from "@internal/error";

import { calculateTieredPrices, type BillingTier } from "./tiers";

describe("calculateTieredPrices", () => {
  const testCases: {
    name: string;
    tiers: BillingTier[];
    units: number;
    expected: number;
  }[] = [
    {
      name: "only reaches the first tier",
      tiers: [
        { firstUnit: 1, lastUnit: 10, centsPerUnit: "100" },
        { firstUnit: 11, lastUnit: 20, centsPerUnit: "50" },
        { firstUnit: 21, lastUnit: null, centsPerUnit: "25" },
      ],
      units: 5,
      expected: 500,
    },
    {
      name: "only reaches the second tier",
      tiers: [
        { firstUnit: 1, lastUnit: 10, centsPerUnit: "100" },
        { firstUnit: 11, lastUnit: 20, centsPerUnit: "50" },
        { firstUnit: 21, lastUnit: null, centsPerUnit: "25" },
      ],
      units: 15,
      expected: 1250,
    },
    {
      name: "reaches the third tier",
      tiers: [
        { firstUnit: 1, lastUnit: 10, centsPerUnit: "100" },
        { firstUnit: 11, lastUnit: 20, centsPerUnit: "50" },
        { firstUnit: 21, lastUnit: null, centsPerUnit: "25" },
      ],
      units: 25,
      expected: 1625, // 10*1 + 10*0.5 + 5*0.25
    },
    {
      name: "single tier",
      tiers: [{ firstUnit: 1, lastUnit: null, centsPerUnit: "32.3" }],
      units: 12125,
      expected: 391637.5,
    },
    {
      name: "real world usage",
      tiers: [
        { firstUnit: 1, lastUnit: 2_500, centsPerUnit: null },
        { firstUnit: 2_501, lastUnit: 100_000, centsPerUnit: "0.02" },
        { firstUnit: 100_001, lastUnit: 500_000, centsPerUnit: "0.015" },
        { firstUnit: 500_001, lastUnit: 1_000_000, centsPerUnit: "0.01" },
        { firstUnit: 1_000_001, lastUnit: null, centsPerUnit: "0.005" },
      ],
      units: 3899437,
      expected: 27447.185,
    },
  ];
  for (const tc of testCases) {
    test(tc.name, () => {
      const result = calculateTieredPrices(tc.tiers, tc.units);
      expect(result.err).toBeUndefined();
      expect(result.val).toBeDefined();
      expect(result.val!.totalCentsEstimate).toBeCloseTo(tc.expected, 9);
    });
  }
});

describe("invalid tiers", () => {
  describe("empty array", () => {
    test("should fail", () => {
      const result = calculateTieredPrices([], 5);
      expect(result.err).toBeDefined();
      expect(result.err).instanceOf(SchemaError);

      expect(result.err?.message).toMatchInlineSnapshot(`
        "[
          {
            "code": "too_small",
            "minimum": 1,
            "type": "array",
            "inclusive": true,
            "exact": false,
            "message": "Array must contain at least 1 element(s)",
            "path": []
          }
        ]"
      `);
    });
  });

  describe("there is a gap between tiers", () => {
    test("should fail", () => {
      const result = calculateTieredPrices(
        [
          { firstUnit: 1, lastUnit: 10, centsPerUnit: "50" },
          { firstUnit: 12, lastUnit: 20, centsPerUnit: "100" },
        ],
        20,
      );
      expect(result.err).toBeDefined();
      expect(result.err).instanceOf(SchemaError);
      expect(result.err?.message).toEqual("There is a gap between tiers");
    });
  });
  describe("two tiers overlap", () => {
    test("should fail", () => {
      const result = calculateTieredPrices(
        [
          { firstUnit: 1, lastUnit: 10, centsPerUnit: "100" },
          { firstUnit: 10, lastUnit: null, centsPerUnit: "50" },
        ],
        20,
      );
      expect(result.err).toBeDefined();
      expect(result.err).instanceOf(SchemaError);

      expect(result.err?.message).toEqual("There is an overlap between tiers");
    });
  });
  describe("two tiers have a gap between", () => {
    test("should fail", () => {
      const result = calculateTieredPrices(
        [
          { firstUnit: 1, lastUnit: 10, centsPerUnit: "100" },
          { firstUnit: 12, lastUnit: null, centsPerUnit: "50" },
        ],
        20,
      );
      expect(result.err).toBeDefined();
      expect(result.err).instanceOf(SchemaError);
      expect(result.err!.message).toEqual("There is a gap between tiers");
    });
  });

  describe("any tier but the last has no lastUnit set", () => {
    test("should fail", () => {
      const { val, err } = calculateTieredPrices(
        [
          { firstUnit: 1, lastUnit: null, centsPerUnit: "100" },
          { firstUnit: 11, lastUnit: null, centsPerUnit: "50" },
        ],
        20,
      );
      expect(val).toBeUndefined();
      expect(err!.message).toEqual(
        "Every tier except the last one must have a lastUnit",
      );
    });
  });
});
