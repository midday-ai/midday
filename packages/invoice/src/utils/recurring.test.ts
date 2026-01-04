import { describe, expect, test } from "bun:test";
import {
  type RecurringConfig,
  calculatePreviewDates,
  calculateSummary,
  formatDayOfWeek,
  formatNextScheduled,
  formatOrdinal,
  formatRecurringProgress,
  formatShortDate,
  getFrequencyLabel,
  getFrequencyShortLabel,
  getNextDate,
  getNthWeekdayOfMonth,
  isValidRecurringConfig,
  validateRecurringConfig,
} from "./recurring";

describe("getNthWeekdayOfMonth", () => {
  describe("finding first occurrence", () => {
    test("finds 1st Friday of February 2025", () => {
      const result = getNthWeekdayOfMonth(2025, 1, 5, 1); // Feb, Friday, 1st
      expect(result.getFullYear()).toBe(2025);
      expect(result.getMonth()).toBe(1); // February
      expect(result.getDate()).toBe(7); // Feb 7, 2025
      expect(result.getDay()).toBe(5); // Friday
    });

    test("finds 1st Monday of January 2025", () => {
      // January 2025 starts on Wednesday, so first Monday is Jan 6
      const result = getNthWeekdayOfMonth(2025, 0, 1, 1); // Jan, Monday, 1st
      expect(result.getDate()).toBe(6);
      expect(result.getDay()).toBe(1); // Monday
    });

    test("finds 1st Sunday when month starts on Sunday", () => {
      // June 2025 starts on Sunday
      const result = getNthWeekdayOfMonth(2025, 5, 0, 1); // June, Sunday, 1st
      expect(result.getDate()).toBe(1);
      expect(result.getDay()).toBe(0); // Sunday
    });
  });

  describe("finding nth occurrence", () => {
    test("finds 2nd Friday of February 2025", () => {
      const result = getNthWeekdayOfMonth(2025, 1, 5, 2); // Feb, Friday, 2nd
      expect(result.getDate()).toBe(14); // Feb 14, 2025
      expect(result.getDay()).toBe(5); // Friday
    });

    test("finds 3rd Tuesday of March 2025", () => {
      const result = getNthWeekdayOfMonth(2025, 2, 2, 3); // March, Tuesday, 3rd
      expect(result.getDate()).toBe(18); // March 18, 2025
      expect(result.getDay()).toBe(2); // Tuesday
    });

    test("finds 4th Thursday of November 2025 (Thanksgiving)", () => {
      const result = getNthWeekdayOfMonth(2025, 10, 4, 4); // Nov, Thursday, 4th
      expect(result.getDate()).toBe(27); // Nov 27, 2025
      expect(result.getDay()).toBe(4); // Thursday
    });

    test("finds 5th Saturday when it exists", () => {
      // March 2025 has 5 Saturdays (1, 8, 15, 22, 29)
      const result = getNthWeekdayOfMonth(2025, 2, 6, 5); // March, Saturday, 5th
      expect(result.getDate()).toBe(29);
      expect(result.getDay()).toBe(6); // Saturday
    });
  });

  describe("edge cases", () => {
    test("handles leap year February", () => {
      // Feb 2024 is a leap year
      const result = getNthWeekdayOfMonth(2024, 1, 4, 4); // Feb 2024, Thursday, 4th
      expect(result.getDate()).toBe(22);
      expect(result.getDay()).toBe(4); // Thursday
    });

    test("5th occurrence may fall outside month (returns date in next month)", () => {
      // February 2025 has only 4 Fridays (7, 14, 21, 28)
      // 5th Friday calculation would be 35 days from 1st, which goes into March
      const result = getNthWeekdayOfMonth(2025, 1, 5, 5);
      // This returns March 7 (5th "Friday" position from Feb 1)
      expect(result.getMonth()).toBe(2); // March
      expect(result.getDay()).toBe(5); // Friday
    });
  });
});

describe("getNextDate", () => {
  describe("weekly frequency", () => {
    test("adds 7 days for weekly", () => {
      const config: RecurringConfig = {
        frequency: "weekly",
        frequencyDay: 5, // Friday
        frequencyWeek: null,
        frequencyInterval: null,
        endType: "never",
        endDate: null,
        endCount: null,
      };
      const currentDate = new Date("2025-01-10"); // Friday
      const result = getNextDate(config, currentDate);

      expect(result.getDate()).toBe(17); // Jan 17, 2025
    });
  });

  describe("monthly_date frequency", () => {
    test("adds 1 month for monthly_date", () => {
      const config: RecurringConfig = {
        frequency: "monthly_date",
        frequencyDay: 15,
        frequencyWeek: null,
        frequencyInterval: null,
        endType: "never",
        endDate: null,
        endCount: null,
      };
      const currentDate = new Date("2025-01-15");
      const result = getNextDate(config, currentDate);

      expect(result.getMonth()).toBe(1); // February
      expect(result.getDate()).toBe(15);
    });

    test("handles month end edge case (31st to 30-day month)", () => {
      const config: RecurringConfig = {
        frequency: "monthly_date",
        frequencyDay: 31,
        frequencyWeek: null,
        frequencyInterval: null,
        endType: "never",
        endDate: null,
        endCount: null,
      };
      // March 31 -> April (which has 30 days)
      const currentDate = new Date("2025-03-31");
      const result = getNextDate(config, currentDate);

      // Should clamp to April 30 (last day of month)
      expect(result.getMonth()).toBe(3); // April
      expect(result.getDate()).toBe(30);
    });

    test("handles 31st to February (non-leap year)", () => {
      const config: RecurringConfig = {
        frequency: "monthly_date",
        frequencyDay: 31,
        frequencyWeek: null,
        frequencyInterval: null,
        endType: "never",
        endDate: null,
        endCount: null,
      };
      const currentDate = new Date("2025-01-31");
      const result = getNextDate(config, currentDate);

      // Should clamp to February 28 (last day of Feb in non-leap year)
      expect(result.getMonth()).toBe(1); // February
      expect(result.getDate()).toBe(28);
    });

    test("handles 31st to February (leap year)", () => {
      const config: RecurringConfig = {
        frequency: "monthly_date",
        frequencyDay: 31,
        frequencyWeek: null,
        frequencyInterval: null,
        endType: "never",
        endDate: null,
        endCount: null,
      };
      const currentDate = new Date("2024-01-31");
      const result = getNextDate(config, currentDate);

      // Should clamp to February 29 (last day of Feb in leap year)
      expect(result.getMonth()).toBe(1); // February
      expect(result.getDate()).toBe(29);
    });
  });

  describe("monthly_weekday frequency", () => {
    test("finds 2nd Friday of next month correctly", () => {
      const config: RecurringConfig = {
        frequency: "monthly_weekday",
        frequencyDay: 5, // Friday
        frequencyWeek: 2, // 2nd Friday
        frequencyInterval: null,
        endType: "never",
        endDate: null,
        endCount: null,
      };
      // January 10, 2025 is a Friday (the 2nd Friday of January)
      const currentDate = new Date("2025-01-10");
      const result = getNextDate(config, currentDate);

      // 2nd Friday of February 2025 is Feb 14
      expect(result.getMonth()).toBe(1); // February
      expect(result.getDate()).toBe(14);
      expect(result.getDay()).toBe(5); // Friday
    });

    test("finds 1st Monday of next month correctly", () => {
      const config: RecurringConfig = {
        frequency: "monthly_weekday",
        frequencyDay: 1, // Monday
        frequencyWeek: 1, // 1st Monday
        frequencyInterval: null,
        endType: "never",
        endDate: null,
        endCount: null,
      };
      const currentDate = new Date("2025-01-06"); // 1st Monday of Jan
      const result = getNextDate(config, currentDate);

      // 1st Monday of February 2025 is Feb 3
      expect(result.getMonth()).toBe(1); // February
      expect(result.getDate()).toBe(3);
      expect(result.getDay()).toBe(1); // Monday
    });

    test("finds 4th Thursday of next month correctly", () => {
      const config: RecurringConfig = {
        frequency: "monthly_weekday",
        frequencyDay: 4, // Thursday
        frequencyWeek: 4, // 4th Thursday
        frequencyInterval: null,
        endType: "never",
        endDate: null,
        endCount: null,
      };
      const currentDate = new Date("2025-01-23"); // 4th Thursday of Jan
      const result = getNextDate(config, currentDate);

      // 4th Thursday of February 2025 is Feb 27
      expect(result.getMonth()).toBe(1); // February
      expect(result.getDate()).toBe(27);
      expect(result.getDay()).toBe(4); // Thursday
    });

    test("handles default values for null frequencyDay and frequencyWeek", () => {
      const config: RecurringConfig = {
        frequency: "monthly_weekday",
        frequencyDay: null, // defaults to 0 (Sunday)
        frequencyWeek: null, // defaults to 1 (1st)
        frequencyInterval: null,
        endType: "never",
        endDate: null,
        endCount: null,
      };
      const currentDate = new Date("2025-01-05"); // 1st Sunday of Jan
      const result = getNextDate(config, currentDate);

      // 1st Sunday of February 2025 is Feb 2
      expect(result.getMonth()).toBe(1);
      expect(result.getDate()).toBe(2);
      expect(result.getDay()).toBe(0); // Sunday
    });
  });

  describe("custom frequency", () => {
    test("adds custom interval days", () => {
      const config: RecurringConfig = {
        frequency: "custom",
        frequencyDay: null,
        frequencyWeek: null,
        frequencyInterval: 14, // Every 14 days
        endType: "never",
        endDate: null,
        endCount: null,
      };
      const currentDate = new Date("2025-01-01");
      const result = getNextDate(config, currentDate);

      expect(result.getMonth()).toBe(0); // January
      expect(result.getDate()).toBe(15);
    });

    test("defaults to 1 day if interval is null", () => {
      const config: RecurringConfig = {
        frequency: "custom",
        frequencyDay: null,
        frequencyWeek: null,
        frequencyInterval: null,
        endType: "never",
        endDate: null,
        endCount: null,
      };
      const currentDate = new Date("2025-01-01");
      const result = getNextDate(config, currentDate);

      expect(result.getDate()).toBe(2);
    });
  });

  describe("quarterly frequency", () => {
    test("adds 3 months", () => {
      const config: RecurringConfig = {
        frequency: "quarterly",
        frequencyDay: 15,
        frequencyWeek: null,
        frequencyInterval: null,
        endType: "never",
        endDate: null,
        endCount: null,
      };
      const currentDate = new Date("2025-01-15");
      const result = getNextDate(config, currentDate);

      expect(result.getMonth()).toBe(3); // April
      expect(result.getDate()).toBe(15);
    });

    test("handles month-end edge cases", () => {
      const config: RecurringConfig = {
        frequency: "quarterly",
        frequencyDay: 31,
        frequencyWeek: null,
        frequencyInterval: null,
        endType: "never",
        endDate: null,
        endCount: null,
      };
      // January 31 -> April (30 days)
      const currentDate = new Date("2025-01-31");
      const result = getNextDate(config, currentDate);

      expect(result.getMonth()).toBe(3); // April
      expect(result.getDate()).toBe(30);
    });
  });

  describe("semi_annual frequency", () => {
    test("adds 6 months", () => {
      const config: RecurringConfig = {
        frequency: "semi_annual",
        frequencyDay: 15,
        frequencyWeek: null,
        frequencyInterval: null,
        endType: "never",
        endDate: null,
        endCount: null,
      };
      const currentDate = new Date("2025-01-15");
      const result = getNextDate(config, currentDate);

      expect(result.getMonth()).toBe(6); // July
      expect(result.getDate()).toBe(15);
    });

    test("handles February edge case", () => {
      const config: RecurringConfig = {
        frequency: "semi_annual",
        frequencyDay: 31,
        frequencyWeek: null,
        frequencyInterval: null,
        endType: "never",
        endDate: null,
        endCount: null,
      };
      // August 31 -> February (28 days in 2026)
      const currentDate = new Date("2025-08-31");
      const result = getNextDate(config, currentDate);

      expect(result.getMonth()).toBe(1); // February
      expect(result.getDate()).toBe(28);
      expect(result.getFullYear()).toBe(2026);
    });
  });

  describe("annual frequency", () => {
    test("adds 12 months", () => {
      const config: RecurringConfig = {
        frequency: "annual",
        frequencyDay: 15,
        frequencyWeek: null,
        frequencyInterval: null,
        endType: "never",
        endDate: null,
        endCount: null,
      };
      const currentDate = new Date("2025-01-15");
      const result = getNextDate(config, currentDate);

      expect(result.getFullYear()).toBe(2026);
      expect(result.getMonth()).toBe(0); // January
      expect(result.getDate()).toBe(15);
    });

    test("handles leap year to non-leap year (Feb 29)", () => {
      const config: RecurringConfig = {
        frequency: "annual",
        frequencyDay: 29,
        frequencyWeek: null,
        frequencyInterval: null,
        endType: "never",
        endDate: null,
        endCount: null,
      };
      // Feb 29, 2024 (leap year) -> Feb 2025 (non-leap)
      const currentDate = new Date("2024-02-29");
      const result = getNextDate(config, currentDate);

      expect(result.getFullYear()).toBe(2025);
      expect(result.getMonth()).toBe(1); // February
      expect(result.getDate()).toBe(28);
    });
  });
});

describe("calculatePreviewDates", () => {
  test("returns correct number of preview dates", () => {
    const config: RecurringConfig = {
      frequency: "weekly",
      frequencyDay: 5,
      frequencyWeek: null,
      frequencyInterval: null,
      endType: "never",
      endDate: null,
      endCount: null,
    };
    const startDate = new Date("2025-01-03");
    const result = calculatePreviewDates(config, startDate, 100, 5);

    expect(result).toHaveLength(5);
  });

  test("respects end count limit", () => {
    const config: RecurringConfig = {
      frequency: "weekly",
      frequencyDay: 5,
      frequencyWeek: null,
      frequencyInterval: null,
      endType: "after_count",
      endDate: null,
      endCount: 2,
    };
    const startDate = new Date("2025-01-03");
    const result = calculatePreviewDates(config, startDate, 100, 10);

    expect(result).toHaveLength(2);
  });

  test("respects end date limit", () => {
    const config: RecurringConfig = {
      frequency: "weekly",
      frequencyDay: 5,
      frequencyWeek: null,
      frequencyInterval: null,
      endType: "on_date",
      endDate: "2025-01-17",
      endCount: null,
    };
    const startDate = new Date("2025-01-03");
    const result = calculatePreviewDates(config, startDate, 100, 10);

    // Jan 3, 10, 17 - should get 3 invoices
    expect(result).toHaveLength(3);
    for (const invoice of result) {
      expect(invoice.date <= new Date("2025-01-17")).toBe(true);
    }
  });

  test("includes correct amount for each invoice", () => {
    const config: RecurringConfig = {
      frequency: "monthly_date",
      frequencyDay: 1,
      frequencyWeek: null,
      frequencyInterval: null,
      endType: "after_count",
      endDate: null,
      endCount: 3,
    };
    const startDate = new Date("2025-01-01");
    const result = calculatePreviewDates(config, startDate, 250.5, 3);

    for (const invoice of result) {
      expect(invoice.amount).toBe(250.5);
    }
  });

  test("calculates correct dates for monthly_weekday", () => {
    const config: RecurringConfig = {
      frequency: "monthly_weekday",
      frequencyDay: 5, // Friday
      frequencyWeek: 2, // 2nd Friday
      frequencyInterval: null,
      endType: "after_count",
      endDate: null,
      endCount: 3,
    };
    // Start from 2nd Friday of January 2025 (Jan 10)
    const startDate = new Date("2025-01-10");
    const result = calculatePreviewDates(config, startDate, 100, 3);

    expect(result).toHaveLength(3);
    // First: Jan 10 (2nd Friday of Jan)
    expect(result[0]?.date.getDate()).toBe(10);
    expect(result[0]?.date.getMonth()).toBe(0);
    // Second: Feb 14 (2nd Friday of Feb)
    expect(result[1]?.date.getDate()).toBe(14);
    expect(result[1]?.date.getMonth()).toBe(1);
    // Third: Mar 14 (2nd Friday of Mar)
    expect(result[2]?.date.getDate()).toBe(14);
    expect(result[2]?.date.getMonth()).toBe(2);
  });
});

describe("calculateSummary", () => {
  test("returns null for never-ending series", () => {
    const config: RecurringConfig = {
      frequency: "weekly",
      frequencyDay: 5,
      frequencyWeek: null,
      frequencyInterval: null,
      endType: "never",
      endDate: null,
      endCount: null,
    };
    const result = calculateSummary(config, new Date("2025-01-01"), 100);

    expect(result.totalCount).toBeNull();
    expect(result.totalAmount).toBeNull();
  });

  test("calculates correctly for after_count", () => {
    const config: RecurringConfig = {
      frequency: "monthly_date",
      frequencyDay: 15,
      frequencyWeek: null,
      frequencyInterval: null,
      endType: "after_count",
      endDate: null,
      endCount: 12,
    };
    const result = calculateSummary(config, new Date("2025-01-15"), 100);

    expect(result.totalCount).toBe(12);
    expect(result.totalAmount).toBe(1200);
  });

  test("calculates correctly for on_date with weekly frequency", () => {
    const config: RecurringConfig = {
      frequency: "weekly",
      frequencyDay: 5,
      frequencyWeek: null,
      frequencyInterval: null,
      endType: "on_date",
      endDate: "2025-01-31",
      endCount: null,
    };
    // Start Jan 3, weekly until Jan 31
    // Jan 3, 10, 17, 24, 31 = 5 invoices
    const result = calculateSummary(config, new Date("2025-01-03"), 50);

    expect(result.totalCount).toBe(5);
    expect(result.totalAmount).toBe(250);
  });

  test("calculates correctly for on_date with monthly_weekday frequency", () => {
    const config: RecurringConfig = {
      frequency: "monthly_weekday",
      frequencyDay: 5, // Friday
      frequencyWeek: 2, // 2nd Friday
      frequencyInterval: null,
      endType: "on_date",
      endDate: "2025-06-30",
      endCount: null,
    };
    // 2nd Fridays: Jan 10, Feb 14, Mar 14, Apr 11, May 9, Jun 13 = 6 invoices
    const result = calculateSummary(config, new Date("2025-01-10"), 100);

    expect(result.totalCount).toBe(6);
    expect(result.totalAmount).toBe(600);
  });
});

describe("formatting utilities", () => {
  describe("formatDayOfWeek", () => {
    test("formats date to day abbreviation", () => {
      expect(formatDayOfWeek(new Date("2025-01-10"))).toBe("Fri");
      expect(formatDayOfWeek(new Date("2025-01-06"))).toBe("Mon");
      expect(formatDayOfWeek("2025-01-05")).toBe("Sun");
    });
  });

  describe("formatShortDate", () => {
    test("formats date to short display", () => {
      expect(formatShortDate(new Date("2025-01-10"))).toBe("Jan 10");
      expect(formatShortDate("2025-12-25")).toBe("Dec 25");
    });
  });

  describe("formatOrdinal", () => {
    test("formats numbers with correct suffixes", () => {
      expect(formatOrdinal(1)).toBe("1st");
      expect(formatOrdinal(2)).toBe("2nd");
      expect(formatOrdinal(3)).toBe("3rd");
      expect(formatOrdinal(4)).toBe("4th");
      expect(formatOrdinal(11)).toBe("11th");
      expect(formatOrdinal(12)).toBe("12th");
      expect(formatOrdinal(13)).toBe("13th");
      expect(formatOrdinal(21)).toBe("21st");
      expect(formatOrdinal(22)).toBe("22nd");
      expect(formatOrdinal(23)).toBe("23rd");
      expect(formatOrdinal(31)).toBe("31st");
    });
  });

  describe("getFrequencyLabel", () => {
    test("returns correct label for weekly", () => {
      expect(getFrequencyLabel("weekly", 5, null)).toBe("Weekly on Friday");
      expect(getFrequencyLabel("weekly", 0, null)).toBe("Weekly on Sunday");
    });

    test("returns correct label for monthly_date", () => {
      expect(getFrequencyLabel("monthly_date", 15, null)).toBe(
        "Monthly on the 15th",
      );
      expect(getFrequencyLabel("monthly_date", 1, null)).toBe(
        "Monthly on the 1st",
      );
      expect(getFrequencyLabel("monthly_date", 22, null)).toBe(
        "Monthly on the 22nd",
      );
    });

    test("returns correct label for monthly_weekday", () => {
      expect(getFrequencyLabel("monthly_weekday", 5, 2)).toBe(
        "Monthly on the 2nd Friday",
      );
      expect(getFrequencyLabel("monthly_weekday", 1, 1)).toBe(
        "Monthly on the 1st Monday",
      );
      expect(getFrequencyLabel("monthly_weekday", 4, 4)).toBe(
        "Monthly on the 4th Thursday",
      );
    });

    test("returns correct label for quarterly", () => {
      expect(getFrequencyLabel("quarterly", 15, null)).toBe(
        "Quarterly on the 15th",
      );
      expect(getFrequencyLabel("quarterly", 1, null)).toBe(
        "Quarterly on the 1st",
      );
    });

    test("returns correct label for semi_annual", () => {
      expect(getFrequencyLabel("semi_annual", 15, null)).toBe(
        "Semi-annually on the 15th",
      );
    });

    test("returns correct label for annual", () => {
      expect(getFrequencyLabel("annual", 15, null)).toBe(
        "Annually on the 15th",
      );
    });

    test("returns Custom for custom frequency", () => {
      expect(getFrequencyLabel("custom", null, null)).toBe("Custom");
    });
  });

  describe("getFrequencyShortLabel", () => {
    test("returns short labels", () => {
      expect(getFrequencyShortLabel("weekly")).toBe("Weekly");
      expect(getFrequencyShortLabel("monthly_date")).toBe("Monthly");
      expect(getFrequencyShortLabel("monthly_weekday")).toBe("Monthly");
      expect(getFrequencyShortLabel("quarterly")).toBe("Quarterly");
      expect(getFrequencyShortLabel("semi_annual")).toBe("Semi-annual");
      expect(getFrequencyShortLabel("annual")).toBe("Annual");
      expect(getFrequencyShortLabel("custom")).toBe("Custom");
    });
  });

  describe("formatRecurringProgress", () => {
    test("formats progress correctly", () => {
      expect(formatRecurringProgress(3, 12)).toBe("3 of 12");
      expect(formatRecurringProgress(1, null)).toBe("1");
      expect(formatRecurringProgress(null, 12)).toBe("");
    });
  });

  describe("formatNextScheduled", () => {
    test("returns appropriate message for status", () => {
      expect(formatNextScheduled(null, "completed")).toBe("Series complete");
      expect(formatNextScheduled(null, "paused")).toBe("Paused");
      expect(formatNextScheduled(null, "active")).toBe("");
      expect(formatNextScheduled(new Date("2025-02-01"), "active")).toBe(
        "Next on Feb 1",
      );
    });
  });
});

describe("validateRecurringConfig", () => {
  describe("weekly frequency", () => {
    test("requires frequencyDay", () => {
      const config: RecurringConfig = {
        frequency: "weekly",
        frequencyDay: null,
        frequencyWeek: null,
        frequencyInterval: null,
        endType: "never",
        endDate: null,
        endCount: null,
      };
      const errors = validateRecurringConfig(config);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.field === "frequencyDay")).toBe(true);
    });

    test("validates frequencyDay range (0-6)", () => {
      const config: RecurringConfig = {
        frequency: "weekly",
        frequencyDay: 7,
        frequencyWeek: null,
        frequencyInterval: null,
        endType: "never",
        endDate: null,
        endCount: null,
      };
      const errors = validateRecurringConfig(config);
      expect(errors.some((e) => e.field === "frequencyDay")).toBe(true);
    });

    test("passes with valid frequencyDay", () => {
      const config: RecurringConfig = {
        frequency: "weekly",
        frequencyDay: 5,
        frequencyWeek: null,
        frequencyInterval: null,
        endType: "never",
        endDate: null,
        endCount: null,
      };
      const errors = validateRecurringConfig(config);
      expect(errors.length).toBe(0);
    });
  });

  describe("monthly_date frequency", () => {
    test("requires frequencyDay", () => {
      const config: RecurringConfig = {
        frequency: "monthly_date",
        frequencyDay: null,
        frequencyWeek: null,
        frequencyInterval: null,
        endType: "never",
        endDate: null,
        endCount: null,
      };
      const errors = validateRecurringConfig(config);
      expect(errors.some((e) => e.field === "frequencyDay")).toBe(true);
    });

    test("validates frequencyDay range (1-31)", () => {
      const config: RecurringConfig = {
        frequency: "monthly_date",
        frequencyDay: 0,
        frequencyWeek: null,
        frequencyInterval: null,
        endType: "never",
        endDate: null,
        endCount: null,
      };
      const errors = validateRecurringConfig(config);
      expect(errors.some((e) => e.field === "frequencyDay")).toBe(true);
    });

    test("passes with valid frequencyDay", () => {
      const config: RecurringConfig = {
        frequency: "monthly_date",
        frequencyDay: 15,
        frequencyWeek: null,
        frequencyInterval: null,
        endType: "never",
        endDate: null,
        endCount: null,
      };
      const errors = validateRecurringConfig(config);
      expect(errors.length).toBe(0);
    });
  });

  describe("monthly_weekday frequency", () => {
    test("requires both frequencyDay and frequencyWeek", () => {
      const config: RecurringConfig = {
        frequency: "monthly_weekday",
        frequencyDay: null,
        frequencyWeek: null,
        frequencyInterval: null,
        endType: "never",
        endDate: null,
        endCount: null,
      };
      const errors = validateRecurringConfig(config);
      expect(errors.some((e) => e.field === "frequencyDay")).toBe(true);
      expect(errors.some((e) => e.field === "frequencyWeek")).toBe(true);
    });

    test("validates frequencyWeek range (1-5)", () => {
      const config: RecurringConfig = {
        frequency: "monthly_weekday",
        frequencyDay: 5,
        frequencyWeek: 6,
        frequencyInterval: null,
        endType: "never",
        endDate: null,
        endCount: null,
      };
      const errors = validateRecurringConfig(config);
      expect(errors.some((e) => e.field === "frequencyWeek")).toBe(true);
    });

    test("passes with valid frequencyDay and frequencyWeek", () => {
      const config: RecurringConfig = {
        frequency: "monthly_weekday",
        frequencyDay: 5,
        frequencyWeek: 2,
        frequencyInterval: null,
        endType: "never",
        endDate: null,
        endCount: null,
      };
      const errors = validateRecurringConfig(config);
      expect(errors.length).toBe(0);
    });
  });

  describe("quarterly frequency", () => {
    test("requires frequencyDay", () => {
      const config: RecurringConfig = {
        frequency: "quarterly",
        frequencyDay: null,
        frequencyWeek: null,
        frequencyInterval: null,
        endType: "never",
        endDate: null,
        endCount: null,
      };
      const errors = validateRecurringConfig(config);
      expect(errors.some((e) => e.field === "frequencyDay")).toBe(true);
    });

    test("passes with valid frequencyDay", () => {
      const config: RecurringConfig = {
        frequency: "quarterly",
        frequencyDay: 15,
        frequencyWeek: null,
        frequencyInterval: null,
        endType: "never",
        endDate: null,
        endCount: null,
      };
      const errors = validateRecurringConfig(config);
      expect(errors.length).toBe(0);
    });
  });

  describe("semi_annual frequency", () => {
    test("requires frequencyDay", () => {
      const config: RecurringConfig = {
        frequency: "semi_annual",
        frequencyDay: null,
        frequencyWeek: null,
        frequencyInterval: null,
        endType: "never",
        endDate: null,
        endCount: null,
      };
      const errors = validateRecurringConfig(config);
      expect(errors.some((e) => e.field === "frequencyDay")).toBe(true);
    });

    test("passes with valid frequencyDay", () => {
      const config: RecurringConfig = {
        frequency: "semi_annual",
        frequencyDay: 1,
        frequencyWeek: null,
        frequencyInterval: null,
        endType: "never",
        endDate: null,
        endCount: null,
      };
      const errors = validateRecurringConfig(config);
      expect(errors.length).toBe(0);
    });
  });

  describe("annual frequency", () => {
    test("requires frequencyDay", () => {
      const config: RecurringConfig = {
        frequency: "annual",
        frequencyDay: null,
        frequencyWeek: null,
        frequencyInterval: null,
        endType: "never",
        endDate: null,
        endCount: null,
      };
      const errors = validateRecurringConfig(config);
      expect(errors.some((e) => e.field === "frequencyDay")).toBe(true);
    });

    test("passes with valid frequencyDay", () => {
      const config: RecurringConfig = {
        frequency: "annual",
        frequencyDay: 31,
        frequencyWeek: null,
        frequencyInterval: null,
        endType: "never",
        endDate: null,
        endCount: null,
      };
      const errors = validateRecurringConfig(config);
      expect(errors.length).toBe(0);
    });
  });

  describe("custom frequency", () => {
    test("requires frequencyInterval", () => {
      const config: RecurringConfig = {
        frequency: "custom",
        frequencyDay: null,
        frequencyWeek: null,
        frequencyInterval: null,
        endType: "never",
        endDate: null,
        endCount: null,
      };
      const errors = validateRecurringConfig(config);
      expect(errors.some((e) => e.field === "frequencyInterval")).toBe(true);
    });

    test("passes with valid frequencyInterval", () => {
      const config: RecurringConfig = {
        frequency: "custom",
        frequencyDay: null,
        frequencyWeek: null,
        frequencyInterval: 14,
        endType: "never",
        endDate: null,
        endCount: null,
      };
      const errors = validateRecurringConfig(config);
      expect(errors.length).toBe(0);
    });
  });

  describe("end conditions", () => {
    test("requires endDate when endType is on_date", () => {
      const config: RecurringConfig = {
        frequency: "weekly",
        frequencyDay: 5,
        frequencyWeek: null,
        frequencyInterval: null,
        endType: "on_date",
        endDate: null,
        endCount: null,
      };
      const errors = validateRecurringConfig(config);
      expect(errors.some((e) => e.field === "endDate")).toBe(true);
    });

    test("requires endCount when endType is after_count", () => {
      const config: RecurringConfig = {
        frequency: "weekly",
        frequencyDay: 5,
        frequencyWeek: null,
        frequencyInterval: null,
        endType: "after_count",
        endDate: null,
        endCount: null,
      };
      const errors = validateRecurringConfig(config);
      expect(errors.some((e) => e.field === "endCount")).toBe(true);
    });
  });
});

describe("isValidRecurringConfig", () => {
  test("returns true for valid config", () => {
    const config: RecurringConfig = {
      frequency: "weekly",
      frequencyDay: 5,
      frequencyWeek: null,
      frequencyInterval: null,
      endType: "never",
      endDate: null,
      endCount: null,
    };
    expect(isValidRecurringConfig(config)).toBe(true);
  });

  test("returns false for invalid config", () => {
    const config: RecurringConfig = {
      frequency: "weekly",
      frequencyDay: null, // Missing required field
      frequencyWeek: null,
      frequencyInterval: null,
      endType: "never",
      endDate: null,
      endCount: null,
    };
    expect(isValidRecurringConfig(config)).toBe(false);
  });
});
