import { expect, test } from "bun:test";
import type { AccountBalance } from "./types";
import {
  getAccessValidForDays,
  getMaxHistoricalDays,
  selectPrimaryBalance,
} from "./utils";

test("Should return 90 days", () => {
  expect(
    getMaxHistoricalDays({
      institutionId: "SWEDBANK_SWEDSESS",
      transactionTotalDays: 720,
    }),
  ).toEqual(90);
});

test("Should return 720 days", () => {
  expect(
    getMaxHistoricalDays({
      institutionId: "NOT_RESTRICTED",
      transactionTotalDays: 720,
    }),
  ).toEqual(720);
});

test("Should return 90 days", () => {
  expect(
    getAccessValidForDays({
      institutionId: "CUMBERLAND_CMBSGB2A",
    }),
  ).toEqual(90);
});

test("Should return 720 days", () => {
  expect(
    getAccessValidForDays({
      institutionId: "NOT_RESTRICTED",
    }),
  ).toEqual(180);
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
  expect(result).toEqual({ amount: "5000.00", currency: "EUR" });
});

test("selectPrimaryBalance - prefers interimAvailable over expected", () => {
  const result = selectPrimaryBalance([
    mkBalance("expected", "9999.00", "EUR"),
    mkBalance("interimAvailable", "5000.00", "EUR"),
  ]);
  expect(result).toEqual({ amount: "5000.00", currency: "EUR" });
});

test("selectPrimaryBalance - prefers closingBooked over expected", () => {
  const result = selectPrimaryBalance([
    mkBalance("closingBooked", "1000.00", "EUR"),
    mkBalance("expected", "2000.00", "EUR"),
  ]);
  expect(result).toEqual({ amount: "1000.00", currency: "EUR" });
});

test("selectPrimaryBalance - prefers interimBooked over closingBooked", () => {
  const result = selectPrimaryBalance([
    mkBalance("closingBooked", "9000.00", "EUR"),
    mkBalance("interimBooked", "5000.00", "EUR"),
  ]);
  expect(result).toEqual({ amount: "5000.00", currency: "EUR" });
});

test("selectPrimaryBalance - prefers closingBooked over interimAvailable", () => {
  const result = selectPrimaryBalance([
    mkBalance("interimAvailable", "8000.00", "EUR"),
    mkBalance("closingBooked", "7500.00", "EUR"),
  ]);
  expect(result).toEqual({ amount: "7500.00", currency: "EUR" });
});

test("selectPrimaryBalance - multi-currency picks highest amount among preferred types", () => {
  const result = selectPrimaryBalance([
    mkBalance("interimAvailable", "9.76", "DKK"),
    mkBalance("interimBooked", "9.76", "DKK"),
    mkBalance("interimAvailable", "9242.93", "EUR"),
    mkBalance("interimBooked", "9436.86", "EUR"),
  ]);
  expect(result).toEqual({ amount: "9436.86", currency: "EUR" });
});

test("selectPrimaryBalance - multi-currency with only interimAvailable", () => {
  const result = selectPrimaryBalance([
    mkBalance("interimAvailable", "50.00", "DKK"),
    mkBalance("interimAvailable", "8000.00", "EUR"),
  ]);
  expect(result).toEqual({ amount: "8000.00", currency: "EUR" });
});

test("selectPrimaryBalance - uses absolute value for negative balances (credit)", () => {
  const result = selectPrimaryBalance([
    mkBalance("interimAvailable", "100.00", "DKK"),
    mkBalance("interimBooked", "-5000.00", "EUR"),
  ]);
  expect(result).toEqual({ amount: "-5000.00", currency: "EUR" });
});

test("selectPrimaryBalance - empty array returns undefined", () => {
  expect(selectPrimaryBalance([])).toBeUndefined();
});

test("selectPrimaryBalance - undefined returns undefined", () => {
  expect(selectPrimaryBalance(undefined)).toBeUndefined();
});
