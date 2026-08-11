import { formatAmount, formatDate, getInitials } from "./format";

describe("format utilities (packages/utils)", () => {
  describe("formatAmount", () => {
    it("formats currency amounts correctly for en-US locale", () => {
      const result = formatAmount({ currency: "USD", amount: 1234.56 });
      expect(result).toContain("1,234.56");
    });

    it("returns undefined when currency is missing", () => {
      const result = formatAmount({ currency: "", amount: 100 });
      expect(result).toBeUndefined();
    });

    it("returns undefined when amount is NaN or invalid", () => {
      const result = formatAmount({ currency: "USD", amount: NaN });
      expect(result).toBeUndefined();
    });
  });

  describe("formatDate", () => {
    it("formats ISO date string with default locale format", () => {
      const formatted = formatDate("2026-08-11T00:00:00Z");
      expect(formatted).toBeTruthy();
    });

    it("formats ISO date string with custom format mask", () => {
      const formatted = formatDate("2026-08-11T00:00:00Z", "yyyy-MM-dd");
      expect(formatted).toBe("2026-08-11");
    });
  });

  describe("getInitials", () => {
    it("returns initials for full name", () => {
      expect(getInitials("Midday AI")).toBe("MA");
    });

    it("returns single initial for single word", () => {
      expect(getInitials("Midday")).toBe("MI");
    });
  });
});
