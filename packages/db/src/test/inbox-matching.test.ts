import { describe, expect, test } from "bun:test";
import { shouldResetInboxToPendingAfterSuggestionFailure } from "../queries/inbox-matching";

describe("shouldResetInboxToPendingAfterSuggestionFailure", () => {
  test("returns true when inbox is analyzing and not matched", () => {
    expect(
      shouldResetInboxToPendingAfterSuggestionFailure({
        status: "analyzing",
        transactionId: null,
      }),
    ).toBe(true);
  });

  test("returns false when inbox is already matched", () => {
    expect(
      shouldResetInboxToPendingAfterSuggestionFailure({
        status: "done",
        transactionId: "tx_123",
      }),
    ).toBe(false);
  });

  test("returns false when inbox has different status", () => {
    expect(
      shouldResetInboxToPendingAfterSuggestionFailure({
        status: "suggested_match",
        transactionId: null,
      }),
    ).toBe(false);
  });

  test("returns false when state is missing", () => {
    expect(shouldResetInboxToPendingAfterSuggestionFailure(null)).toBe(false);
  });
});
