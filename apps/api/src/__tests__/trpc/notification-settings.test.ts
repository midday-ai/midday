import { beforeEach, describe, expect, test } from "bun:test";
import { createCallerFactory } from "../../trpc/init";
import { notificationSettingsRouter } from "../../trpc/routers/notification-settings";
import { createTestContext } from "../helpers/test-context";
import { mocks } from "../setup";

const createCaller = createCallerFactory(notificationSettingsRouter);

describe("tRPC: notificationSettings.get", () => {
  beforeEach(() => {
    mocks.getNotificationSettings.mockReset();
    mocks.getNotificationSettings.mockImplementation(() => Promise.resolve([]));
  });

  test("returns settings for user and team", async () => {
    const caller = createCaller(createTestContext());

    expect(await caller.get()).toEqual([]);
    expect(mocks.getNotificationSettings).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        userId: "test-user-id",
        teamId: "test-team-id",
      }),
    );
  });

  test("rejects invalid notification channel", async () => {
    const caller = createCaller(createTestContext());

    await expect(
      caller.get({
        channel: "sms" as "in_app",
      }),
    ).rejects.toThrow();
  });
});

describe("tRPC: notificationSettings.getAll", () => {
  beforeEach(() => {
    mocks.getUserNotificationPreferences.mockReset();
    mocks.getUserNotificationPreferences.mockImplementation(() =>
      Promise.resolve([]),
    );
  });

  test("returns all notification preferences", async () => {
    const caller = createCaller(createTestContext());

    expect(await caller.getAll()).toEqual([]);
    expect(mocks.getUserNotificationPreferences).toHaveBeenCalledWith(
      expect.anything(),
      "test-user-id",
      "test-team-id",
    );
  });

  test("passes custom user id from session", async () => {
    const caller = createCaller(
      createTestContext({ userId: "custom-user-id" }),
    );
    await caller.getAll();

    expect(mocks.getUserNotificationPreferences).toHaveBeenCalledWith(
      expect.anything(),
      "custom-user-id",
      "test-team-id",
    );
  });
});

describe("tRPC: notificationSettings.update", () => {
  beforeEach(() => {
    mocks.upsertNotificationSetting.mockReset();
    mocks.upsertNotificationSetting.mockImplementation(() =>
      Promise.resolve({
        id: "notif-setting-1",
        notificationType: "transaction",
        channel: "email",
        enabled: true,
      }),
    );
  });

  test("upserts a single notification preference", async () => {
    const caller = createCaller(createTestContext());
    const result = await caller.update({
      notificationType: "transaction",
      channel: "email",
      enabled: true,
    });

    expect(result).toMatchObject({
      id: "notif-setting-1",
      notificationType: "transaction",
      channel: "email",
      enabled: true,
    });
    expect(mocks.upsertNotificationSetting).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        userId: "test-user-id",
        teamId: "test-team-id",
        notificationType: "transaction",
        channel: "email",
        enabled: true,
      }),
    );
  });
});

describe("tRPC: notificationSettings.bulkUpdate", () => {
  beforeEach(() => {
    mocks.bulkUpdateNotificationSettings.mockReset();
    mocks.bulkUpdateNotificationSettings.mockImplementation(() =>
      Promise.resolve([
        {
          id: "notif-setting-1",
          notificationType: "transaction",
          channel: "email",
          enabled: true,
        },
      ]),
    );
  });

  test("applies multiple notification preference updates", async () => {
    const caller = createCaller(createTestContext());
    const result = await caller.bulkUpdate({
      updates: [
        {
          notificationType: "transaction",
          channel: "email",
          enabled: true,
        },
      ],
    });

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ id: "notif-setting-1" });
    expect(mocks.bulkUpdateNotificationSettings).toHaveBeenCalledWith(
      expect.anything(),
      "test-user-id",
      "test-team-id",
      [
        {
          notificationType: "transaction",
          channel: "email",
          enabled: true,
        },
      ],
    );
  });
});
