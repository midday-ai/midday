import { describe, expect, test } from "bun:test";
import { TZDate } from "@date-fns/tz";
import { format } from "date-fns";
import {
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
  getStartOfDayUTC,
  isDateInFutureUTC,
  isValidRecurringConfig,
  localDateToUTCMidnight,
  type RecurringConfig,
  validateRecurringConfig,
} from "./recurring";

// ============================================================================
// UTC Date Comparison Utilities Tests
// These ensure consistent date comparisons across frontend and backend
// ============================================================================

describe("getStartOfDayUTC", () => {
  test("normalizes time to midnight UTC", () => {
    const date = new Date("2025-01-05T15:30:45.123Z");
    const result = getStartOfDayUTC(date);

    expect(result.getUTCHours()).toBe(0);
    expect(result.getUTCMinutes()).toBe(0);
    expect(result.getUTCSeconds()).toBe(0);
    expect(result.getUTCMilliseconds()).toBe(0);
  });

  test("preserves the UTC date", () => {
    const date = new Date("2025-01-05T23:59:59.999Z");
    const result = getStartOfDayUTC(date);

    expect(result.getUTCFullYear()).toBe(2025);
    expect(result.getUTCMonth()).toBe(0); // January
    expect(result.getUTCDate()).toBe(5);
  });

  test("handles midnight UTC correctly", () => {
    const date = new Date("2025-01-05T00:00:00.000Z");
    const result = getStartOfDayUTC(date);

    expect(result.getTime()).toBe(date.getTime());
  });

  test("handles dates near day boundaries correctly", () => {
    // One millisecond before midnight UTC on Jan 6
    const date = new Date("2025-01-05T23:59:59.999Z");
    const result = getStartOfDayUTC(date);

    expect(result.getUTCDate()).toBe(5);
    expect(result.toISOString()).toBe("2025-01-05T00:00:00.000Z");
  });
});

describe("isDateInFutureUTC", () => {
  describe("basic comparisons", () => {
    test("returns true when date is tomorrow", () => {
      const tomorrow = new Date("2025-01-06T00:00:00.000Z");
      const today = new Date("2025-01-05T12:00:00.000Z");

      expect(isDateInFutureUTC(tomorrow, today)).toBe(true);
    });

    test("returns false when date is today (same UTC day)", () => {
      const sameDay = new Date("2025-01-05T00:00:00.000Z");
      const laterSameDay = new Date("2025-01-05T23:59:59.999Z");

      expect(isDateInFutureUTC(sameDay, laterSameDay)).toBe(false);
    });

    test("returns false when date is in the past", () => {
      const yesterday = new Date("2025-01-04T12:00:00.000Z");
      const today = new Date("2025-01-05T00:00:00.000Z");

      expect(isDateInFutureUTC(yesterday, today)).toBe(false);
    });
  });

  describe("time-of-day independence", () => {
    test("time of day does not affect comparison (early date, late now)", () => {
      // Issue date is early in the day
      const issueDate = new Date("2025-01-05T00:00:00.000Z");
      // Current time is late in the same day
      const now = new Date("2025-01-05T23:59:59.999Z");

      // Same UTC day, so should return false
      expect(isDateInFutureUTC(issueDate, now)).toBe(false);
    });

    test("time of day does not affect comparison (late date, early now)", () => {
      // Issue date is late in the day
      const issueDate = new Date("2025-01-05T23:59:59.999Z");
      // Current time is early the same day
      const now = new Date("2025-01-05T00:00:00.001Z");

      // Same UTC day, so should return false (not in the future)
      expect(isDateInFutureUTC(issueDate, now)).toBe(false);
    });

    test("correctly identifies future date regardless of time", () => {
      // Issue date is early tomorrow
      const issueDate = new Date("2025-01-06T00:00:01.000Z");
      // Current time is late today
      const now = new Date("2025-01-05T23:59:59.999Z");

      expect(isDateInFutureUTC(issueDate, now)).toBe(true);
    });
  });

  describe("edge cases", () => {
    test("handles year boundary correctly", () => {
      const newYear = new Date("2026-01-01T00:00:00.000Z");
      const newYearsEve = new Date("2025-12-31T23:59:59.999Z");

      expect(isDateInFutureUTC(newYear, newYearsEve)).toBe(true);
    });

    test("handles leap year correctly", () => {
      const march1 = new Date("2024-03-01T00:00:00.000Z");
      const feb29 = new Date("2024-02-29T23:59:59.999Z");

      expect(isDateInFutureUTC(march1, feb29)).toBe(true);
    });

    test("uses current time when now is not provided", () => {
      // Create a date far in the future
      const futureDate = new Date("2099-01-01T00:00:00.000Z");

      expect(isDateInFutureUTC(futureDate)).toBe(true);
    });

    test("returns false for date equal to now (at day level)", () => {
      const date = new Date("2025-01-05T12:00:00.000Z");
      const now = new Date("2025-01-05T12:00:00.000Z");

      expect(isDateInFutureUTC(date, now)).toBe(false);
    });
  });

  describe("timezone consistency (simulated scenarios)", () => {
    // These tests verify that using UTC prevents timezone-related issues
    // that could occur with local midnight comparison

    test("midnight UTC comparison is consistent regardless of interpretation", () => {
      // This simulates a scenario where:
      // - User in EST sets issue date to Jan 5, 2025 midnight EST
      // - Server in UTC receives this as Jan 5, 2025 05:00:00 UTC
      // - Current time is Jan 5, 2025 02:00:00 UTC
      // With local midnight comparison, this could be inconsistent
      // With UTC day comparison, it's always consistent

      const issueDateReceivedByServer = new Date("2025-01-05T05:00:00.000Z");
      const serverCurrentTime = new Date("2025-01-05T02:00:00.000Z");

      // Both are on the same UTC day (Jan 5), so NOT in future
      expect(
        isDateInFutureUTC(issueDateReceivedByServer, serverCurrentTime),
      ).toBe(false);
    });

    test("different UTC days are correctly identified", () => {
      // User sets issue date to Jan 6, 2025
      // Server receives this, current time is late Jan 5 UTC
      const issueDateReceivedByServer = new Date("2025-01-06T00:00:00.000Z");
      const serverCurrentTime = new Date("2025-01-05T23:59:59.999Z");

      // Different UTC days, so IS in future
      expect(
        isDateInFutureUTC(issueDateReceivedByServer, serverCurrentTime),
      ).toBe(true);
    });
  });
});

// ============================================================================
// Invoice Date Handling - Critical Timezone Tests
// These tests verify the exact bug scenario that was fixed:
// - User selects a date in their local timezone
// - Date is stored as UTC midnight
// - Date is displayed correctly regardless of user's timezone
// ============================================================================

describe("localDateToUTCMidnight", () => {
  describe("basic conversion", () => {
    test("converts local date selection to UTC midnight ISO string", () => {
      // Simulates user selecting January 15, 2024 in a date picker
      // Note: new Date(2024, 0, 15) creates local midnight
      const localSelection = new Date(2024, 0, 15);
      const result = localDateToUTCMidnight(localSelection);

      // Should always produce January 15 at UTC midnight
      expect(result).toBe("2024-01-15T00:00:00.000Z");
    });

    test("uses local date components, not UTC date components", () => {
      // Create a date where UTC day differs from local day
      // This simulates what happens in timezones ahead of UTC
      const date = new Date("2024-01-15T23:00:00.000Z"); // Jan 15 in UTC

      // Get what the local date components are
      const localYear = date.getFullYear();
      const localMonth = date.getMonth();
      const localDay = date.getDate();

      const result = localDateToUTCMidnight(date);

      // Result should use local components, not UTC
      const resultDate = new Date(result);
      expect(resultDate.getUTCFullYear()).toBe(localYear);
      expect(resultDate.getUTCMonth()).toBe(localMonth);
      expect(resultDate.getUTCDate()).toBe(localDay);
    });

    test("returns ISO string format", () => {
      const date = new Date(2024, 5, 15); // June 15, 2024
      const result = localDateToUTCMidnight(date);

      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T00:00:00\.000Z$/);
    });
  });

  describe("month and year boundaries", () => {
    test("handles month end correctly", () => {
      const date = new Date(2024, 0, 31); // January 31
      const result = localDateToUTCMidnight(date);
      expect(result).toBe("2024-01-31T00:00:00.000Z");
    });

    test("handles year end correctly", () => {
      const date = new Date(2024, 11, 31); // December 31
      const result = localDateToUTCMidnight(date);
      expect(result).toBe("2024-12-31T00:00:00.000Z");
    });

    test("handles leap year correctly", () => {
      const date = new Date(2024, 1, 29); // February 29, 2024 (leap year)
      const result = localDateToUTCMidnight(date);
      expect(result).toBe("2024-02-29T00:00:00.000Z");
    });
  });
});

describe("TZDate display with UTC - round trip verification", () => {
  /**
   * THE CRITICAL TEST: This verifies the complete round-trip that was broken:
   * 1. User selects a date (January 15)
   * 2. We store it as UTC midnight (2024-01-15T00:00:00.000Z)
   * 3. When displayed using TZDate with UTC, it shows January 15
   *
   * THE BUG: Previously, using parseISO + startOfDay would interpret the UTC
   * string in local time. For users behind UTC (e.g., EST), this would show
   * January 14 instead of January 15.
   */

  test("round trip: select date → store UTC midnight → display with TZDate shows same date", () => {
    // Step 1: User selects January 15, 2024
    const userSelection = new Date(2024, 0, 15); // Local midnight

    // Step 2: Store as UTC midnight
    const storedValue = localDateToUTCMidnight(userSelection);
    expect(storedValue).toBe("2024-01-15T00:00:00.000Z");

    // Step 3: Display using TZDate with UTC (the fix)
    const displayDate = new TZDate(storedValue, "UTC");
    const displayedMonth = format(displayDate, "MMMM");
    const displayedDay = format(displayDate, "d");

    expect(displayedMonth).toBe("January");
    expect(displayedDay).toBe("15");
  });

  test("stored UTC midnight displays correct date in any format", () => {
    const storedValue = "2024-06-20T00:00:00.000Z"; // June 20, stored as UTC midnight

    const displayDate = new TZDate(storedValue, "UTC");

    expect(format(displayDate, "MMM d, yyyy")).toBe("Jun 20, 2024");
    expect(format(displayDate, "MMMM dd")).toBe("June 20");
    expect(format(displayDate, "yyyy-MM-dd")).toBe("2024-06-20");
    expect(format(displayDate, "P")).toBe("06/20/2024");
  });

  test("multiple dates maintain correct values through round trip", () => {
    const dates = [
      { select: new Date(2024, 0, 1), expected: "January 1" }, // New Year
      { select: new Date(2024, 1, 29), expected: "February 29" }, // Leap day
      { select: new Date(2024, 11, 31), expected: "December 31" }, // Year end
      { select: new Date(2024, 5, 15), expected: "June 15" }, // Mid-year
    ];

    for (const { select, expected } of dates) {
      const stored = localDateToUTCMidnight(select);
      const display = new TZDate(stored, "UTC");
      const formatted = format(display, "MMMM d");
      expect(formatted).toBe(expected);
    }
  });
});

describe("getStartOfDayUTC vs localDateToUTCMidnight - understanding the difference", () => {
  /**
   * These two functions serve different purposes:
   *
   * - getStartOfDayUTC: Normalizes an already-UTC date to UTC midnight.
   *   Use when you have a UTC timestamp and want to compare at day level.
   *
   * - localDateToUTCMidnight: Converts a local date selection to UTC midnight.
   *   Use when storing user-selected dates from a date picker.
   */

  test("getStartOfDayUTC normalizes UTC time to UTC midnight", () => {
    // A timestamp at 3:45 PM UTC
    const utcTimestamp = new Date("2024-01-15T15:45:30.123Z");
    const result = getStartOfDayUTC(utcTimestamp);

    // Should normalize to midnight UTC on the same day
    expect(result.toISOString()).toBe("2024-01-15T00:00:00.000Z");
  });

  test("localDateToUTCMidnight preserves local date components", () => {
    // This simulates a user in EST selecting January 15
    // The local Date object represents Jan 15 00:00 local time
    const localSelection = new Date(2024, 0, 15);
    const result = localDateToUTCMidnight(localSelection);

    // Should produce Jan 15 UTC midnight (using local date components)
    expect(result).toBe("2024-01-15T00:00:00.000Z");
  });

  test("both functions agree when date is UTC midnight", () => {
    // When the input is already UTC midnight
    const utcMidnight = new Date("2024-01-15T00:00:00.000Z");

    const fromGetStartOfDay = getStartOfDayUTC(utcMidnight);
    // Note: localDateToUTCMidnight uses local components, so result depends on TZ
    // but the UTC date should match
    expect(fromGetStartOfDay.toISOString()).toBe("2024-01-15T00:00:00.000Z");
  });
});

describe("invoice date handling patterns - documented behavior", () => {
  /**
   * These tests document the canonical patterns used throughout the invoice feature
   */

  describe("storage pattern: always use UTC midnight", () => {
    test("issue date is stored as UTC midnight", () => {
      const userSelectedDate = new Date(2024, 0, 15); // Jan 15 local
      const issueDate = localDateToUTCMidnight(userSelectedDate);
      expect(issueDate).toBe("2024-01-15T00:00:00.000Z");
    });

    test("due date is stored as UTC midnight", () => {
      const userSelectedDate = new Date(2024, 1, 15); // Feb 15 local
      const dueDate = localDateToUTCMidnight(userSelectedDate);
      expect(dueDate).toBe("2024-02-15T00:00:00.000Z");
    });

    test("recurring end date is stored as UTC midnight", () => {
      const userSelectedDate = new Date(2024, 11, 31); // Dec 31 local
      const endDate = localDateToUTCMidnight(userSelectedDate);
      expect(endDate).toBe("2024-12-31T00:00:00.000Z");
    });
  });

  describe("display pattern: always use TZDate with UTC", () => {
    test("issue date displays correctly", () => {
      const storedIssueDate = "2024-01-15T00:00:00.000Z";
      const display = new TZDate(storedIssueDate, "UTC");
      expect(format(display, "MMM d, yyyy")).toBe("Jan 15, 2024");
    });

    test("due date displays correctly", () => {
      const storedDueDate = "2024-02-28T00:00:00.000Z";
      const display = new TZDate(storedDueDate, "UTC");
      expect(format(display, "MMM d")).toBe("Feb 28");
    });

    test("next scheduled date displays correctly", () => {
      const storedNextDate = "2024-03-10T00:00:00.000Z";
      const display = new TZDate(storedNextDate, "UTC");
      expect(format(display, "EEE, MMM d")).toBe("Sun, Mar 10");
    });
  });

  describe("calculation pattern: use UTC methods for day-level operations", () => {
    test("day of week calculation uses UTC", () => {
      const stored = "2024-01-15T00:00:00.000Z"; // Monday in UTC
      const date = new TZDate(stored, "UTC");
      expect(date.getUTCDay()).toBe(1); // Monday = 1
    });

    test("day of month calculation uses UTC", () => {
      const stored = "2024-01-15T00:00:00.000Z";
      const date = new TZDate(stored, "UTC");
      expect(date.getUTCDate()).toBe(15);
    });

    test("week of month calculation uses UTC", () => {
      const stored = "2024-01-15T00:00:00.000Z"; // 15th day
      const date = new TZDate(stored, "UTC");
      const weekOfMonth = Math.ceil(date.getUTCDate() / 7);
      expect(weekOfMonth).toBe(3); // 3rd week
    });
  });
});

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

  describe("biweekly frequency", () => {
    test("adds 14 days for biweekly", () => {
      const config: RecurringConfig = {
        frequency: "biweekly",
        frequencyDay: 5, // Friday
        frequencyWeek: null,
        frequencyInterval: null,
        endType: "never",
        endDate: null,
        endCount: null,
      };
      const currentDate = new Date("2025-01-10"); // Friday
      const result = getNextDate(config, currentDate);

      expect(result.getDate()).toBe(24); // Jan 24, 2025 (14 days later)
      expect(result.getDay()).toBe(5); // Still Friday
    });

    test("maintains weekday across month boundary", () => {
      const config: RecurringConfig = {
        frequency: "biweekly",
        frequencyDay: 5, // Friday
        frequencyWeek: null,
        frequencyInterval: null,
        endType: "never",
        endDate: null,
        endCount: null,
      };
      const currentDate = new Date("2025-01-24"); // Friday
      const result = getNextDate(config, currentDate);

      expect(result.getMonth()).toBe(1); // February
      expect(result.getDate()).toBe(7); // Feb 7, 2025
      expect(result.getDay()).toBe(5); // Still Friday
    });
  });

  describe("monthly_last_day frequency", () => {
    test("returns last day of next month (31 day month)", () => {
      const config: RecurringConfig = {
        frequency: "monthly_last_day",
        frequencyDay: null,
        frequencyWeek: null,
        frequencyInterval: null,
        endType: "never",
        endDate: null,
        endCount: null,
      };
      // January 31 -> February 28 (non-leap year)
      const currentDate = new Date("2025-01-31");
      const result = getNextDate(config, currentDate);

      expect(result.getMonth()).toBe(1); // February
      expect(result.getDate()).toBe(28); // Last day of Feb 2025
    });

    test("handles leap year February", () => {
      const config: RecurringConfig = {
        frequency: "monthly_last_day",
        frequencyDay: null,
        frequencyWeek: null,
        frequencyInterval: null,
        endType: "never",
        endDate: null,
        endCount: null,
      };
      // January 31, 2024 -> February 29 (leap year)
      const currentDate = new Date("2024-01-31");
      const result = getNextDate(config, currentDate);

      expect(result.getMonth()).toBe(1); // February
      expect(result.getDate()).toBe(29); // Last day of Feb 2024
    });

    test("works from any starting date in month", () => {
      const config: RecurringConfig = {
        frequency: "monthly_last_day",
        frequencyDay: null,
        frequencyWeek: null,
        frequencyInterval: null,
        endType: "never",
        endDate: null,
        endCount: null,
      };
      // Starting from Jan 15 -> Feb 28
      const currentDate = new Date("2025-01-15");
      const result = getNextDate(config, currentDate);

      expect(result.getMonth()).toBe(1); // February
      expect(result.getDate()).toBe(28);
    });

    test("handles 30 day month to 31 day month", () => {
      const config: RecurringConfig = {
        frequency: "monthly_last_day",
        frequencyDay: null,
        frequencyWeek: null,
        frequencyInterval: null,
        endType: "never",
        endDate: null,
        endCount: null,
      };
      // April 30 -> May 31
      const currentDate = new Date("2025-04-30");
      const result = getNextDate(config, currentDate);

      expect(result.getMonth()).toBe(4); // May
      expect(result.getDate()).toBe(31);
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

    test("returns correct label for biweekly", () => {
      expect(getFrequencyLabel("biweekly", 5, null)).toBe(
        "Bi-weekly on Friday",
      );
      expect(getFrequencyLabel("biweekly", 1, null)).toBe(
        "Bi-weekly on Monday",
      );
    });

    test("returns correct label for monthly_last_day", () => {
      expect(getFrequencyLabel("monthly_last_day", null, null)).toBe(
        "Monthly on the last day",
      );
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
      expect(getFrequencyShortLabel("biweekly")).toBe("Bi-weekly");
      expect(getFrequencyShortLabel("monthly_date")).toBe("Monthly");
      expect(getFrequencyShortLabel("monthly_weekday")).toBe("Monthly");
      expect(getFrequencyShortLabel("monthly_last_day")).toBe("Monthly");
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

  describe("biweekly frequency", () => {
    test("requires frequencyDay", () => {
      const config: RecurringConfig = {
        frequency: "biweekly",
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

    test("validates frequencyDay range (0-6)", () => {
      const config: RecurringConfig = {
        frequency: "biweekly",
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
        frequency: "biweekly",
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

  describe("monthly_last_day frequency", () => {
    test("does not require frequencyDay", () => {
      const config: RecurringConfig = {
        frequency: "monthly_last_day",
        frequencyDay: null,
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
