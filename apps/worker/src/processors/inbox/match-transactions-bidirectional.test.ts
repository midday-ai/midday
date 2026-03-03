import { describe, expect, test } from "bun:test";
import { shouldRollbackForwardInboxToPending } from "./match-transactions-bidirectional";

describe("shouldRollbackForwardInboxToPending", () => {
  test("returns false when workflow persistence already succeeded", () => {
    expect(
      shouldRollbackForwardInboxToPending({
        workflowPersisted: true,
        inboxState: { status: "analyzing", transactionId: null },
      }),
    ).toBe(false);
  });

  test("returns true when still analyzing and unmatched", () => {
    expect(
      shouldRollbackForwardInboxToPending({
        workflowPersisted: false,
        inboxState: { status: "analyzing", transactionId: null },
      }),
    ).toBe(true);
  });

  test("returns false when inbox is already matched", () => {
    expect(
      shouldRollbackForwardInboxToPending({
        workflowPersisted: false,
        inboxState: { status: "done", transactionId: "tx_123" },
      }),
    ).toBe(false);
  });

  test("returns false when inbox state is missing", () => {
    expect(
      shouldRollbackForwardInboxToPending({
        workflowPersisted: false,
        inboxState: null,
      }),
    ).toBe(false);
  });
});
