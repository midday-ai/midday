import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  setSystemTime,
} from "bun:test";
import { TZDate } from "@date-fns/tz";
import {
  calculateAvgBurnRate,
  formatAccountName,
  formatAmount,
  formatDate,
  formatDateRange,
  formatRelativeTime,
  formatSize,
  getDueDateStatus,
  getInitials,
  secondsToHoursAndMinutes,
} from "./format";

describe("formatSize", () => {
  it("should format bytes correctly", () => {
    expect(formatSize(0)).toBe("0 byte");
    expect(formatSize(1)).toBe("1 byte");
    expect(formatSize(1024)).toBe("1 kB");
    expect(formatSize(1536)).toBe("2 kB"); // 1.5 KB rounded up
    expect(formatSize(1048576)).toBe("1 MB");
    expect(formatSize(1073741824)).toBe("1 GB");
    expect(formatSize(1099511627776)).toBe("1 TB");
  });

  it("should handle large numbers", () => {
    expect(formatSize(1125899906842624)).toBe("1,024 TB");
  });
});

describe("formatAmount", () => {
  it("should format currency amounts correctly", () => {
    expect(formatAmount({ currency: "USD", amount: 1234.56 })).toBe(
      "$1,234.56",
    );
    expect(formatAmount({ currency: "EUR", amount: 1234.56 })).toBe(
      "€1,234.56",
    );
    expect(formatAmount({ currency: "GBP", amount: 1234.56 })).toBe(
      "£1,234.56",
    );
  });

  it("should handle different locales", () => {
    expect(
      formatAmount({ currency: "USD", amount: 1234.56, locale: "en-US" }),
    ).toBe("$1,234.56");
    // Note: German locale uses non-breaking space between amount and currency
    const germanResult = formatAmount({
      currency: "EUR",
      amount: 1234.56,
      locale: "de-DE",
    });
    expect(germanResult).toContain("1.234,56");
    expect(germanResult).toContain("€");
  });

  it("should handle null locale", () => {
    expect(
      formatAmount({ currency: "USD", amount: 1234.56, locale: null }),
    ).toBe("$1,234.56");
  });

  it("should handle fraction digits", () => {
    expect(
      formatAmount({
        currency: "USD",
        amount: 1234.567,
        maximumFractionDigits: 2,
      }),
    ).toBe("$1,234.57");

    expect(
      formatAmount({
        currency: "USD",
        amount: 1234,
        minimumFractionDigits: 2,
      }),
    ).toBe("$1,234.00");
  });

  it("should return undefined for missing currency", () => {
    expect(formatAmount({ currency: "", amount: 1234.56 })).toBeUndefined();
  });

  it("should handle zero amounts", () => {
    expect(formatAmount({ currency: "USD", amount: 0 })).toBe("$0.00");
  });

  it("should handle negative amounts", () => {
    expect(formatAmount({ currency: "USD", amount: -1234.56 })).toBe(
      "-$1,234.56",
    );
  });
});

describe("secondsToHoursAndMinutes", () => {
  it("should convert seconds to hours and minutes", () => {
    expect(secondsToHoursAndMinutes(3661)).toBe("1:01h"); // 1 hour 1 minute
    expect(secondsToHoursAndMinutes(3600)).toBe("1h"); // 1 hour exactly
    expect(secondsToHoursAndMinutes(60)).toBe("1m"); // 1 minute exactly
    expect(secondsToHoursAndMinutes(0)).toBe("0h"); // 0 seconds
    expect(secondsToHoursAndMinutes(59)).toBe("0h"); // Less than 1 minute
    expect(secondsToHoursAndMinutes(7200)).toBe("2h"); // 2 hours exactly
    expect(secondsToHoursAndMinutes(7260)).toBe("2:01h"); // 2 hours 1 minute
  });

  it("should handle large numbers", () => {
    expect(secondsToHoursAndMinutes(36000)).toBe("10h"); // 10 hours
    expect(secondsToHoursAndMinutes(36060)).toBe("10:01h"); // 10 hours 1 minute
  });
});

describe("calculateAvgBurnRate", () => {
  it("should calculate average burn rate correctly", () => {
    const data = [
      { value: 100, date: "2023-01-01" },
      { value: 200, date: "2023-01-02" },
      { value: 300, date: "2023-01-03" },
    ];
    expect(calculateAvgBurnRate(data)).toBe(200);
  });

  it("should handle single data point", () => {
    const data = [{ value: 150, date: "2023-01-01" }];
    expect(calculateAvgBurnRate(data)).toBe(150);
  });

  it("should handle null data", () => {
    expect(calculateAvgBurnRate(null)).toBe(0);
  });

  it("should handle empty array", () => {
    expect(calculateAvgBurnRate([])).toBe(Number.NaN);
  });

  it("should handle zero values", () => {
    const data = [
      { value: 0, date: "2023-01-01" },
      { value: 0, date: "2023-01-02" },
    ];
    expect(calculateAvgBurnRate(data)).toBe(0);
  });

  it("should handle negative values", () => {
    const data = [
      { value: -100, date: "2023-01-01" },
      { value: 100, date: "2023-01-02" },
    ];
    expect(calculateAvgBurnRate(data)).toBe(0);
  });
});

describe("formatDate", () => {
  it("should format dates for same year", () => {
    const currentYear = new Date().getFullYear();
    const date = `${currentYear}-06-15`;
    expect(formatDate(date)).toBe("Jun 15");
  });

  it("should format dates for different year", () => {
    const date = "2020-06-15";
    expect(formatDate(date)).toBe("06/15/2020");
  });

  it("should respect custom date format", () => {
    const date = "2023-06-15";
    expect(formatDate(date, "yyyy-MM-dd")).toBe("2023-06-15");
  });

  it("should skip year check when checkYear is false", () => {
    const currentYear = new Date().getFullYear();
    const date = `${currentYear}-06-15`;
    expect(formatDate(date, null, false)).toBe(`06/15/${currentYear}`);
  });

  it("should handle null date format", () => {
    const date = "2020-06-15";
    expect(formatDate(date, null)).toBe("06/15/2020");
  });
});

describe("getInitials", () => {
  it("should get initials from full names", () => {
    expect(getInitials("John Doe")).toBe("JO");
    expect(getInitials("Jane Smith")).toBe("JA");
  });

  it("should handle single names", () => {
    expect(getInitials("John")).toBe("JO");
    expect(getInitials("A")).toBe("A");
  });

  it("should handle names with special characters", () => {
    expect(getInitials("John-Doe")).toBe("JO");
    expect(getInitials("Jane.Smith")).toBe("JA");
    expect(getInitials("Mary O'Connor")).toBe("MA");
  });

  it("should handle names with spaces", () => {
    expect(getInitials("John   Doe")).toBe("JO");
  });

  it("should handle empty string", () => {
    expect(getInitials("")).toBe("");
  });

  it("should handle lowercase names", () => {
    expect(getInitials("john doe")).toBe("JO");
  });

  it("should handle names with hyphens and dots", () => {
    expect(getInitials("Jean-Claude Van Damme")).toBe("JE");
    expect(getInitials("Dr. Smith")).toBe("DR");
  });
});

describe("formatAccountName", () => {
  it("should format account name with currency", () => {
    expect(formatAccountName({ name: "Checking", currency: "USD" })).toBe(
      "Checking (USD)",
    );
    expect(formatAccountName({ name: "Savings", currency: "EUR" })).toBe(
      "Savings (EUR)",
    );
  });

  it("should handle account name without currency", () => {
    expect(formatAccountName({ name: "Checking" })).toBe("Checking");
    expect(formatAccountName({ name: "Savings", currency: null })).toBe(
      "Savings",
    );
  });

  it("should handle missing name", () => {
    expect(formatAccountName({})).toBe("");
    expect(formatAccountName({ currency: "USD" })).toBe(" (USD)");
  });

  it("should handle undefined name", () => {
    expect(formatAccountName({ name: undefined, currency: "USD" })).toBe(
      " (USD)",
    );
  });
});

describe("formatDateRange", () => {
  it("should format single date", () => {
    const date = new TZDate(2023, 5, 15, "UTC"); // June 15, 2023
    expect(formatDateRange([date])).toBe("Jun 15");
  });

  it("should format date range in same month", () => {
    const startDate = new TZDate(2023, 5, 15, "UTC"); // June 15, 2023
    const endDate = new TZDate(2023, 5, 20, "UTC"); // June 20, 2023
    expect(formatDateRange([startDate, endDate])).toBe("Jun 15 - 20");
  });

  it("should format date range in different months", () => {
    const startDate = new TZDate(2023, 5, 15, "UTC"); // June 15, 2023
    const endDate = new TZDate(2023, 6, 5, "UTC"); // July 5, 2023
    expect(formatDateRange([startDate, endDate])).toBe("Jun 15 - Jul 5");
  });

  it("should handle empty array", () => {
    expect(formatDateRange([])).toBe("");
  });

  it("should handle same dates", () => {
    const date = new TZDate(2023, 5, 15, "UTC");
    expect(formatDateRange([date, date])).toBe("Jun 15");
  });

  it("should handle undefined end date", () => {
    const startDate = new TZDate(2023, 5, 15, "UTC");
    expect(formatDateRange([startDate, undefined as any])).toBe("Jun 15");
  });
});

describe("getDueDateStatus", () => {
  beforeEach(() => {
    // Mock current date to 2023-06-15
    setSystemTime(new Date("2023-06-15T12:00:00Z"));
  });

  afterEach(() => {
    // Reset to real time
    setSystemTime();
  });

  it("should return 'Today' for today's date", () => {
    expect(getDueDateStatus("2023-06-15")).toBe("Today");
  });

  it("should return 'Tomorrow' for tomorrow's date", () => {
    expect(getDueDateStatus("2023-06-16")).toBe("Tomorrow");
  });

  it("should return 'Yesterday' for yesterday's date", () => {
    expect(getDueDateStatus("2023-06-14")).toBe("Yesterday");
  });

  it("should return future days correctly", () => {
    expect(getDueDateStatus("2023-06-20")).toBe("in 5 days");
    expect(getDueDateStatus("2023-06-17")).toBe("in 2 days");
  });

  it("should return past days correctly", () => {
    expect(getDueDateStatus("2023-06-10")).toBe("5 days ago");
    expect(getDueDateStatus("2023-06-13")).toBe("2 days ago");
  });

  it("should return future months correctly", () => {
    expect(getDueDateStatus("2023-08-15")).toBe("in 2 months");
    expect(getDueDateStatus("2023-07-15")).toBe("in 1 month");
  });

  it("should return past months correctly", () => {
    expect(getDueDateStatus("2023-04-15")).toBe("61 days ago");
    expect(getDueDateStatus("2023-05-15")).toBe("31 days ago");
  });
});

describe("formatRelativeTime", () => {
  beforeEach(() => {
    // Mock current date to 2023-06-15T12:00:00Z
    setSystemTime(new Date("2023-06-15T12:00:00Z"));
  });

  afterEach(() => {
    // Reset to real time
    setSystemTime();
  });

  it("should return 'just now' for recent times", () => {
    const now = new Date("2023-06-15T12:00:00Z");
    const recent = new Date("2023-06-15T11:59:30Z"); // 30 seconds ago
    expect(formatRelativeTime(recent)).toBe("just now");
  });

  it("should return minutes ago", () => {
    const fiveMinutesAgo = new Date("2023-06-15T11:55:00Z");
    expect(formatRelativeTime(fiveMinutesAgo)).toBe("5m ago");
  });

  it("should return hours ago", () => {
    const twoHoursAgo = new Date("2023-06-15T10:00:00Z");
    expect(formatRelativeTime(twoHoursAgo)).toBe("2h ago");
  });

  it("should return days ago", () => {
    const threeDaysAgo = new Date("2023-06-12T12:00:00Z");
    expect(formatRelativeTime(threeDaysAgo)).toBe("3d ago");
  });

  it("should return months ago", () => {
    const twoMonthsAgo = new Date("2023-04-15T12:00:00Z");
    expect(formatRelativeTime(twoMonthsAgo)).toBe("2mo ago");
  });

  it("should return years ago", () => {
    const twoYearsAgo = new Date("2021-06-15T12:00:00Z");
    expect(formatRelativeTime(twoYearsAgo)).toBe("2y ago");
  });

  it("should handle edge cases", () => {
    const oneMinuteAgo = new Date("2023-06-15T11:59:00Z");
    expect(formatRelativeTime(oneMinuteAgo)).toBe("1m ago");

    const oneHourAgo = new Date("2023-06-15T11:00:00Z");
    expect(formatRelativeTime(oneHourAgo)).toBe("1h ago");
  });
});
