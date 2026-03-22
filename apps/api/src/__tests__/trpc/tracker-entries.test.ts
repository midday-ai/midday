import { beforeEach, describe, expect, test } from "bun:test";
// Import after mocking (mocks are set up via preload)
import { createCallerFactory } from "../../trpc/init";
import { trackerEntriesRouter } from "../../trpc/routers/tracker-entries";
import { createTestContext } from "../helpers/test-context";
import { mocks } from "../setup";

const PROJECT_ID = "b3b6e2c2-1f2a-4e3b-9c1d-2a4b6e2c21f2";
const ENTRY_ID = "a1b2c3d4-5e6f-4a7b-8c9d-0e1f2a3b4c5d";

const createCaller = createCallerFactory(trackerEntriesRouter);

describe("tRPC: trackerEntries.byDate", () => {
  beforeEach(() => {
    mocks.getTrackerRecordsByDate.mockReset();
    mocks.getTrackerRecordsByDate.mockImplementation(() => ({
      meta: { totalDuration: 0 },
      data: [],
    }));
  });

  test("returns empty list when DB returns no records", async () => {
    const caller = createCaller(createTestContext());
    const result = await caller.byDate({ date: "2026-03-21" });

    expect(result).toMatchObject({ meta: { totalDuration: 0 }, data: [] });
  });

  test("passes date and teamId to DB query", async () => {
    mocks.getTrackerRecordsByDate.mockImplementation(() => ({
      meta: { totalDuration: 0 },
      data: [],
    }));

    const caller = createCaller(createTestContext());
    await caller.byDate({ date: "2026-03-21" });

    expect(mocks.getTrackerRecordsByDate).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        date: "2026-03-21",
        teamId: "test-team-id",
      }),
    );
  });

  test("returns structured response when DB returns data", async () => {
    mocks.getTrackerRecordsByDate.mockImplementation(() => ({
      meta: { totalDuration: 3600 },
      data: [{ id: ENTRY_ID, duration: 3600 }],
    }));

    const caller = createCaller(createTestContext());
    const result = await caller.byDate({ date: "2026-03-21" });

    expect(result).toMatchObject({
      meta: { totalDuration: 3600 },
      data: [{ id: ENTRY_ID, duration: 3600 }],
    });
  });
});

describe("tRPC: trackerEntries.byRange", () => {
  beforeEach(() => {
    mocks.getTrackerRecordsByRange.mockReset();
    mocks.getTrackerRecordsByRange.mockImplementation(() => ({
      meta: {
        totalDuration: 0,
        totalAmount: 0,
        from: "2026-03-01",
        to: "2026-03-31",
      },
      result: {},
    }));
  });

  test("returns empty list when DB returns no records", async () => {
    const caller = createCaller(createTestContext());
    const result = await caller.byRange({
      from: "2026-03-01",
      to: "2026-03-31",
    });

    expect(result).toMatchObject({
      meta: {
        totalDuration: 0,
        totalAmount: 0,
        from: "2026-03-01",
        to: "2026-03-31",
      },
      result: {},
    });
  });

  test("passes date range, teamId, and userId to DB query", async () => {
    mocks.getTrackerRecordsByRange.mockImplementation(() => ({
      meta: {
        totalDuration: 0,
        totalAmount: 0,
        from: "2026-03-01",
        to: "2026-03-31",
      },
      result: {},
    }));

    const caller = createCaller(createTestContext());
    await caller.byRange({
      from: "2026-03-01",
      to: "2026-03-31",
    });

    expect(mocks.getTrackerRecordsByRange).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        from: "2026-03-01",
        to: "2026-03-31",
        teamId: "test-team-id",
        userId: "test-user-id",
      }),
    );
  });

  test("passes optional projectId to DB query", async () => {
    mocks.getTrackerRecordsByRange.mockImplementation(() => ({
      meta: {
        totalDuration: 0,
        totalAmount: 0,
        from: "2026-03-01",
        to: "2026-03-31",
      },
      result: {},
    }));

    const caller = createCaller(createTestContext());
    await caller.byRange({
      from: "2026-03-01",
      to: "2026-03-31",
      projectId: PROJECT_ID,
    });

    expect(mocks.getTrackerRecordsByRange).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        projectId: PROJECT_ID,
      }),
    );
  });
});

describe("tRPC: trackerEntries.upsert", () => {
  beforeEach(() => {
    mocks.upsertTrackerEntries.mockReset();
    mocks.upsertTrackerEntries.mockImplementation(() => [{ id: "entry-id" }]);
  });

  test("returns upserted entry id", async () => {
    const caller = createCaller(createTestContext());
    const result = await caller.upsert({
      projectId: PROJECT_ID,
      start: "2026-03-21T08:00:00.000Z",
      stop: "2026-03-21T09:00:00.000Z",
      dates: ["2026-03-21"],
      duration: 3600,
    });

    expect(result).toMatchObject([{ id: "entry-id" }]);
  });

  test("passes teamId and input fields to DB query", async () => {
    const caller = createCaller(createTestContext());
    await caller.upsert({
      projectId: PROJECT_ID,
      start: "2026-03-21T08:00:00.000Z",
      stop: "2026-03-21T09:00:00.000Z",
      dates: ["2026-03-21"],
      duration: 3600,
    });

    expect(mocks.upsertTrackerEntries).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        teamId: "test-team-id",
        projectId: PROJECT_ID,
        start: "2026-03-21T08:00:00.000Z",
        stop: "2026-03-21T09:00:00.000Z",
        dates: ["2026-03-21"],
        duration: 3600,
      }),
    );
  });

  test("passes explicit assignedId when provided", async () => {
    const assignedId = "b2c3d4e5-6f7a-4b8c-9d0e-1f2a3b4c5d6e";
    const caller = createCaller(createTestContext());
    await caller.upsert({
      projectId: PROJECT_ID,
      start: "2026-03-21T08:00:00.000Z",
      stop: "2026-03-21T09:00:00.000Z",
      dates: ["2026-03-21"],
      duration: 3600,
      assignedId,
    });

    expect(mocks.upsertTrackerEntries).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        assignedId,
      }),
    );
  });
});

describe("tRPC: trackerEntries.delete", () => {
  beforeEach(() => {
    mocks.deleteTrackerEntry.mockReset();
    mocks.deleteTrackerEntry.mockImplementation(() => ({ id: "entry-id" }));
  });

  test("deletes entry successfully", async () => {
    const caller = createCaller(createTestContext());
    const result = await caller.delete({ id: ENTRY_ID });

    expect(result).toEqual({ id: "entry-id" });
  });

  test("passes teamId and id to DB query", async () => {
    const caller = createCaller(createTestContext());
    await caller.delete({ id: ENTRY_ID });

    expect(mocks.deleteTrackerEntry).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        teamId: "test-team-id",
        id: ENTRY_ID,
      }),
    );
  });

  test("handles different entry id", async () => {
    const otherId = "b2c3d4e5-6f7a-4b8c-9d0e-1f2a3b4c5d6e";
    mocks.deleteTrackerEntry.mockImplementation(() => ({ id: otherId }));

    const caller = createCaller(createTestContext());
    const result = await caller.delete({ id: otherId });

    expect(result?.id).toBe(otherId);
  });
});

describe("tRPC: trackerEntries.startTimer", () => {
  beforeEach(() => {
    mocks.startTimer.mockReset();
    mocks.startTimer.mockImplementation(() => ({
      id: "timer-id",
      project: null,
      trackerProject: null,
    }));
  });

  test("starts timer for project", async () => {
    const caller = createCaller(createTestContext());
    const result = await caller.startTimer({ projectId: PROJECT_ID });

    expect(result).toMatchObject({ id: "timer-id" });
  });

  test("passes teamId, projectId, and session user as assignedId", async () => {
    const caller = createCaller(createTestContext());
    await caller.startTimer({ projectId: PROJECT_ID });

    expect(mocks.startTimer).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        teamId: "test-team-id",
        projectId: PROJECT_ID,
        assignedId: "test-user-id",
      }),
    );
  });

  test("uses explicit assignedId when provided", async () => {
    const assignedId = "c4d5e6f7-8a9b-4c0d-be1f-2a3b4c5d6e7f";
    const caller = createCaller(createTestContext());
    await caller.startTimer({ projectId: PROJECT_ID, assignedId });

    expect(mocks.startTimer).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        assignedId,
      }),
    );
  });
});

describe("tRPC: trackerEntries.stopTimer", () => {
  beforeEach(() => {
    mocks.stopTimer.mockReset();
    mocks.stopTimer.mockImplementation(() => ({
      id: "timer-id",
      discarded: false,
      duration: 3600,
      project: undefined,
      trackerProject: undefined,
      start: "2026-03-21T08:00:00.000Z",
      stop: "2026-03-21T09:00:00.000Z",
      description: null,
    }));
  });

  test("stops timer", async () => {
    const caller = createCaller(createTestContext());
    const result = await caller.stopTimer({});

    expect(result).toMatchObject({ id: "timer-id", discarded: false });
  });

  test("passes teamId and session user as assignedId", async () => {
    const caller = createCaller(createTestContext());
    await caller.stopTimer({});

    expect(mocks.stopTimer).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        teamId: "test-team-id",
        assignedId: "test-user-id",
      }),
    );
  });

  test("passes entryId when provided", async () => {
    const caller = createCaller(createTestContext());
    await caller.stopTimer({ entryId: ENTRY_ID });

    expect(mocks.stopTimer).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        entryId: ENTRY_ID,
      }),
    );
  });
});

describe("tRPC: trackerEntries.getCurrentTimer", () => {
  beforeEach(() => {
    mocks.getCurrentTimer.mockReset();
    mocks.getCurrentTimer.mockImplementation(() => null);
  });

  test("returns null when no running timer", async () => {
    const caller = createCaller(createTestContext());
    const result = await caller.getCurrentTimer();

    expect(result).toBeNull();
  });

  test("passes teamId and assignedId from session", async () => {
    const caller = createCaller(createTestContext());
    await caller.getCurrentTimer();

    expect(mocks.getCurrentTimer).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        teamId: "test-team-id",
        assignedId: "test-user-id",
      }),
    );
  });

  test("returns timer when one is running", async () => {
    mocks.getCurrentTimer.mockImplementation(() => ({
      id: "timer-id",
      project: null,
      trackerProject: null,
    }));

    const caller = createCaller(createTestContext());
    const result = await caller.getCurrentTimer();

    expect(result).toMatchObject({ id: "timer-id" });
  });
});

describe("tRPC: trackerEntries.getTimerStatus", () => {
  beforeEach(() => {
    mocks.getTimerStatus.mockReset();
    mocks.getTimerStatus.mockImplementation(() => ({
      isRunning: false,
      currentEntry: null,
      elapsedTime: 0,
    }));
  });

  test("returns not running by default", async () => {
    const caller = createCaller(createTestContext());
    const result = await caller.getTimerStatus();

    expect(result).toMatchObject({
      isRunning: false,
      currentEntry: null,
      elapsedTime: 0,
    });
  });

  test("passes teamId and assignedId from session", async () => {
    const caller = createCaller(createTestContext());
    await caller.getTimerStatus();

    expect(mocks.getTimerStatus).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        teamId: "test-team-id",
        assignedId: "test-user-id",
      }),
    );
  });

  test("returns running status when timer is active", async () => {
    mocks.getTimerStatus.mockImplementation(() => ({
      isRunning: true,
      currentEntry: {
        id: "timer-id",
        start: "2026-03-21T08:00:00.000Z",
        description: null,
        projectId: PROJECT_ID,
        trackerProject: { id: PROJECT_ID, name: "Test" },
      },
      elapsedTime: 120,
    }));

    const caller = createCaller(createTestContext());
    const result = await caller.getTimerStatus();

    expect(result).toMatchObject({ isRunning: true, elapsedTime: 120 });
  });
});
