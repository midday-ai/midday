import { beforeEach, describe, expect, test } from "bun:test";
// Import after mocking (mocks are set up via preload)
import { createCallerFactory } from "../../trpc/init";
import { trackerProjectsRouter } from "../../trpc/routers/tracker-projects";
import { createTestContext } from "../helpers/test-context";
import { mocks } from "../setup";

const PROJECT_ID = "b3b6e2c2-1f2a-4e3b-9c1d-2a4b6e2c21f2";

const createCaller = createCallerFactory(trackerProjectsRouter);

describe("tRPC: trackerProjects.get", () => {
  beforeEach(() => {
    mocks.getTrackerProjects.mockReset();
    mocks.getTrackerProjects.mockImplementation(() => ({
      data: [],
      meta: { hasNextPage: false, cursor: null },
    }));
  });

  test("returns projects list", async () => {
    mocks.getTrackerProjects.mockImplementation(() => ({
      data: [{ id: PROJECT_ID, name: "Alpha" }],
      meta: { hasNextPage: false, cursor: null },
    }));

    const caller = createCaller(createTestContext());
    const result = await caller.get({});

    expect(result.data).toHaveLength(1);
    expect(result.data[0]!.id).toBe(PROJECT_ID);
    expect(result.meta.hasNextPage).toBe(false);
  });

  test("passes teamId to DB query", async () => {
    const caller = createCaller(createTestContext());
    await caller.get({});

    expect(mocks.getTrackerProjects).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        teamId: "test-team-id",
      }),
    );
  });

  test("handles empty list", async () => {
    const caller = createCaller(createTestContext());
    const result = await caller.get({});

    expect(result.data).toEqual([]);
    expect(result.meta.hasNextPage).toBe(false);
  });
});

describe("tRPC: trackerProjects.getById", () => {
  beforeEach(() => {
    mocks.getTrackerProjectById.mockReset();
  });

  test("returns single project", async () => {
    mocks.getTrackerProjectById.mockImplementation(() => ({
      id: PROJECT_ID,
      name: "Test Project",
    }));

    const caller = createCaller(createTestContext());
    const result = await caller.getById({ id: PROJECT_ID });

    expect(result).toMatchObject({ id: PROJECT_ID, name: "Test Project" });
  });

  test("passes teamId and id to DB query", async () => {
    mocks.getTrackerProjectById.mockImplementation(() => ({
      id: PROJECT_ID,
      name: "Test Project",
    }));

    const caller = createCaller(createTestContext());
    await caller.getById({ id: PROJECT_ID });

    expect(mocks.getTrackerProjectById).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        id: PROJECT_ID,
        teamId: "test-team-id",
      }),
    );
  });

  test("returns null for non-existent project", async () => {
    mocks.getTrackerProjectById.mockImplementation(() => null);

    const caller = createCaller(createTestContext());
    const result = await caller.getById({
      id: "c4d5e6f7-8a9b-4c0d-9e1f-2a3b4c5d6e7f",
    });

    expect(result).toBeNull();
  });
});

describe("tRPC: trackerProjects.upsert", () => {
  beforeEach(() => {
    mocks.upsertTrackerProject.mockReset();
    mocks.upsertTrackerProject.mockImplementation(() => ({
      id: PROJECT_ID,
      name: "New Project",
    }));
  });

  test("returns created project", async () => {
    const caller = createCaller(createTestContext());
    const result = await caller.upsert({ name: "New Project" });

    expect(result).toMatchObject({ id: PROJECT_ID, name: "New Project" });
  });

  test("passes teamId and userId to DB query", async () => {
    const caller = createCaller(createTestContext());
    await caller.upsert({ name: "New Project" });

    expect(mocks.upsertTrackerProject).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        teamId: "test-team-id",
        userId: "test-user-id",
        name: "New Project",
      }),
    );
  });

  test("passes id when updating existing project", async () => {
    const updateId = "d5e6f7a8-9b0c-4d1e-8f2a-3b4c5d6e7f8a";
    mocks.upsertTrackerProject.mockImplementation(() => ({
      id: updateId,
      name: "Renamed",
    }));

    const caller = createCaller(createTestContext());
    const result = await caller.upsert({ id: updateId, name: "Renamed" });

    expect(mocks.upsertTrackerProject).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        id: updateId,
        name: "Renamed",
      }),
    );
    expect(result?.id).toBe(updateId);
  });
});

describe("tRPC: trackerProjects.delete", () => {
  beforeEach(() => {
    mocks.deleteTrackerProject.mockReset();
    mocks.deleteTrackerProject.mockImplementation(() => ({ id: PROJECT_ID }));
  });

  test("deletes project successfully", async () => {
    const caller = createCaller(createTestContext());
    const result = await caller.delete({ id: PROJECT_ID });

    expect(result).toEqual({ id: PROJECT_ID });
  });

  test("passes teamId and id to DB query", async () => {
    const caller = createCaller(createTestContext());
    await caller.delete({ id: PROJECT_ID });

    expect(mocks.deleteTrackerProject).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        teamId: "test-team-id",
        id: PROJECT_ID,
      }),
    );
  });

  test("handles different project id", async () => {
    const otherId = "e6f7a8b9-0c1d-4e2f-9a3b-4c5d6e7f8a9b";
    mocks.deleteTrackerProject.mockImplementation(() => ({ id: otherId }));

    const caller = createCaller(createTestContext());
    const result = await caller.delete({ id: otherId });

    expect(result?.id).toBe(otherId);
  });
});
