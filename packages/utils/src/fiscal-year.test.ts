import {
  getDefaultFiscalYearStartMonth,
  getFiscalYearDates,
  getFiscalYearLabel,
} from "./fiscal-year";

describe("fiscal-year utility (packages/utils)", () => {
  describe("getDefaultFiscalYearStartMonth", () => {
    it("returns April (4) for UK (GB) and India (IN)", () => {
      expect(getDefaultFiscalYearStartMonth("GB")).toBe(4);
      expect(getDefaultFiscalYearStartMonth("IN")).toBe(4);
    });

    it("returns July (7) for Australia (AU)", () => {
      expect(getDefaultFiscalYearStartMonth("AU")).toBe(7);
    });

    it("defaults to January (1) for unknown or null country code", () => {
      expect(getDefaultFiscalYearStartMonth(null)).toBe(1);
      expect(getDefaultFiscalYearStartMonth("XX")).toBe(1);
    });
  });

  describe("getFiscalYearLabel", () => {
    it("returns formatted month name", () => {
      expect(getFiscalYearLabel(1)).toBe("January");
      expect(getFiscalYearLabel(4)).toBe("April");
    });

    it("returns Trailing 12 months when month is null", () => {
      expect(getFiscalYearLabel(null)).toBe("Trailing 12 months");
    });
  });

  describe("getFiscalYearDates", () => {
    it("calculates fiscal year date range correctly for April start month", () => {
      const refDate = new Date("2026-08-11T00:00:00Z");
      const { from, to } = getFiscalYearDates(4, refDate);

      expect(from.getMonth()).toBe(3); // April (0-indexed)
      expect(from.getFullYear()).toBe(2026);
    });
  });
});
