import { describe, expect, test } from "bun:test";
import {
  calculateNextScheduledDate,
  calculateUpcomingDates,
  shouldMarkCompleted,
  type RecurringInvoiceParams,
} from "../utils/invoice-recurring";

describe("calculateNextScheduledDate", () => {
  describe("weekly frequency", () => {
    test("returns next occurrence of target weekday", () => {
      // Tuesday, January 7, 2025
      const currentDate = new Date("2025-01-07T12:00:00.000Z");
      const params: RecurringInvoiceParams = {
        frequency: "weekly",
        frequencyDay: 5, // Friday
        frequencyWeek: null,
        frequencyInterval: null,
        timezone: "UTC",
      };

      const result = calculateNextScheduledDate(params, currentDate);

      // Should be Friday, January 10, 2025
      expect(result.getDay()).toBe(5); // Friday
      expect(result > currentDate).toBe(true);
    });

    test("skips to next week if target day is today or passed", () => {
      // Friday, January 10, 2025
      const currentDate = new Date("2025-01-10T12:00:00.000Z");
      const params: RecurringInvoiceParams = {
        frequency: "weekly",
        frequencyDay: 5, // Friday
        frequencyWeek: null,
        frequencyInterval: null,
        timezone: "UTC",
      };

      const result = calculateNextScheduledDate(params, currentDate);

      // Should be next Friday, January 17, 2025
      expect(result.getDay()).toBe(5); // Friday
      expect(result > currentDate).toBe(true);
    });

    test("handles Sunday (day 0) correctly", () => {
      // Wednesday, January 8, 2025
      const currentDate = new Date("2025-01-08T12:00:00.000Z");
      const params: RecurringInvoiceParams = {
        frequency: "weekly",
        frequencyDay: 0, // Sunday
        frequencyWeek: null,
        frequencyInterval: null,
        timezone: "UTC",
      };

      const result = calculateNextScheduledDate(params, currentDate);

      expect(result.getDay()).toBe(0); // Sunday
      expect(result > currentDate).toBe(true);
    });
  });

  describe("monthly_date frequency", () => {
    test("returns same date next month", () => {
      // January 15, 2025
      const currentDate = new Date("2025-01-15T12:00:00.000Z");
      const params: RecurringInvoiceParams = {
        frequency: "monthly_date",
        frequencyDay: 15,
        frequencyWeek: null,
        frequencyInterval: null,
        timezone: "UTC",
      };

      const result = calculateNextScheduledDate(params, currentDate);

      // Should be February 15, 2025
      expect(result.getMonth()).toBe(1); // February (0-indexed)
      expect(result.getDate()).toBe(15);
    });

    test("handles 31st in month with 30 days (April)", () => {
      // March 31, 2025
      const currentDate = new Date("2025-03-31T12:00:00.000Z");
      const params: RecurringInvoiceParams = {
        frequency: "monthly_date",
        frequencyDay: 31,
        frequencyWeek: null,
        frequencyInterval: null,
        timezone: "UTC",
      };

      const result = calculateNextScheduledDate(params, currentDate);

      // April has 30 days, so should fall back to 30th
      expect(result.getMonth()).toBe(3); // April (0-indexed)
      expect(result.getDate()).toBe(30);
    });

    test("handles 31st in February (non-leap year)", () => {
      // January 31, 2025
      const currentDate = new Date("2025-01-31T12:00:00.000Z");
      const params: RecurringInvoiceParams = {
        frequency: "monthly_date",
        frequencyDay: 31,
        frequencyWeek: null,
        frequencyInterval: null,
        timezone: "UTC",
      };

      const result = calculateNextScheduledDate(params, currentDate);

      // February 2025 has 28 days (non-leap year)
      expect(result.getMonth()).toBe(1); // February (0-indexed)
      expect(result.getDate()).toBe(28);
    });

    test("handles 29th in February (leap year)", () => {
      // January 29, 2024
      const currentDate = new Date("2024-01-29T12:00:00.000Z");
      const params: RecurringInvoiceParams = {
        frequency: "monthly_date",
        frequencyDay: 29,
        frequencyWeek: null,
        frequencyInterval: null,
        timezone: "UTC",
      };

      const result = calculateNextScheduledDate(params, currentDate);

      // February 2024 has 29 days (leap year)
      expect(result.getMonth()).toBe(1); // February (0-indexed)
      expect(result.getDate()).toBe(29);
    });
  });

  describe("monthly_weekday frequency", () => {
    test("returns nth occurrence of weekday", () => {
      // January 1, 2025
      const currentDate = new Date("2025-01-01T12:00:00.000Z");
      const params: RecurringInvoiceParams = {
        frequency: "monthly_weekday",
        frequencyDay: 5, // Friday
        frequencyWeek: 1, // 1st Friday
        frequencyInterval: null,
        timezone: "UTC",
      };

      const result = calculateNextScheduledDate(params, currentDate);

      // 1st Friday of February 2025 is Feb 7
      expect(result.getMonth()).toBe(1); // February (0-indexed)
      expect(result.getDay()).toBe(5); // Friday
      expect(result.getDate()).toBe(7);
    });

    test("handles 2nd Tuesday correctly", () => {
      // January 1, 2025
      const currentDate = new Date("2025-01-01T12:00:00.000Z");
      const params: RecurringInvoiceParams = {
        frequency: "monthly_weekday",
        frequencyDay: 2, // Tuesday
        frequencyWeek: 2, // 2nd Tuesday
        frequencyInterval: null,
        timezone: "UTC",
      };

      const result = calculateNextScheduledDate(params, currentDate);

      // 2nd Tuesday of February 2025 is Feb 11
      expect(result.getMonth()).toBe(1); // February (0-indexed)
      expect(result.getDay()).toBe(2); // Tuesday
      expect(result.getDate()).toBe(11);
    });
  });

  describe("custom frequency", () => {
    test("returns current date plus interval days", () => {
      // January 1, 2025
      const currentDate = new Date("2025-01-01T12:00:00.000Z");
      const params: RecurringInvoiceParams = {
        frequency: "custom",
        frequencyDay: null,
        frequencyWeek: null,
        frequencyInterval: 14, // Every 14 days
        timezone: "UTC",
      };

      const result = calculateNextScheduledDate(params, currentDate);

      // Should be January 15, 2025
      expect(result.getMonth()).toBe(0); // January (0-indexed)
      expect(result.getDate()).toBe(15);
    });

    test("defaults to 1 day if interval not specified", () => {
      const currentDate = new Date("2025-01-01T12:00:00.000Z");
      const params: RecurringInvoiceParams = {
        frequency: "custom",
        frequencyDay: null,
        frequencyWeek: null,
        frequencyInterval: null,
        timezone: "UTC",
      };

      const result = calculateNextScheduledDate(params, currentDate);

      expect(result.getDate()).toBe(2); // January 2
    });
  });

  describe("quarterly frequency", () => {
    test("returns same date 3 months later", () => {
      // January 15, 2025
      const currentDate = new Date("2025-01-15T12:00:00.000Z");
      const params: RecurringInvoiceParams = {
        frequency: "quarterly",
        frequencyDay: 15,
        frequencyWeek: null,
        frequencyInterval: null,
        timezone: "UTC",
      };

      const result = calculateNextScheduledDate(params, currentDate);

      // Should be April 15, 2025
      expect(result.getMonth()).toBe(3); // April (0-indexed)
      expect(result.getDate()).toBe(15);
    });

    test("handles 31st in month with 30 days", () => {
      // January 31, 2025 -> April has 30 days
      const currentDate = new Date("2025-01-31T12:00:00.000Z");
      const params: RecurringInvoiceParams = {
        frequency: "quarterly",
        frequencyDay: 31,
        frequencyWeek: null,
        frequencyInterval: null,
        timezone: "UTC",
      };

      const result = calculateNextScheduledDate(params, currentDate);

      // April has 30 days, should be April 30
      expect(result.getMonth()).toBe(3); // April (0-indexed)
      expect(result.getDate()).toBe(30);
    });

    test("handles February edge case", () => {
      // November 30, 2024 -> February 2025 has 28 days
      const currentDate = new Date("2024-11-30T12:00:00.000Z");
      const params: RecurringInvoiceParams = {
        frequency: "quarterly",
        frequencyDay: 30,
        frequencyWeek: null,
        frequencyInterval: null,
        timezone: "UTC",
      };

      const result = calculateNextScheduledDate(params, currentDate);

      // February 2025 has 28 days (non-leap year)
      expect(result.getMonth()).toBe(1); // February (0-indexed)
      expect(result.getDate()).toBe(28);
    });
  });

  describe("semi_annual frequency", () => {
    test("returns same date 6 months later", () => {
      // January 15, 2025
      const currentDate = new Date("2025-01-15T12:00:00.000Z");
      const params: RecurringInvoiceParams = {
        frequency: "semi_annual",
        frequencyDay: 15,
        frequencyWeek: null,
        frequencyInterval: null,
        timezone: "UTC",
      };

      const result = calculateNextScheduledDate(params, currentDate);

      // Should be July 15, 2025
      expect(result.getMonth()).toBe(6); // July (0-indexed)
      expect(result.getDate()).toBe(15);
    });

    test("handles month length differences", () => {
      // August 31, 2025 -> February 2026 has 28 days
      const currentDate = new Date("2025-08-31T12:00:00.000Z");
      const params: RecurringInvoiceParams = {
        frequency: "semi_annual",
        frequencyDay: 31,
        frequencyWeek: null,
        frequencyInterval: null,
        timezone: "UTC",
      };

      const result = calculateNextScheduledDate(params, currentDate);

      // February 2026 has 28 days
      expect(result.getMonth()).toBe(1); // February (0-indexed)
      expect(result.getDate()).toBe(28);
      expect(result.getFullYear()).toBe(2026);
    });
  });

  describe("annual frequency", () => {
    test("returns same date 12 months later", () => {
      // January 15, 2025
      const currentDate = new Date("2025-01-15T12:00:00.000Z");
      const params: RecurringInvoiceParams = {
        frequency: "annual",
        frequencyDay: 15,
        frequencyWeek: null,
        frequencyInterval: null,
        timezone: "UTC",
      };

      const result = calculateNextScheduledDate(params, currentDate);

      // Should be January 15, 2026
      expect(result.getFullYear()).toBe(2026);
      expect(result.getMonth()).toBe(0); // January (0-indexed)
      expect(result.getDate()).toBe(15);
    });

    test("handles leap year to non-leap year (Feb 29)", () => {
      // February 29, 2024 (leap year) -> 2025 (non-leap year)
      const currentDate = new Date("2024-02-29T12:00:00.000Z");
      const params: RecurringInvoiceParams = {
        frequency: "annual",
        frequencyDay: 29,
        frequencyWeek: null,
        frequencyInterval: null,
        timezone: "UTC",
      };

      const result = calculateNextScheduledDate(params, currentDate);

      // February 2025 has only 28 days
      expect(result.getFullYear()).toBe(2025);
      expect(result.getMonth()).toBe(1); // February (0-indexed)
      expect(result.getDate()).toBe(28);
    });

    test("handles non-leap year to leap year (Feb 28)", () => {
      // February 28, 2023 (non-leap year) -> 2024 (leap year)
      const currentDate = new Date("2023-02-28T12:00:00.000Z");
      const params: RecurringInvoiceParams = {
        frequency: "annual",
        frequencyDay: 28,
        frequencyWeek: null,
        frequencyInterval: null,
        timezone: "UTC",
      };

      const result = calculateNextScheduledDate(params, currentDate);

      // February 2024 has 29 days, but we keep the same day (28)
      expect(result.getFullYear()).toBe(2024);
      expect(result.getMonth()).toBe(1); // February (0-indexed)
      expect(result.getDate()).toBe(28);
    });
  });
});

describe("shouldMarkCompleted", () => {
  describe("endType: never", () => {
    test("always returns false", () => {
      expect(shouldMarkCompleted("never", null, null, 100, new Date())).toBe(
        false,
      );

      expect(
        shouldMarkCompleted(
          "never",
          new Date("2020-01-01"),
          null,
          100,
          new Date(),
        ),
      ).toBe(false);
    });
  });

  describe("endType: on_date", () => {
    test("returns true when next scheduled date exceeds end date", () => {
      const endDate = new Date("2025-06-01T00:00:00.000Z");
      const nextScheduledAt = new Date("2025-07-01T00:00:00.000Z");

      expect(
        shouldMarkCompleted("on_date", endDate, null, 5, nextScheduledAt),
      ).toBe(true);
    });

    test("returns false when next scheduled date is before end date", () => {
      const endDate = new Date("2025-06-01T00:00:00.000Z");
      const nextScheduledAt = new Date("2025-05-15T00:00:00.000Z");

      expect(
        shouldMarkCompleted("on_date", endDate, null, 5, nextScheduledAt),
      ).toBe(false);
    });

    test("returns false when endDate is null", () => {
      const nextScheduledAt = new Date("2025-07-01T00:00:00.000Z");

      expect(
        shouldMarkCompleted("on_date", null, null, 5, nextScheduledAt),
      ).toBe(false);
    });

    test("returns false when nextScheduledAt is null", () => {
      const endDate = new Date("2025-06-01T00:00:00.000Z");

      expect(shouldMarkCompleted("on_date", endDate, null, 5, null)).toBe(
        false,
      );
    });
  });

  describe("endType: after_count", () => {
    test("returns true when invoices generated equals end count", () => {
      expect(shouldMarkCompleted("after_count", null, 12, 12, new Date())).toBe(
        true,
      );
    });

    test("returns true when invoices generated exceeds end count", () => {
      expect(shouldMarkCompleted("after_count", null, 12, 15, new Date())).toBe(
        true,
      );
    });

    test("returns false when invoices generated is less than end count", () => {
      expect(shouldMarkCompleted("after_count", null, 12, 5, new Date())).toBe(
        false,
      );
    });

    test("returns false when endCount is null", () => {
      expect(
        shouldMarkCompleted("after_count", null, null, 100, new Date()),
      ).toBe(false);
    });
  });
});

describe("calculateUpcomingDates", () => {
  const baseParams: RecurringInvoiceParams = {
    frequency: "weekly",
    frequencyDay: 5, // Friday
    frequencyWeek: null,
    frequencyInterval: null,
    timezone: "UTC",
  };

  test("returns correct number of preview dates", () => {
    const startDate = new Date("2025-01-03T12:00:00.000Z"); // Friday
    const result = calculateUpcomingDates(
      baseParams,
      startDate,
      100,
      "USD",
      "never",
      null,
      null,
      0,
      5,
    );

    expect(result.invoices).toHaveLength(5);
  });

  test("respects end date limit", () => {
    const startDate = new Date("2025-01-03T12:00:00.000Z"); // Friday
    const endDate = new Date("2025-01-17T12:00:00.000Z"); // 2 weeks later

    const result = calculateUpcomingDates(
      baseParams,
      startDate,
      100,
      "USD",
      "on_date",
      endDate,
      null,
      0,
      10,
    );

    // Should only include dates <= endDate
    for (const invoice of result.invoices) {
      expect(new Date(invoice.date) <= endDate).toBe(true);
    }
  });

  test("respects end count limit", () => {
    const startDate = new Date("2025-01-03T12:00:00.000Z");
    const endCount = 3;

    const result = calculateUpcomingDates(
      baseParams,
      startDate,
      100,
      "USD",
      "after_count",
      null,
      endCount,
      0,
      10,
    );

    expect(result.invoices).toHaveLength(endCount);
  });

  test("accounts for already generated invoices in count limit", () => {
    const startDate = new Date("2025-01-03T12:00:00.000Z");
    const endCount = 5;
    const alreadyGenerated = 2;

    const result = calculateUpcomingDates(
      baseParams,
      startDate,
      100,
      "USD",
      "after_count",
      null,
      endCount,
      alreadyGenerated,
      10,
    );

    // Only 3 remaining (5 total - 2 already generated)
    expect(result.invoices).toHaveLength(3);
  });

  test("calculates correct summary for after_count", () => {
    const startDate = new Date("2025-01-03T12:00:00.000Z");
    const amount = 100;
    const endCount = 12;

    const result = calculateUpcomingDates(
      baseParams,
      startDate,
      amount,
      "USD",
      "after_count",
      null,
      endCount,
      0,
      5,
    );

    expect(result.summary.hasEndDate).toBe(true);
    expect(result.summary.totalCount).toBe(12);
    expect(result.summary.totalAmount).toBe(1200); // 12 * 100
    expect(result.summary.currency).toBe("USD");
  });

  test("calculates correct summary for never ending", () => {
    const startDate = new Date("2025-01-03T12:00:00.000Z");

    const result = calculateUpcomingDates(
      baseParams,
      startDate,
      100,
      "USD",
      "never",
      null,
      null,
      0,
      5,
    );

    expect(result.summary.hasEndDate).toBe(false);
    expect(result.summary.totalCount).toBe(null);
    expect(result.summary.totalAmount).toBe(null);
  });

  test("includes correct date in each invoice", () => {
    const startDate = new Date("2025-01-03T12:00:00.000Z"); // Friday
    const result = calculateUpcomingDates(
      baseParams,
      startDate,
      100,
      "USD",
      "never",
      null,
      null,
      0,
      3,
    );

    // Each invoice should have a valid ISO date string
    for (const invoice of result.invoices) {
      expect(invoice.date).toBeDefined();
      expect(new Date(invoice.date).toISOString()).toBe(invoice.date);
      expect(invoice.amount).toBe(100);
    }
  });
});
