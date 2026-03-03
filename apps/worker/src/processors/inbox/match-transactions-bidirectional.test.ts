import { describe, expect, test } from "bun:test";
import { shouldResetInboxToPendingAfterSuggestionFailure } from "@midday/db/queries";

describe("shouldResetInboxToPendingAfterSuggestionFailure", () => {
  test("returns true when still analyzing and unmatched", () => {
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

  test("returns false when inbox state is missing", () => {
    expect(shouldResetInboxToPendingAfterSuggestionFailure(null)).toBe(false);
  });
});
