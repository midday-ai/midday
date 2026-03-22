import { beforeEach, describe, expect, test } from "bun:test";
import { createCallerFactory } from "../../trpc/init";
import { appsRouter } from "../../trpc/routers/apps";
import { createTestContext } from "../helpers/test-context";
import { mocks } from "../setup";

const createCaller = createCallerFactory(appsRouter);

describe("tRPC: apps.get", () => {
  beforeEach(() => {
    mocks.getApps.mockReset();
    mocks.getApps.mockImplementation(() => Promise.resolve([]));
  });

  test("returns apps for team", async () => {
    const caller = createCaller(createTestContext());

    expect(await caller.get()).toEqual([]);
    expect(mocks.getApps).toHaveBeenCalledWith(
      expect.anything(),
      "test-team-id",
    );
  });

  test("returns integrations when query returns rows", async () => {
    mocks.getApps.mockImplementation(() =>
      Promise.resolve([{ app_id: "slack", settings: null, config: null }]),
    );

    const caller = createCaller(createTestContext());

    expect(await caller.get()).toEqual([
      { app_id: "slack", settings: null, config: null },
    ]);
  });
});
