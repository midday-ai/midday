import { describe, expect, test } from "bun:test";
import { formatAmount } from "@midday/utils/format";

describe("formatAmount", () => {
  test("formats USD with default locale", () => {
    const result = formatAmount({ currency: "USD", amount: 1234.56 });
    expect(result).toBe("$1,234.56");
  });

  test("formats EUR with German locale", () => {
    const result = formatAmount({
      currency: "EUR",
      amount: 1234.56,
      locale: "de-DE",
    });
    expect(result).toContain("1.234,56");
    expect(result).toContain("€");
  });

  test("formats SEK with Swedish locale", () => {
    const result = formatAmount({
      currency: "SEK",
      amount: 1234.56,
      locale: "sv-SE",
    });
    expect(result).toBeDefined();
    expect(result).toContain("1");
  });

  test("respects minimumFractionDigits", () => {
    const result = formatAmount({
      currency: "USD",
      amount: 100,
      minimumFractionDigits: 2,
    });
    expect(result).toBe("$100.00");
  });

  test("respects maximumFractionDigits", () => {
    const result = formatAmount({
      currency: "USD",
      amount: 99.999,
      maximumFractionDigits: 0,
    });
    expect(result).toBe("$100");
  });

  test("returns undefined when currency is empty string", () => {
    const result = formatAmount({ currency: "", amount: 100 });
    expect(result).toBeUndefined();
  });

  test("formats zero amount", () => {
    const result = formatAmount({ currency: "USD", amount: 0 });
    expect(result).toBe("$0.00");
  });

  test("formats negative amount", () => {
    const result = formatAmount({ currency: "USD", amount: -500 });
    expect(result).toContain("500");
  });
});
