import { expect, test } from "bun:test";
import { getMaxHistoricalDays } from "./utils";

test("Should return 90 days", () => {
  expect(
    getMaxHistoricalDays({
      institutionId: "SWEDBANK_SWEDSESS",
      transactionTotalDays: 720,
    })
  ).toEqual(90);
});

test("Should return 720 days", () => {
  expect(
    getMaxHistoricalDays({
      institutionId: "NOT_RESTRICTED",
      transactionTotalDays: 720,
    })
  ).toEqual(720);
});
