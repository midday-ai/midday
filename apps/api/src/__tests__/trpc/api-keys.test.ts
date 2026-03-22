import { beforeEach, describe, expect, test } from "bun:test";
import { createCallerFactory } from "../../trpc/init";
import { apiKeysRouter } from "../../trpc/routers/api-keys";
import { createTestContext } from "../helpers/test-context";
import { mocks } from "../setup";

const createCaller = createCallerFactory(apiKeysRouter);

const KEY_ID = "f1e2d3c4-b5a6-7890-abcd-ef1234567890";

describe("tRPC: apiKeys.get", () => {
  beforeEach(() => {
    mocks.getApiKeysByTeam.mockReset();
    mocks.getApiKeysByTeam.mockImplementation(() => Promise.resolve([]));
  });

  test("returns keys for team", async () => {
    const caller = createCaller(createTestContext());
    const result = await caller.get();

    expect(result).toEqual([]);
    expect(mocks.getApiKeysByTeam).toHaveBeenCalledWith(
      expect.anything(),
      "test-team-id",
    );
  });

  test("rejects without session", async () => {
    const ctx = createTestContext();
    const caller = createCaller({ ...ctx, session: null });

    await expect(caller.get()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});

describe("tRPC: apiKeys.upsert", () => {
  beforeEach(() => {
    mocks.upsertApiKey.mockReset();
    mocks.resendEmailsSend.mockReset();
    mocks.upsertApiKey.mockImplementation(() =>
      Promise.resolve({
        key: "md_test_key_plaintext",
        data: {
          id: KEY_ID,
          name: "Test Key",
          createdAt: "2026-01-01T00:00:00.000Z",
        },
      }),
    );
    mocks.resendEmailsSend.mockImplementation(() => Promise.resolve());
  });

  test("creates key and returns plaintext key plus row data", async () => {
    const caller = createCaller(createTestContext());
    const result = await caller.upsert({
      name: "Test Key",
      scopes: ["apis.read"],
    });

    expect(result).toEqual({
      key: "md_test_key_plaintext",
      data: {
        id: KEY_ID,
        name: "Test Key",
        createdAt: "2026-01-01T00:00:00.000Z",
      },
    });
    expect(mocks.upsertApiKey).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        teamId: "test-team-id",
        userId: "test-user-id",
        name: "Test Key",
        scopes: ["apis.read"],
      }),
    );
  });
});

describe("tRPC: apiKeys.delete", () => {
  beforeEach(() => {
    mocks.deleteApiKey.mockReset();
    mocks.deleteApiKey.mockImplementation(() =>
      Promise.resolve("key-hash-for-cache"),
    );
  });

  test("deletes key and returns key hash for cache invalidation", async () => {
    const caller = createCaller(createTestContext());
    const result = await caller.delete({ id: KEY_ID });

    expect(result).toBe("key-hash-for-cache");
    expect(mocks.deleteApiKey).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        id: KEY_ID,
        teamId: "test-team-id",
      }),
    );
  });
});
