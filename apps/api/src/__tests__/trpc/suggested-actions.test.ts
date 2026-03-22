import { beforeEach, describe, expect, test } from "bun:test";
import { createCallerFactory } from "../../trpc/init";
import { suggestedActionsRouter } from "../../trpc/routers/suggested-actions";
import { createTestContext } from "../helpers/test-context";
import { mocks } from "../setup";

const createCaller = createCallerFactory(suggestedActionsRouter);

describe("tRPC: suggestedActions.list", () => {
  beforeEach(() => {
    mocks.suggestedActionsGetAllUsage.mockReset();
    mocks.suggestedActionsGetAllUsage.mockImplementation(() =>
      Promise.resolve({}),
    );
  });

  test("returns up to limit actions with total count", async () => {
    const caller = createCaller(createTestContext());
    const result = await caller.list({ limit: 5 });

    expect(result.actions).toHaveLength(5);
    expect(result.total).toBeGreaterThan(5);
    expect(mocks.suggestedActionsGetAllUsage).toHaveBeenCalledWith(
      "test-team-id",
      "test-user-id",
    );
  });

  test("rejects when limit exceeds the maximum", async () => {
    const caller = createCaller(createTestContext());

    await expect(caller.list({ limit: 21 })).rejects.toThrow();
  });
});

describe("tRPC: suggestedActions.trackUsage", () => {
  beforeEach(() => {
    mocks.suggestedActionsIncrementUsage.mockReset();
    mocks.suggestedActionsIncrementUsage.mockImplementation(() =>
      Promise.resolve(),
    );
  });

  test("increments usage for an action id", async () => {
    const caller = createCaller(createTestContext());
    const result = await caller.trackUsage({ actionId: "action-1" });

    expect(result).toEqual({ success: true });
    expect(mocks.suggestedActionsIncrementUsage).toHaveBeenCalledWith(
      "test-team-id",
      "test-user-id",
      "action-1",
    );
  });
});
