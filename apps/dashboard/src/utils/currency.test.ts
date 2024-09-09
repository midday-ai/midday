import { describe, expect, test } from "bun:test";
import { getMostFrequentCurrency } from "./currency";

describe("Get most frequent currency", () => {
  const accounts = [
    { currency: "USD" },
    { currency: "USD" },
    { currency: "EUR" },
  ];

  test("should return the most frequent currency", () => {
    expect(getMostFrequentCurrency(accounts)).toBe("USD");
  });

  test("should return the first currency if all are equally frequent", () => {
    expect(getMostFrequentCurrency(accounts)).toBe("USD");
  });

  test("should return the null if there are no accounts", () => {
    const accounts: { currency: string }[] = [];
    expect(getMostFrequentCurrency(accounts)).toBe(null);
  });
});
