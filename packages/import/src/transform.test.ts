import { describe, expect, it } from "bun:test";
import { transform } from "./transform";

const baseTransaction = {
  teamId: "team-1",
  bankAccountId: "bank-1",
  date: "2026-02-25",
  amount: "100.50",
  currency: "sek",
  description: "Coffee Shop",
  counterparty: "Acme AB",
};

describe("transform internal_id", () => {
  it("generates deterministic internal_id for identical input", () => {
    const first = transform({
      transaction: baseTransaction,
      inverted: false,
    });
    const second = transform({
      transaction: baseTransaction,
      inverted: false,
    });

    expect(first.internal_id).toBe(second.internal_id);
  });

  it("changes internal_id when transaction fingerprint changes", () => {
    const first = transform({
      transaction: baseTransaction,
      inverted: false,
    });
    const second = transform({
      transaction: {
        ...baseTransaction,
        amount: "101.50",
      },
      inverted: false,
    });

    expect(first.internal_id).not.toBe(second.internal_id);
  });
});
