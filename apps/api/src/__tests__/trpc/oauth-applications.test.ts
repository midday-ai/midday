import { beforeEach, describe, expect, test } from "bun:test";
import { createCallerFactory } from "../../trpc/init";
import { oauthApplicationsRouter } from "../../trpc/routers/oauth-applications";
import { createTestContext } from "../helpers/test-context";
import { mocks } from "../setup";

const APP_ID = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";

const createCaller = createCallerFactory(oauthApplicationsRouter);

describe("tRPC: oauthApplications.list", () => {
  beforeEach(() => {
    mocks.getOAuthApplicationsByTeam.mockReset();
    mocks.getOAuthApplicationsByTeam.mockImplementation(() =>
      Promise.resolve([]),
    );
  });

  test("returns applications for team", async () => {
    const caller = createCaller(createTestContext());
    const result = await caller.list();

    expect(result).toEqual({ data: [] });
    expect(mocks.getOAuthApplicationsByTeam).toHaveBeenCalledWith(
      expect.anything(),
      "test-team-id",
    );
  });

  test("returns non-empty data when team has apps", async () => {
    mocks.getOAuthApplicationsByTeam.mockImplementation(() =>
      Promise.resolve([{ id: APP_ID, name: "App" }]),
    );

    const caller = createCaller(createTestContext());
    expect(await caller.list()).toMatchObject({
      data: [{ id: APP_ID, name: "App" }],
    });
  });
});

describe("tRPC: oauthApplications.get", () => {
  beforeEach(() => {
    mocks.getOAuthApplicationById.mockReset();
    mocks.getOAuthApplicationById.mockImplementation(() =>
      Promise.resolve({
        id: APP_ID,
        name: "My App",
        clientId: "client-id-1",
      }),
    );
  });

  test("returns application by id", async () => {
    const caller = createCaller(createTestContext());
    const result = await caller.get({ id: APP_ID });

    expect(result).toMatchObject({
      id: APP_ID,
      name: "My App",
      clientId: "client-id-1",
    });
    expect(mocks.getOAuthApplicationById).toHaveBeenCalledWith(
      expect.anything(),
      APP_ID,
      "test-team-id",
    );
  });

  test("throws when application is missing", async () => {
    mocks.getOAuthApplicationById.mockImplementation(() =>
      Promise.resolve(null),
    );

    const caller = createCaller(createTestContext());
    await expect(caller.get({ id: APP_ID })).rejects.toThrow(
      "OAuth application not found",
    );
  });

  test("rejects non-uuid id", async () => {
    const caller = createCaller(createTestContext());
    await expect(caller.get({ id: "not-a-uuid" })).rejects.toThrow();
  });
});

describe("tRPC: oauthApplications.delete", () => {
  beforeEach(() => {
    mocks.deleteOAuthApplication.mockReset();
    mocks.deleteOAuthApplication.mockImplementation(() => Promise.resolve({}));
  });

  test("deletes application", async () => {
    const caller = createCaller(createTestContext());
    const result = await caller.delete({ id: APP_ID });

    expect(result).toEqual({ success: true });
    expect(mocks.deleteOAuthApplication).toHaveBeenCalledWith(
      expect.anything(),
      { id: APP_ID, teamId: "test-team-id" },
    );
  });

  test("throws when application is missing", async () => {
    mocks.deleteOAuthApplication.mockImplementation(() =>
      Promise.resolve(undefined),
    );

    const caller = createCaller(createTestContext());
    await expect(caller.delete({ id: APP_ID })).rejects.toThrow(
      "OAuth application not found",
    );
  });

  test("rejects non-uuid id", async () => {
    const caller = createCaller(createTestContext());
    await expect(caller.delete({ id: "bad" })).rejects.toThrow();
  });
});

describe("tRPC: oauthApplications.create", () => {
  beforeEach(() => {
    mocks.createOAuthApplication.mockReset();
    mocks.createOAuthApplication.mockImplementation(() =>
      Promise.resolve({
        id: APP_ID,
        name: "Test App",
        clientId: "mid_client_test",
        clientSecret: "secret_plaintext",
      }),
    );
  });

  test("creates application with client credentials", async () => {
    const caller = createCaller(createTestContext());
    const result = await caller.create({
      name: "Test App",
      redirectUris: ["https://example.com/callback"],
    });

    expect(result).toMatchObject({
      id: APP_ID,
      name: "Test App",
      clientId: "mid_client_test",
      clientSecret: "secret_plaintext",
    });
    expect(mocks.createOAuthApplication).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        teamId: "test-team-id",
        createdBy: "test-user-id",
        name: "Test App",
        redirectUris: ["https://example.com/callback"],
      }),
    );
  });
});

describe("tRPC: oauthApplications.update", () => {
  beforeEach(() => {
    mocks.updateOAuthApplication.mockReset();
    mocks.updateOAuthApplication.mockImplementation(() =>
      Promise.resolve({
        id: APP_ID,
        name: "Updated",
      }),
    );
  });

  test("updates application metadata", async () => {
    const caller = createCaller(createTestContext());
    const result = await caller.update({ id: APP_ID, name: "Updated" });

    expect(result).toMatchObject({ id: APP_ID, name: "Updated" });
    expect(mocks.updateOAuthApplication).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        id: APP_ID,
        name: "Updated",
        teamId: "test-team-id",
      }),
    );
  });
});

describe("tRPC: oauthApplications.regenerateSecret", () => {
  beforeEach(() => {
    mocks.regenerateClientSecret.mockReset();
    mocks.regenerateClientSecret.mockImplementation(() =>
      Promise.resolve({ clientSecret: "new-secret" }),
    );
  });

  test("returns a new client secret", async () => {
    const caller = createCaller(createTestContext());
    const result = await caller.regenerateSecret({ id: APP_ID });

    expect(result).toMatchObject({ clientSecret: "new-secret" });
    expect(mocks.regenerateClientSecret).toHaveBeenCalledWith(
      expect.anything(),
      APP_ID,
      "test-team-id",
    );
  });
});

describe("tRPC: oauthApplications — cross-team isolation", () => {
  beforeEach(() => {
    mocks.getOAuthApplicationById.mockReset();
    mocks.updateOAuthApplication.mockReset();
    mocks.deleteOAuthApplication.mockReset();
    mocks.regenerateClientSecret.mockReset();
  });

  test("get passes session teamId and rejects when DB returns null (strict ownership)", async () => {
    mocks.getOAuthApplicationById.mockImplementation(() =>
      Promise.resolve(null),
    );

    const caller = createCaller(createTestContext());
    await expect(caller.get({ id: APP_ID })).rejects.toThrow(
      "OAuth application not found",
    );
    expect(mocks.getOAuthApplicationById).toHaveBeenCalledWith(
      expect.anything(),
      APP_ID,
      "test-team-id",
    );
  });

  test("update passes session teamId and rejects when DB returns undefined (strict ownership)", async () => {
    mocks.updateOAuthApplication.mockImplementation(() =>
      Promise.resolve(undefined),
    );

    const caller = createCaller(createTestContext());
    await expect(
      caller.update({ id: APP_ID, name: "Hijacked" }),
    ).rejects.toThrow("OAuth application not found");
    expect(mocks.updateOAuthApplication).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ id: APP_ID, teamId: "test-team-id" }),
    );
  });

  test("delete passes session teamId and rejects when DB returns undefined (strict ownership)", async () => {
    mocks.deleteOAuthApplication.mockImplementation(() =>
      Promise.resolve(undefined),
    );

    const caller = createCaller(createTestContext());
    await expect(caller.delete({ id: APP_ID })).rejects.toThrow(
      "OAuth application not found",
    );
    expect(mocks.deleteOAuthApplication).toHaveBeenCalledWith(
      expect.anything(),
      { id: APP_ID, teamId: "test-team-id" },
    );
  });

  test("regenerateSecret passes session teamId and rejects when DB returns null (strict ownership)", async () => {
    mocks.regenerateClientSecret.mockImplementation(() =>
      Promise.resolve(null),
    );

    const caller = createCaller(createTestContext());
    await expect(caller.regenerateSecret({ id: APP_ID })).rejects.toThrow(
      "OAuth application not found",
    );
    expect(mocks.regenerateClientSecret).toHaveBeenCalledWith(
      expect.anything(),
      APP_ID,
      "test-team-id",
    );
  });

  test("delete calls deleteOAuthApplication directly with strict teamId (no branching)", async () => {
    mocks.deleteOAuthApplication.mockImplementation(() =>
      Promise.resolve({ id: APP_ID, name: "Test" }),
    );

    const caller = createCaller(createTestContext());
    await caller.delete({ id: APP_ID });

    expect(mocks.deleteOAuthApplication).toHaveBeenCalledTimes(1);
    expect(mocks.deleteOAuthApplication).toHaveBeenCalledWith(
      expect.anything(),
      { id: APP_ID, teamId: "test-team-id" },
    );
  });

  test("create always uses session teamId from middleware", async () => {
    mocks.createOAuthApplication.mockReset();
    mocks.createOAuthApplication.mockImplementation(() =>
      Promise.resolve({
        id: APP_ID,
        name: "App",
        clientId: "mid_client_x",
        clientSecret: "secret",
      }),
    );

    const caller = createCaller(createTestContext());
    await caller.create({
      name: "App",
      redirectUris: ["https://example.com/cb"],
    });

    expect(mocks.createOAuthApplication).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ teamId: "test-team-id" }),
    );
  });
});

describe("tRPC: oauthApplications.authorized", () => {
  beforeEach(() => {
    mocks.getUserAuthorizedApplications.mockReset();
    mocks.getUserAuthorizedApplications.mockImplementation(() =>
      Promise.resolve([]),
    );
  });

  test("returns authorized apps for user and team", async () => {
    const caller = createCaller(createTestContext());
    const result = await caller.authorized();

    expect(result).toEqual({ data: [] });
    expect(mocks.getUserAuthorizedApplications).toHaveBeenCalledWith(
      expect.anything(),
      "test-user-id",
      "test-team-id",
    );
  });
});

describe("tRPC: oauthApplications.revokeAccess", () => {
  beforeEach(() => {
    mocks.revokeUserApplicationTokens.mockReset();
    mocks.revokeUserApplicationTokens.mockImplementation(() =>
      Promise.resolve(),
    );
  });

  test("revokes tokens for an application", async () => {
    const caller = createCaller(createTestContext());
    const result = await caller.revokeAccess({ applicationId: APP_ID });

    expect(result).toEqual({ success: true });
    expect(mocks.revokeUserApplicationTokens).toHaveBeenCalledWith(
      expect.anything(),
      "test-user-id",
      APP_ID,
    );
  });
});
