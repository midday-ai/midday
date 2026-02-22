import { expect, test } from "bun:test";
import type { AccountBalance } from "./types";
import { getMaxHistoricalDays, selectPrimaryBalance } from "./utils";

test("getMaxHistoricalDays - returns 90 when separateContinuousHistoryConsent flag is true", () => {
  expect(
    getMaxHistoricalDays({
      institutionId: "SOME_BANK",
      transactionTotalDays: 720,
      separateContinuousHistoryConsent: true,
    }),
  ).toEqual(90);
});

test("getMaxHistoricalDays - returns 90 for hardcoded restricted institution", () => {
  expect(
    getMaxHistoricalDays({
      institutionId: "SWEDBANK_SWEDSESS",
      transactionTotalDays: 720,
    }),
  ).toEqual(90);
});

test("getMaxHistoricalDays - returns transactionTotalDays when flag is false and not restricted", () => {
  expect(
    getMaxHistoricalDays({
      institutionId: "NOT_RESTRICTED",
      transactionTotalDays: 720,
      separateContinuousHistoryConsent: false,
    }),
  ).toEqual(720);
});

test("getMaxHistoricalDays - returns transactionTotalDays when flag is undefined and not restricted", () => {
  expect(
    getMaxHistoricalDays({
      institutionId: "NOT_RESTRICTED",
      transactionTotalDays: 720,
    }),
  ).toEqual(720);
});

const mkBalance = (
  type: AccountBalance["balanceType"],
  amount: string,
  currency: string,
): AccountBalance => ({
  balanceType: type,
  balanceAmount: { amount, currency },
  creditLimitIncluded: false,
});

test("selectPrimaryBalance - single interimAvailable", () => {
  const result = selectPrimaryBalance([
    mkBalance("interimAvailable", "5000.00", "EUR"),
  ]);
  expect(result?.balanceAmount).toEqual({ amount: "5000.00", currency: "EUR" });
});

test("selectPrimaryBalance - prefers interimAvailable over expected", () => {
  const result = selectPrimaryBalance([
    mkBalance("expected", "9999.00", "EUR"),
    mkBalance("interimAvailable", "5000.00", "EUR"),
  ]);
  expect(result?.balanceAmount).toEqual({ amount: "5000.00", currency: "EUR" });
});

test("selectPrimaryBalance - prefers closingBooked over expected", () => {
  const result = selectPrimaryBalance([
    mkBalance("closingBooked", "1000.00", "EUR"),
    mkBalance("expected", "2000.00", "EUR"),
  ]);
  expect(result?.balanceAmount).toEqual({ amount: "1000.00", currency: "EUR" });
});

test("selectPrimaryBalance - prefers interimBooked over closingBooked", () => {
  const result = selectPrimaryBalance([
    mkBalance("closingBooked", "9000.00", "EUR"),
    mkBalance("interimBooked", "5000.00", "EUR"),
  ]);
  expect(result?.balanceAmount).toEqual({ amount: "5000.00", currency: "EUR" });
});

test("selectPrimaryBalance - prefers closingBooked over interimAvailable", () => {
  const result = selectPrimaryBalance([
    mkBalance("interimAvailable", "8000.00", "EUR"),
    mkBalance("closingBooked", "7500.00", "EUR"),
  ]);
  expect(result?.balanceAmount).toEqual({ amount: "7500.00", currency: "EUR" });
});

test("selectPrimaryBalance - multi-currency picks highest amount among preferred types", () => {
  const result = selectPrimaryBalance([
    mkBalance("interimAvailable", "9.76", "DKK"),
    mkBalance("interimBooked", "9.76", "DKK"),
    mkBalance("interimAvailable", "9242.93", "EUR"),
    mkBalance("interimBooked", "9436.86", "EUR"),
  ]);
  expect(result?.balanceAmount).toEqual({ amount: "9436.86", currency: "EUR" });
});

test("selectPrimaryBalance - multi-currency with only interimAvailable", () => {
  const result = selectPrimaryBalance([
    mkBalance("interimAvailable", "50.00", "DKK"),
    mkBalance("interimAvailable", "8000.00", "EUR"),
  ]);
  expect(result?.balanceAmount).toEqual({ amount: "8000.00", currency: "EUR" });
});

test("selectPrimaryBalance - uses absolute value for negative balances (credit)", () => {
  const result = selectPrimaryBalance([
    mkBalance("interimAvailable", "100.00", "DKK"),
    mkBalance("interimBooked", "-5000.00", "EUR"),
  ]);
  expect(result?.balanceAmount).toEqual({
    amount: "-5000.00",
    currency: "EUR",
  });
});

test("selectPrimaryBalance - preferredCurrency narrows to matching currency", () => {
  const result = selectPrimaryBalance(
    [
      mkBalance("interimBooked", "9000.00", "DKK"),
      mkBalance("interimBooked", "5000.00", "EUR"),
    ],
    "EUR",
  );
  expect(result?.balanceAmount).toEqual({ amount: "5000.00", currency: "EUR" });
});

test("selectPrimaryBalance - preferredCurrency falls back to all when no match", () => {
  const result = selectPrimaryBalance(
    [
      mkBalance("interimBooked", "9000.00", "DKK"),
      mkBalance("interimAvailable", "5000.00", "DKK"),
    ],
    "EUR",
  );
  expect(result?.balanceAmount).toEqual({ amount: "9000.00", currency: "DKK" });
});

test("selectPrimaryBalance - preferredCurrency ignores XXX hint", () => {
  const result = selectPrimaryBalance(
    [
      mkBalance("interimBooked", "100.00", "DKK"),
      mkBalance("interimBooked", "9000.00", "EUR"),
    ],
    "XXX",
  );
  expect(result?.balanceAmount).toEqual({ amount: "9000.00", currency: "EUR" });
});

test("selectPrimaryBalance - empty array returns undefined", () => {
  expect(selectPrimaryBalance([])).toBeUndefined();
});

test("selectPrimaryBalance - undefined returns undefined", () => {
  expect(selectPrimaryBalance(undefined)).toBeUndefined();
});
