import { beforeEach, describe, expect, test } from "bun:test";
import { createCallerFactory } from "../../trpc/init";
import { insightsRouter } from "../../trpc/routers/insights";
import { createTestContext } from "../helpers/test-context";
import { mocks } from "../setup";

const INSIGHT_ID = "c4d7e8f9-a0b1-4223-b534-667788990abb";

const createCaller = createCallerFactory(insightsRouter);

describe("tRPC: insights.list", () => {
  beforeEach(() => {
    mocks.getInsightsForUser.mockReset();
    mocks.getInsightsForUser.mockImplementation(() =>
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

  test("returns insights for weekly period", async () => {
    const caller = createCaller(createTestContext());
    const result = await caller.list({ periodType: "weekly" });

    expect(result.data).toEqual([]);
    expect(mocks.getInsightsForUser).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        teamId: "test-team-id",
        userId: "test-user-id",
        periodType: "weekly",
        status: "completed",
      }),
    );
  });

  test("rejects invalid period type", async () => {
    const caller = createCaller(createTestContext());

    await expect(
      caller.list({ periodType: "daily" as "weekly" }),
    ).rejects.toThrow();
  });
});

describe("tRPC: insights.latest", () => {
  beforeEach(() => {
    mocks.getLatestInsight.mockReset();
    mocks.getLatestInsight.mockImplementation(() => Promise.resolve(null));
  });

  test("returns null when no completed insight exists", async () => {
    const caller = createCaller(createTestContext());

    expect(await caller.latest({})).toBeNull();
    expect(mocks.getLatestInsight).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ teamId: "test-team-id" }),
    );
  });

  test("rejects invalid period type", async () => {
    const caller = createCaller(createTestContext());

    await expect(
      caller.latest({ periodType: "daily" as "weekly" }),
    ).rejects.toThrow();
  });
});

describe("tRPC: insights.byId", () => {
  beforeEach(() => {
    mocks.getInsightById.mockReset();
    mocks.getInsightById.mockImplementation(() =>
      Promise.resolve({
        id: INSIGHT_ID,
        teamId: "test-team-id",
        title: "Weekly snapshot",
        content: {
          title: "Hook",
          summary: "Summary",
          story: "Story",
          actions: [],
        },
        periodType: "weekly",
        periodYear: 2024,
        periodNumber: 12,
        periodStart: "2024-03-18",
        periodEnd: "2024-03-24",
        status: "completed",
        currency: "USD",
        selectedMetrics: null,
        audioPath: null,
        generatedAt: "2024-03-24T10:00:00.000Z",
        createdAt: "2024-03-24T10:00:00.000Z",
        updatedAt: "2024-03-24T10:00:00.000Z",
      }),
    );
  });

  test("returns insight when found", async () => {
    const caller = createCaller(createTestContext());
    const result = await caller.byId({ id: INSIGHT_ID });

    expect(result).toMatchObject({
      id: INSIGHT_ID,
      title: "Weekly snapshot",
      content: expect.objectContaining({
        title: "Hook",
        summary: "Summary",
        story: "Story",
      }),
    });
    expect(mocks.getInsightById).toHaveBeenCalledWith(expect.anything(), {
      id: INSIGHT_ID,
      teamId: "test-team-id",
    });
  });

  test("throws NOT_FOUND when insight does not exist", async () => {
    mocks.getInsightById.mockImplementation(() => Promise.resolve(null));

    const caller = createCaller(createTestContext());

    await expect(caller.byId({ id: INSIGHT_ID })).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  });
});

describe("tRPC: insights.markAsRead", () => {
  beforeEach(() => {
    mocks.getInsightById.mockReset();
    mocks.markInsightAsRead.mockReset();
    mocks.getInsightById.mockImplementation(() =>
      Promise.resolve({
        id: INSIGHT_ID,
        teamId: "test-team-id",
        title: "T",
        content: null,
        periodType: "weekly",
        periodYear: 2024,
        periodNumber: 1,
        periodStart: "2024-01-01",
        periodEnd: "2024-01-07",
        status: "completed",
        currency: null,
        selectedMetrics: null,
        audioPath: null,
        generatedAt: null,
        createdAt: "2024-01-01T00:00:00.000Z",
        updatedAt: "2024-01-01T00:00:00.000Z",
      }),
    );
    mocks.markInsightAsRead.mockImplementation(() =>
      Promise.resolve({ readAt: new Date("2024-06-01T12:00:00.000Z") }),
    );
  });

  test("marks insight as read for current user", async () => {
    const caller = createCaller(createTestContext());
    const result = await caller.markAsRead({ id: INSIGHT_ID });

    expect(result).toMatchObject({
      success: true,
      readAt: expect.anything(),
    });
    expect(mocks.markInsightAsRead).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        insightId: INSIGHT_ID,
        userId: "test-user-id",
      }),
    );
  });

  test("throws NOT_FOUND when insight does not exist", async () => {
    mocks.getInsightById.mockImplementation(() => Promise.resolve(null));

    const caller = createCaller(createTestContext());

    await expect(caller.markAsRead({ id: INSIGHT_ID })).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  });
});

describe("tRPC: insights.byPeriod", () => {
  beforeEach(() => {
    mocks.getInsightByPeriod.mockReset();
    mocks.getInsightByPeriod.mockImplementation(() =>
      Promise.resolve({
        id: INSIGHT_ID,
        title: "Week 12",
        teamId: "test-team-id",
        periodType: "weekly",
        periodYear: 2026,
        periodNumber: 12,
      }),
    );
  });

  test("returns insight for calendar period", async () => {
    const caller = createCaller(createTestContext());
    const result = await caller.byPeriod({
      periodType: "weekly",
      periodYear: 2026,
      periodNumber: 12,
    });

    expect(result).toMatchObject({
      id: INSIGHT_ID,
      title: "Week 12",
    });
    expect(mocks.getInsightByPeriod).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        teamId: "test-team-id",
        periodType: "weekly",
        periodYear: 2026,
        periodNumber: 12,
      }),
    );
  });
});

describe("tRPC: insights.dismiss", () => {
  beforeEach(() => {
    mocks.getInsightById.mockReset();
    mocks.dismissInsight.mockReset();
    mocks.getInsightById.mockImplementation(() =>
      Promise.resolve({
        id: INSIGHT_ID,
        teamId: "test-team-id",
        title: "T",
        content: null,
        periodType: "weekly",
        periodYear: 2026,
        periodNumber: 12,
        periodStart: "2026-03-16",
        periodEnd: "2026-03-22",
        status: "completed",
        currency: null,
        selectedMetrics: null,
        audioPath: null,
        generatedAt: null,
        createdAt: "2026-03-01T00:00:00.000Z",
        updatedAt: "2026-03-01T00:00:00.000Z",
      }),
    );
    mocks.dismissInsight.mockImplementation(() =>
      Promise.resolve({
        insightId: INSIGHT_ID,
        userId: "test-user-id",
        dismissedAt: new Date("2026-03-21T12:00:00.000Z"),
      }),
    );
  });

  test("dismisses insight for current user", async () => {
    const caller = createCaller(createTestContext());
    const result = await caller.dismiss({ id: INSIGHT_ID });

    expect(result.success).toBe(true);
    expect(result.dismissedAt).toBeInstanceOf(Date);
    expect(mocks.dismissInsight).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        insightId: INSIGHT_ID,
        userId: "test-user-id",
      }),
    );
  });
});
