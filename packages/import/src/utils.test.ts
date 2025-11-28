import { describe, expect, it } from "bun:test";
import { formatAmountValue, formatDate } from "./utils";

describe("formatAmountValue", () => {
  it("should handle numbers with comma as decimal separator", () => {
    expect(formatAmountValue({ amount: "1.234,56" })).toBe(1234.56);
  });

  it("should handle numbers with period as thousands separator", () => {
    expect(formatAmountValue({ amount: "1.234.56" })).toBe(1234.56);
  });

  it("should handle numbers with period as decimal separator", () => {
    expect(formatAmountValue({ amount: "1234.56" })).toBe(1234.56);
  });

  it("should handle plain numbers", () => {
    expect(formatAmountValue({ amount: "1234" })).toBe(1234);
  });

  it("should invert the amount when inverted is true", () => {
    expect(formatAmountValue({ amount: "1234.56", inverted: true })).toBe(
      -1234.56,
    );
  });

  it("should handle negative numbers", () => {
    expect(formatAmountValue({ amount: "-1234.56" })).toBe(-1234.56);
  });

  it("should invert negative numbers when inverted is true", () => {
    expect(formatAmountValue({ amount: "-1234.56", inverted: true })).toBe(
      1234.56,
    );
  });

  it("should handle zero", () => {
    expect(formatAmountValue({ amount: "0" })).toBe(0);
    expect(formatAmountValue({ amount: "0", inverted: true })).toBe(-0);
  });
});

describe("formatDate", () => {
  it("should format a valid date string", () => {
    expect(formatDate("2023-05-15")).toBe("2023-05-15");
  });

  it("should handle date strings with non-date characters", () => {
    expect(formatDate("2023/05/15")).toBe("2023-05-15");
    expect(formatDate("May 15, 2023")).toBe("2023-05-15");
  });

  it("should return undefined for invalid date strings", () => {
    expect(formatDate("invalid-date")).toBeUndefined();
    expect(formatDate("2023-13-45")).toBeUndefined();
  });

  it("should reject invalid days for month (Feb 30, Apr 31)", () => {
    expect(formatDate("2023-02-30")).toBeUndefined();
    expect(formatDate("2023-04-31")).toBeUndefined();
    expect(formatDate("2023-06-31")).toBeUndefined();
    expect(formatDate("2023-09-31")).toBeUndefined();
    expect(formatDate("2023-11-31")).toBeUndefined();
  });

  it("should handle leap year dates correctly", () => {
    // 2024 is a leap year - Feb 29 is valid
    expect(formatDate("2024-02-29")).toBe("2024-02-29");
    // 2023 is not a leap year - Feb 29 is invalid
    expect(formatDate("2023-02-29")).toBeUndefined();
    // 2000 is a leap year (divisible by 400)
    expect(formatDate("2000-02-29")).toBe("2000-02-29");
    // 1900 was not a leap year (divisible by 100 but not 400)
    expect(formatDate("1900-02-29")).toBeUndefined();
  });

  it("should accept valid edge-of-month dates", () => {
    expect(formatDate("2023-01-31")).toBe("2023-01-31");
    expect(formatDate("2023-03-31")).toBe("2023-03-31");
    expect(formatDate("2023-04-30")).toBe("2023-04-30");
    expect(formatDate("2023-02-28")).toBe("2023-02-28");
  });

  it("should handle different date formats", () => {
    expect(formatDate("05/15/2023")).toBe("2023-05-15");
  });

  it("should handle dates with time", () => {
    expect(formatDate("2023-05-15T14:30:00")).toBe("2023-05-15");
  });

  it("should handle dates dot separated", () => {
    // chrono-node interprets as MM.DD.YYYY (US format)
    expect(formatDate("04.09.2024")).toBe("2024-04-09");
  });

  it("should handle dates with time (dot format)", () => {
    // chrono-node interprets as MM.DD.YYYY (US format)
    expect(formatDate("08.05.2024 09:12:07")).toBe("2024-08-05");
  });

  it("should handle dates 07/Aug/2024", () => {
    expect(formatDate("07/Aug/2024")).toBe("2024-08-07");
  });

  it("should handle dates 24-08-2024", () => {
    expect(formatDate("24-08-2024")).toBe("2024-08-24");
  });

  it("should handle dates in dd-MM-yyyy format", () => {
    expect(formatDate("24-09-2024")).toBe("2024-09-24");
  });

  it("should handle short date format", () => {
    // chrono-node interprets as MM/DD/YY (US format)
    expect(formatDate("11/4/24")).toBe("2024-11-04");
  });

  // Timezone suffix formats (e.g., from Shopify exports)
  it("should handle dates with UTC timezone suffix", () => {
    expect(formatDate("2025-10-01 00:00:00 UTC")).toBe("2025-10-01");
  });

  it("should handle dates with GMT timezone suffix", () => {
    expect(formatDate("2025-10-01 00:00:00 GMT")).toBe("2025-10-01");
  });

  it("should handle ISO dates with Z suffix", () => {
    expect(formatDate("2025-10-01T00:00:00Z")).toBe("2025-10-01");
  });

  it("should handle ISO dates with timezone offset", () => {
    expect(formatDate("2025-10-01T00:00:00+00:00")).toBe("2025-10-01");
  });

  it("should handle timezone offset without colon (+0000 format)", () => {
    expect(formatDate("2025-10-01T00:00:00+0000")).toBe("2025-10-01");
    expect(formatDate("2025-10-01T05:30:00+0530")).toBe("2025-10-01");
  });

  it("should handle negative timezone offsets", () => {
    expect(formatDate("2025-10-01T00:00:00-05:00")).toBe("2025-10-01");
    expect(formatDate("2025-10-01T00:00:00-0800")).toBe("2025-10-01");
  });

  it("should preserve date in source timezone (not shift to UTC)", () => {
    // Late-night dates with negative offsets would shift to next day if converted to UTC
    // e.g., 2025-10-01T23:00:00-05:00 is 2025-10-02T04:00:00Z in UTC
    // We should preserve the original date (2025-10-01), not the UTC date (2025-10-02)
    expect(formatDate("2025-10-01T23:00:00-05:00")).toBe("2025-10-01");
    expect(formatDate("2025-10-01T20:00:00-08:00")).toBe("2025-10-01");
    expect(formatDate("2025-10-01T22:00:00-03:00")).toBe("2025-10-01");
  });

  it("should handle space before timezone offset", () => {
    expect(formatDate("2025-10-01 00:00:00+00:00")).toBe("2025-10-01");
    expect(formatDate("2025-10-01 12:00:00-05:00")).toBe("2025-10-01");
  });

  it("should handle Shopify-style date with time and UTC", () => {
    expect(formatDate("2025-09-30 18:03:25 UTC")).toBe("2025-09-30");
  });

  // Natural language dates (chrono-node)
  it("should handle natural language dates", () => {
    expect(formatDate("October 1, 2025")).toBe("2025-10-01");
  });

  it("should handle abbreviated month dates", () => {
    expect(formatDate("Oct 1, 2025")).toBe("2025-10-01");
  });

  // Edge cases
  it("should handle empty strings", () => {
    expect(formatDate("")).toBeUndefined();
  });

  it("should handle whitespace-only strings", () => {
    expect(formatDate("   ")).toBeUndefined();
  });

  it("should handle strings with leading/trailing whitespace", () => {
    expect(formatDate("  2025-10-01  ")).toBe("2025-10-01");
  });
});
