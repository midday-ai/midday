import { beforeEach, describe, expect, test } from "bun:test";
import { createCallerFactory } from "../../trpc/init";
import { notificationsRouter } from "../../trpc/routers/notifications";
import { createTestContext } from "../helpers/test-context";
import { mocks } from "../setup";

const ACTIVITY_ID = "b3b6e2c2-1f2a-4e3b-9c1d-2a4b6e2c21f2";

const createCaller = createCallerFactory(notificationsRouter);

describe("tRPC: notifications.list", () => {
  beforeEach(() => {
    mocks.getActivities.mockReset();
    mocks.getActivities.mockImplementation(() =>
      Promise.resolve({
        data: [],
        meta: {
          cursor: null,
          hasPreviousPage: false,
          hasNextPage: false,
        },
      }),
    );
  });

  test("returns paginated activities for team and user", async () => {
    const caller = createCaller(createTestContext());
    const result = await caller.list();

    expect(result).toEqual({
      data: [],
      meta: {
        cursor: null,
        hasPreviousPage: false,
        hasNextPage: false,
      },
    });
    expect(mocks.getActivities).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        teamId: "test-team-id",
        userId: "test-user-id",
      }),
    );
  });

  test("rejects pageSize above schema max", async () => {
    const caller = createCaller(createTestContext());

    await expect(caller.list({ pageSize: 101 })).rejects.toThrow();
  });
});

describe("tRPC: notifications.updateStatus", () => {
  beforeEach(() => {
    mocks.updateActivityStatus.mockReset();
    mocks.updateActivityStatus.mockImplementation(() =>
      Promise.resolve({ id: ACTIVITY_ID, status: "read" }),
    );
  });

  test("updates single notification status", async () => {
    const caller = createCaller(createTestContext());
    const result = await caller.updateStatus({
      activityId: ACTIVITY_ID,
      status: "read",
    });

    expect(result).toMatchObject({ id: ACTIVITY_ID });
    expect(mocks.updateActivityStatus).toHaveBeenCalledWith(
      expect.anything(),
      ACTIVITY_ID,
      "read",
      "test-team-id",
    );
  });

  test("rejects invalid activity id", async () => {
    const caller = createCaller(createTestContext());

    await expect(
      caller.updateStatus({
        activityId: "not-a-uuid",
        status: "read",
      }),
    ).rejects.toThrow();
  });
});

describe("tRPC: notifications.updateAllStatus", () => {
  beforeEach(() => {
    mocks.updateAllActivitiesStatus.mockReset();
    mocks.updateAllActivitiesStatus.mockImplementation(() =>
      Promise.resolve([]),
    );
  });

  test("updates all notifications to read for current user", async () => {
    const caller = createCaller(createTestContext());
    const result = await caller.updateAllStatus({ status: "read" });

    expect(result).toEqual([]);
    expect(mocks.updateAllActivitiesStatus).toHaveBeenCalledWith(
      expect.anything(),
      "test-team-id",
      "read",
      { userId: "test-user-id" },
    );
  });

  test("rejects invalid status value", async () => {
    const caller = createCaller(createTestContext());

    await expect(
      caller.updateAllStatus({ status: "done" } as never),
    ).rejects.toThrow();
  });
});
