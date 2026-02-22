import { expect, test } from "bun:test";
import type { GetBalancesResponse } from "./types";
import { selectPrimaryBalance } from "./utils";

type Balance = GetBalancesResponse["balances"][0];

const mkBalance = (
  type: string,
  amount: string,
  currency: string,
): Balance => ({
  name: "",
  balance_amount: { amount, currency },
  balance_type: type,
  last_change_date_time: "2024-03-06",
  reference_date: "2024-03-06",
  last_committed_transaction: "",
});

test("selectPrimaryBalance - single interimAvailable", () => {
  const result = selectPrimaryBalance([
    mkBalance("interimAvailable", "5000.00", "EUR"),
  ]);
  expect(result?.balance_amount).toEqual({
    amount: "5000.00",
    currency: "EUR",
  });
});

test("selectPrimaryBalance - prefers interimAvailable over expected", () => {
  const result = selectPrimaryBalance([
    mkBalance("expected", "9999.00", "EUR"),
    mkBalance("interimAvailable", "5000.00", "EUR"),
  ]);
  expect(result?.balance_amount).toEqual({
    amount: "5000.00",
    currency: "EUR",
  });
});

test("selectPrimaryBalance - prefers closingBooked over expected", () => {
  const result = selectPrimaryBalance([
    mkBalance("closingBooked", "1000.00", "EUR"),
    mkBalance("expected", "2000.00", "EUR"),
  ]);
  expect(result?.balance_amount).toEqual({
    amount: "1000.00",
    currency: "EUR",
  });
});

test("selectPrimaryBalance - prefers interimBooked over closingBooked", () => {
  const result = selectPrimaryBalance([
    mkBalance("ITBD", "5000.00", "EUR"),
    mkBalance("closingBooked", "9000.00", "EUR"),
  ]);
  expect(result?.balance_amount).toEqual({
    amount: "5000.00",
    currency: "EUR",
  });
});

test("selectPrimaryBalance - prefers closingBooked over interimAvailable", () => {
  const result = selectPrimaryBalance([
    mkBalance("ITAV", "8000.00", "EUR"),
    mkBalance("CLBD", "7500.00", "EUR"),
  ]);
  expect(result?.balance_amount).toEqual({
    amount: "7500.00",
    currency: "EUR",
  });
});

test("selectPrimaryBalance - falls back to first balance when no preferred types", () => {
  const result = selectPrimaryBalance([
    mkBalance("closingBooked", "3000.00", "EUR"),
    mkBalance("openingBooked", "2000.00", "EUR"),
  ]);
  expect(result?.balance_amount).toEqual({
    amount: "3000.00",
    currency: "EUR",
  });
});

test("selectPrimaryBalance - multi-currency picks highest amount among preferred types", () => {
  const result = selectPrimaryBalance([
    mkBalance("interimAvailable", "9.76", "DKK"),
    mkBalance("interimBooked", "9.76", "DKK"),
    mkBalance("interimAvailable", "9242.93", "EUR"),
    mkBalance("interimBooked", "9436.86", "EUR"),
  ]);
  expect(result?.balance_amount).toEqual({
    amount: "9436.86",
    currency: "EUR",
  });
});

test("selectPrimaryBalance - multi-currency with only interimAvailable", () => {
  const result = selectPrimaryBalance([
    mkBalance("interimAvailable", "50.00", "DKK"),
    mkBalance("interimAvailable", "8000.00", "EUR"),
  ]);
  expect(result?.balance_amount).toEqual({
    amount: "8000.00",
    currency: "EUR",
  });
});

test("selectPrimaryBalance - uses absolute value for negative balances (credit)", () => {
  const result = selectPrimaryBalance([
    mkBalance("interimAvailable", "100.00", "DKK"),
    mkBalance("interimBooked", "-5000.00", "EUR"),
  ]);
  expect(result?.balance_amount).toEqual({
    amount: "-5000.00",
    currency: "EUR",
  });
});

test("selectPrimaryBalance - handles ISO 20022 short codes (ITAV, ITBD)", () => {
  const result = selectPrimaryBalance([
    mkBalance("ITAV", "100.00", "DKK"),
    mkBalance("ITBD", "5000.00", "EUR"),
  ]);
  expect(result?.balance_amount).toEqual({
    amount: "5000.00",
    currency: "EUR",
  });
});

test("selectPrimaryBalance - falls back to XPCD when no booked types", () => {
  const result = selectPrimaryBalance([
    mkBalance("XPCD", "2000.00", "EUR"),
    mkBalance("forwardAvailable", "1500.00", "EUR"),
  ]);
  expect(result?.balance_amount).toEqual({
    amount: "2000.00",
    currency: "EUR",
  });
});

test("selectPrimaryBalance - preferredCurrency narrows to matching currency", () => {
  const result = selectPrimaryBalance(
    [mkBalance("ITBD", "9000.00", "DKK"), mkBalance("ITBD", "5000.00", "EUR")],
    "EUR",
  );
  expect(result?.balance_amount).toEqual({
    amount: "5000.00",
    currency: "EUR",
  });
});

test("selectPrimaryBalance - preferredCurrency falls back to all when no match", () => {
  const result = selectPrimaryBalance(
    [mkBalance("ITBD", "9000.00", "DKK"), mkBalance("ITAV", "5000.00", "DKK")],
    "EUR",
  );
  expect(result?.balance_amount).toEqual({
    amount: "9000.00",
    currency: "DKK",
  });
});

test("selectPrimaryBalance - preferredCurrency ignores XXX hint", () => {
  const result = selectPrimaryBalance(
    [mkBalance("ITBD", "100.00", "DKK"), mkBalance("ITBD", "9000.00", "EUR")],
    "XXX",
  );
  expect(result?.balance_amount).toEqual({
    amount: "9000.00",
    currency: "EUR",
  });
});

test("selectPrimaryBalance - empty array returns undefined", () => {
  expect(selectPrimaryBalance([])).toBeUndefined();
});
