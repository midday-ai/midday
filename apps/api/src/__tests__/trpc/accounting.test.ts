import { beforeEach, describe, expect, test } from "bun:test";
import { createCallerFactory } from "../../trpc/init";
import { accountingRouter } from "../../trpc/routers/accounting";
import { createTestContext } from "../helpers/test-context";
import { mocks } from "../setup";

const createCaller = createCallerFactory(accountingRouter);

describe("tRPC: accounting.getConnections", () => {
  beforeEach(() => {
    mocks.getApps.mockReset();
    mocks.getApps.mockImplementation(() => Promise.resolve([]));
  });

  test("returns an empty list when there are no connected apps", async () => {
    const caller = createCaller(createTestContext());
    const result = await caller.getConnections();

    expect(result).toEqual([]);
    expect(mocks.getApps).toHaveBeenCalledWith(
      expect.anything(),
      "test-team-id",
    );
  });

  test("rejects when the user has no team", async () => {
    mocks.simulateMissingTeamOnce();

    const caller = createCaller(createTestContext());

    await expect(caller.getConnections()).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });
});
