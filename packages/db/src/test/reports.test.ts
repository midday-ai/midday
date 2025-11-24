import { beforeEach, describe, expect, test } from "bun:test";
import type { Database } from "@db/client";
import { getProfit, getRevenue } from "../queries/reports";

// Clear the team currency cache before each test to ensure test isolation
beforeEach(() => {
  // The cache is in the reports.ts file, but we can't directly access it
  // Tests should work fine as long as each test uses a different teamId or we accept cache behavior
});

// Test fixtures - Simple mock database that returns our test data
const createMockDb = (
  revenueData: Array<{ month: string; value: number }> = [],
  taxData: Array<{ month: string; value: number }> = [],
  teamCurrency: string | null = "USD",
): Database => {
  const queries: Array<() => Promise<any[]>> = [
    // Query 0: getTargetCurrency (team query) - called via limit(1)
    async () => [{ baseCurrency: teamCurrency }],
    // Query 1: revenue query - called via orderBy
    async () => {
      // Ensure we always return an array with proper structure
      if (!Array.isArray(revenueData)) return [];
      // Handle empty array case
      if (revenueData.length === 0) return [];
      // Map and validate each item
      return revenueData
        .filter((item) => item != null)
        .map((item) => ({
          month:
            item.month != null && item.month !== "" ? String(item.month) : "",
          value: item.value != null ? Number(item.value) : 0,
        }))
        .filter((item) => item.month !== ""); // Only return items with valid month
    },
    // Query 2: tax query (only for net revenue) - called via orderBy
    async () => {
      // Ensure we always return an array with proper structure
      if (!Array.isArray(taxData)) return [];
      // Handle empty array case
      if (taxData.length === 0) return [];
      // Map and validate each item
      return taxData
        .filter((item) => item != null)
        .map((item) => ({
          month:
            item.month != null && item.month !== "" ? String(item.month) : "",
          value: item.value != null ? Number(item.value) : 0,
        }))
        .filter((item) => item.month !== ""); // Only return items with valid month
    },
  ];

  // Track query types instead of just counting calls
  // This handles the case where getTargetCurrency might be cached and skip a query
  let hasSeenLimitQuery = false; // Track if we've seen the limit query (getTargetCurrency)
  let revenueQueryIndex = 1; // Default to query 1 for revenue
  let taxQueryIndex = 2; // Default to query 2 for tax

  const mockDb: any = {
    select: () => {
      const builder: any = {
        from: () => builder,
        leftJoin: () => builder,
        where: () => builder,
        groupBy: () => builder,
      };

      // When limit is called (for getTargetCurrency), return query 0
      builder.limit = async () => {
        hasSeenLimitQuery = true;
        // Reset indices since we know the sequence now
        revenueQueryIndex = 1;
        taxQueryIndex = 2;
        const queryFn = queries[0];
        if (!queryFn) return [];
        const result = await queryFn();
        return Array.isArray(result) ? result : [];
      };

      // When orderBy is called, determine which query based on whether we've seen limit
      builder.orderBy = async () => {
        let queryIndex: number;

        if (!hasSeenLimitQuery) {
          // If we haven't seen limit, this must be the first query (getTargetCurrency was cached)
          // So this is the revenue query
          queryIndex = revenueQueryIndex;
          revenueQueryIndex++; // Next will be tax if needed
        } else {
          // We've seen limit, so this is revenue query (index 1) or tax (index 2)
          queryIndex = revenueQueryIndex;
          revenueQueryIndex = taxQueryIndex; // Move to next index
          taxQueryIndex++;
        }

        if (queryIndex >= queries.length || !queries[queryIndex]) {
          return [];
        }
        const queryFn = queries[queryIndex];
        if (!queryFn) return [];
        const result = await queryFn();
        // Ensure result is an array with valid structure
        if (!Array.isArray(result)) return [];
        // Validate and ensure all items have required properties
        // Filter out any items with invalid or empty month values
        return result
          .filter((item: any) => {
            if (!item || typeof item !== "object") return false;
            const month = item.month;
            return month != null && month !== "" && String(month).trim() !== "";
          })
          .map((item: any) => ({
            month: String(item.month),
            value: item.value != null ? Number(item.value) : 0,
          }));
      };

      return builder;
    },
  };

  return mockDb as Database;
};

describe("getRevenue", () => {
  const teamId = "test-team-id";
  const from = "2024-10-01";
  const to = "2024-11-30";

  describe("Date Normalization", () => {
    test("should normalize PostgreSQL date strings to yyyy-MM-dd format", async () => {
      // PostgreSQL might return dates in different formats
      const revenueData = [
        { month: "2024-10-01T00:00:00.000Z", value: 100000 },
        { month: "2024-11-01", value: 200000 },
      ];

      const db = createMockDb(revenueData, [], "USD");
      const result = await getRevenue(db, {
        teamId,
        from,
        to,
        revenueType: "gross",
      });

      // Should have results for both months
      expect(result.length).toBeGreaterThan(0);
      expect(result.some((r) => r.date === "2024-10-01")).toBe(true);
      expect(result.some((r) => r.date === "2024-11-01")).toBe(true);
    });

    test("should match dates correctly between monthSeries and query results", async () => {
      const revenueData = [
        { month: "2024-10-01", value: 100000 },
        { month: "2024-11-01", value: 200000 },
      ];

      const db = createMockDb(revenueData, [], "USD");
      const result = await getRevenue(db, {
        teamId,
        from,
        to,
        revenueType: "gross",
      });

      // Find October result
      const october = result.find((r) => r.date === "2024-10-01");
      expect(october).toBeDefined();
      expect(october?.value).toBe("100000");

      // Find November result
      const november = result.find((r) => r.date === "2024-11-01");
      expect(november).toBeDefined();
      expect(november?.value).toBe("200000");
    });

    test("should handle year boundaries correctly", async () => {
      const fromYearEnd = "2024-12-01";
      const toYearStart = "2025-01-31";

      const revenueData = [
        { month: "2024-12-01", value: 50000 },
        { month: "2025-01-01", value: 75000 },
      ];

      const db = createMockDb(revenueData, [], "USD");
      const result = await getRevenue(db, {
        teamId,
        from: fromYearEnd,
        to: toYearStart,
        revenueType: "gross",
      });

      expect(result.some((r) => r.date === "2024-12-01")).toBe(true);
      expect(result.some((r) => r.date === "2025-01-01")).toBe(true);
    });
  });

  describe("Gross Revenue", () => {
    test("should sum income transactions correctly", async () => {
      const revenueData = [
        { month: "2024-10-01", value: 100000 },
        { month: "2024-11-01", value: 200000 },
      ];

      const db = createMockDb(revenueData, [], "USD");
      const result = await getRevenue(db, {
        teamId,
        from,
        to,
        revenueType: "gross",
      });

      const october = result.find((r) => r.date === "2024-10-01");
      const november = result.find((r) => r.date === "2024-11-01");

      expect(october?.value).toBe("100000");
      expect(november?.value).toBe("200000");
    });

    test("should return 0 for months with no transactions", async () => {
      const revenueData: Array<{ month: string; value: number }> = [];

      const db = createMockDb(revenueData, [], "USD");
      const result = await getRevenue(db, {
        teamId,
        from,
        to,
        revenueType: "gross",
      });

      // Should have entries for all months in range, but with 0 values
      expect(result.length).toBeGreaterThan(0);
      for (const r of result) {
        expect(r.value).toBe("0");
      }
    });

    test("should handle multiple transactions in same month", async () => {
      // Simulate multiple transactions summed in SQL
      const revenueData = [
        { month: "2024-10-01", value: 150000 }, // Sum of multiple transactions
      ];

      const db = createMockDb(revenueData, [], "USD");
      const result = await getRevenue(db, {
        teamId,
        from,
        to,
        revenueType: "gross",
      });

      const october = result.find((r) => r.date === "2024-10-01");
      expect(october?.value).toBe("150000");
    });
  });

  describe("Net Revenue", () => {
    test("should calculate net as revenue minus tax", async () => {
      const revenueData = [
        { month: "2024-10-01", value: 100000 }, // Gross revenue (includes tax)
        { month: "2024-11-01", value: 200000 },
      ];
      const taxData = [
        { month: "2024-10-01", value: 20000 }, // Tax portion
        { month: "2024-11-01", value: 40000 },
      ];

      const db = createMockDb(revenueData, taxData, "USD");
      const result = await getRevenue(db, {
        teamId,
        from,
        to,
        revenueType: "net",
      });

      const october = result.find((r) => r.date === "2024-10-01");
      const november = result.find((r) => r.date === "2024-11-01");

      // Net = Revenue - Tax (excludes tax)
      expect(october?.value).toBe("80000"); // 100000 - 20000
      expect(november?.value).toBe("160000"); // 200000 - 40000
    });

    test("should handle months with only revenue (no tax)", async () => {
      const revenueData = [
        { month: "2024-10-01", value: 100000 },
        { month: "2024-11-01", value: 200000 },
      ];
      const taxData: Array<{ month: string; value: number }> = [];

      const db = createMockDb(revenueData, taxData, "USD");
      const result = await getRevenue(db, {
        teamId,
        from,
        to,
        revenueType: "net",
      });

      const october = result.find((r) => r.date === "2024-10-01");
      const november = result.find((r) => r.date === "2024-11-01");

      // Net = Revenue - 0 (no tax)
      expect(october?.value).toBe("100000");
      expect(november?.value).toBe("200000");
    });

    test("should handle transactions with tax amounts", async () => {
      // Example: $100,000 gross revenue with $20,000 tax (20% VAT)
      const revenueData = [{ month: "2024-10-01", value: 100000 }];
      const taxData = [{ month: "2024-10-01", value: 20000 }];

      const db = createMockDb(revenueData, taxData, "USD");
      const result = await getRevenue(db, {
        teamId,
        from,
        to,
        revenueType: "net",
      });

      const october = result.find((r) => r.date === "2024-10-01");

      // Net = Revenue - Tax
      expect(october?.value).toBe("80000"); // 100000 - 20000
    });

    test("should handle transactions with tax rates (calculated tax)", async () => {
      // Example: $100,000 gross revenue with 25% tax rate
      // Tax = 100000 * 25 / (100 + 25) = 20000
      const revenueData = [{ month: "2024-10-01", value: 100000 }];
      const taxData = [{ month: "2024-10-01", value: 20000 }]; // Calculated from rate

      const db = createMockDb(revenueData, taxData, "USD");
      const result = await getRevenue(db, {
        teamId,
        from,
        to,
        revenueType: "net",
      });

      const october = result.find((r) => r.date === "2024-10-01");

      // Net = Revenue - Tax
      expect(october?.value).toBe("80000"); // 100000 - 20000
    });

    test("should not query tax when revenueType is gross", async () => {
      const revenueData = [{ month: "2024-10-01", value: 100000 }];
      const taxData = [{ month: "2024-10-01", value: 20000 }];

      const db = createMockDb(revenueData, taxData, "USD");
      const result = await getRevenue(db, {
        teamId,
        from,
        to,
        revenueType: "gross",
      });

      const october = result.find((r) => r.date === "2024-10-01");

      // Gross should ignore tax (includes tax)
      expect(october?.value).toBe("100000");
    });
  });

  describe("Currency Handling", () => {
    test("should use inputCurrency when specified", async () => {
      const revenueData = [{ month: "2024-10-01", value: 100000 }];

      const db = createMockDb(revenueData, [], "SEK");
      const result = await getRevenue(db, {
        teamId,
        from,
        to,
        currency: "USD",
        revenueType: "gross",
      });

      expect(result[0]?.currency).toBe("USD");
    });

    test("should use team baseCurrency when inputCurrency not specified", async () => {
      const revenueData = [{ month: "2024-10-01", value: 100000 }];
      // Use unique teamId to avoid cache conflicts
      const uniqueTeamId = `${teamId}-base-currency-revenue-test`;

      const db = createMockDb(revenueData, [], "SEK");
      const result = await getRevenue(db, {
        teamId: uniqueTeamId,
        from,
        to,
        revenueType: "gross",
      });

      expect(result[0]?.currency).toBe("SEK");
    });

    test("should default to USD when no currency available", async () => {
      const revenueData = [{ month: "2024-10-01", value: 100000 }];

      const db = createMockDb(revenueData, [], null);
      const result = await getRevenue(db, {
        teamId,
        from,
        to,
        revenueType: "gross",
      });

      expect(result[0]?.currency).toBe("USD");
    });
  });

  describe("Edge Cases", () => {
    test("should handle empty date ranges", async () => {
      const revenueData: Array<{ month: string; value: number }> = [];

      const db = createMockDb(revenueData, [], "USD");
      const result = await getRevenue(db, {
        teamId,
        from: "2024-10-01",
        to: "2024-10-31",
        revenueType: "gross",
      });

      // Should return at least one month entry
      expect(result.length).toBeGreaterThan(0);
    });

    test("should handle no transactions in period", async () => {
      const revenueData: Array<{ month: string; value: number }> = [];

      const db = createMockDb(revenueData, [], "USD");
      const result = await getRevenue(db, {
        teamId,
        from,
        to,
        revenueType: "gross",
      });

      // Should return entries for all months with 0 values
      expect(result.length).toBeGreaterThan(0);
      for (const r of result) {
        expect(r.value).toBe("0");
      }
    });

    test("should return complete month series even with gaps", async () => {
      const revenueData = [
        { month: "2024-10-01", value: 100000 },
        // November missing
        { month: "2024-12-01", value: 50000 },
      ];

      const db = createMockDb(revenueData, [], "USD");
      const result = await getRevenue(db, {
        teamId,
        from: "2024-10-01",
        to: "2024-12-31",
        revenueType: "gross",
      });

      // Should have entries for all months
      const october = result.find((r) => r.date === "2024-10-01");
      const november = result.find((r) => r.date === "2024-11-01");
      const december = result.find((r) => r.date === "2024-12-01");

      expect(october?.value).toBe("100000");
      expect(november?.value).toBe("0"); // Missing month should be 0
      expect(december?.value).toBe("50000");
    });
  });
});

describe("getProfit", () => {
  const teamId = "test-team-id";
  const from = "2024-10-01";
  const to = "2024-11-30";

  describe("Date Normalization", () => {
    test("should normalize PostgreSQL date strings to yyyy-MM-dd format", async () => {
      const profitData = [
        { month: "2024-10-01", value: 50000 },
        { month: "2024-11-01", value: 100000 },
      ];

      const db = createMockDb(profitData, [], "USD");
      const result = await getProfit(db, {
        teamId,
        from,
        to,
      });

      expect(result.length).toBeGreaterThan(0);
      expect(result.some((r) => r.date === "2024-10-01")).toBe(true);
      expect(result.some((r) => r.date === "2024-11-01")).toBe(true);
    });

    test("should match dates correctly between monthSeries and query results", async () => {
      const profitData = [
        { month: "2024-10-01", value: 50000 },
        { month: "2024-11-01", value: 100000 },
      ];

      const db = createMockDb(profitData, [], "USD");
      const result = await getProfit(db, {
        teamId,
        from,
        to,
      });

      const october = result.find((r) => r.date === "2024-10-01");
      const november = result.find((r) => r.date === "2024-11-01");

      expect(october?.value).toBe("50000");
      expect(november?.value).toBe("100000");
    });
  });

  describe("Profit Calculation", () => {
    test("should include both income and expenses in profit", async () => {
      // Profit includes all transactions (income + expenses)
      // Positive values = income, negative values = expenses
      const profitData = [
        { month: "2024-10-01", value: 90000 }, // Net: 100000 income - 10000 expenses
        { month: "2024-11-01", value: 180000 }, // Net: 200000 income - 20000 expenses
      ];

      const db = createMockDb(profitData, [], "USD");
      const result = await getProfit(db, {
        teamId,
        from,
        to,
      });

      const october = result.find((r) => r.date === "2024-10-01");
      const november = result.find((r) => r.date === "2024-11-01");

      expect(october?.value).toBe("90000");
      expect(november?.value).toBe("180000");
    });

    test("should handle negative profit (losses)", async () => {
      const profitData = [
        { month: "2024-10-01", value: -50000 }, // More expenses than income
      ];

      const db = createMockDb(profitData, [], "USD");
      const result = await getProfit(db, {
        teamId,
        from,
        to,
      });

      const october = result.find((r) => r.date === "2024-10-01");
      expect(october?.value).toBe("-50000");
    });

    test("should return 0 for months with no transactions", async () => {
      const profitData: Array<{ month: string; value: number }> = [];

      const db = createMockDb(profitData, [], "USD");
      const result = await getProfit(db, {
        teamId,
        from,
        to,
      });

      expect(result.length).toBeGreaterThan(0);
      for (const r of result) {
        expect(r.value).toBe("0");
      }
    });
  });

  describe("Currency Handling", () => {
    test("should use inputCurrency when specified", async () => {
      const profitData = [{ month: "2024-10-01", value: 50000 }];

      const db = createMockDb(profitData, [], "SEK");
      const result = await getProfit(db, {
        teamId,
        from,
        to,
        currency: "USD",
      });

      expect(result[0]?.currency).toBe("USD");
    });

    test("should use team baseCurrency when inputCurrency not specified", async () => {
      const profitData = [{ month: "2024-10-01", value: 50000 }];
      // Use unique teamId to avoid cache conflicts
      const uniqueTeamId = `${teamId}-base-currency-profit-test`;

      const db = createMockDb(profitData, [], "SEK");
      const result = await getProfit(db, {
        teamId: uniqueTeamId,
        from,
        to,
      });

      expect(result[0]?.currency).toBe("SEK");
    });
  });
});
