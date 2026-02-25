import { describe, expect, it } from "bun:test";
import {
  isActiveRequest,
  shouldApplyMappedColumn,
} from "./field-mapping.utils";

describe("isActiveRequest", () => {
  it("returns true when request id matches active request", () => {
    const activeRequestRef = { current: 2 };
    expect(isActiveRequest(2, activeRequestRef)).toBe(true);
  });

  it("returns false for stale request id", () => {
    const activeRequestRef = { current: 3 };
    expect(isActiveRequest(2, activeRequestRef)).toBe(false);
  });
});

describe("shouldApplyMappedColumn", () => {
  const fileColumns = ["Transaction Date", "Description", "Amount"];

  it("accepts valid mapped field and exact column name", () => {
    expect(
      shouldApplyMappedColumn("date", "Transaction Date", fileColumns),
    ).toBe(true);
  });

  it("rejects unknown field keys", () => {
    expect(
      shouldApplyMappedColumn("merchant", "Description", fileColumns),
    ).toBe(false);
  });

  it("rejects values that are not present columns", () => {
    expect(shouldApplyMappedColumn("amount", "Total", fileColumns)).toBe(false);
  });
});
