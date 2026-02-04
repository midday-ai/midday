import { beforeEach, describe, expect, mock, test } from "bun:test";
import {
  createInboxListResponse,
  createMinimalInboxResponse,
  createValidInboxResponse,
} from "../factories/inbox";
import { createTestContext } from "../helpers/test-context";

// Create local mocks for inbox tests
const mockGetInbox = mock(() => createInboxListResponse());
const mockGetInboxById = mock(
  () => null as ReturnType<typeof createValidInboxResponse> | null,
);
const mockUpdateInbox = mock(() => ({}));
const mockDeleteInbox = mock(() => ({}));
const mockDeleteInboxMany = mock(() => [] as Array<{ id: string }>);
const mockGetInboxByStatus = mock(() => [] as any[]);

// Mock the module
mock.module("@midday/db/queries", () => ({
  getInbox: mockGetInbox,
  getInboxById: mockGetInboxById,
  createInbox: mock(() => ({})),
  updateInbox: mockUpdateInbox,
  deleteInbox: mockDeleteInbox,
  deleteInboxMany: mockDeleteInboxMany,
  getInboxByStatus: mockGetInboxByStatus,
  getInboxSearch: mock(() => []),
  getInboxBlocklist: mock(() => []),
  createInboxBlocklist: mock(() => ({})),
  deleteInboxBlocklist: mock(() => ({})),
  checkInboxAttachments: mock(() => []),
  matchTransaction: mock(() => ({})),
  unmatchTransaction: mock(() => ({})),
  confirmSuggestedMatch: mock(() => ({})),
  declineSuggestedMatch: mock(() => ({})),
  deleteInboxEmbedding: mock(() => ({})),
}));

// Import after mocking
const { createCallerFactory } = await import("../../trpc/init");
const { inboxRouter } = await import("../../trpc/routers/inbox");

// Create a test caller
const createCaller = createCallerFactory(inboxRouter);

describe("tRPC: inbox.get", () => {
  beforeEach(() => {
    mockGetInbox.mockReset();
    mockGetInbox.mockImplementation(() => createInboxListResponse());
  });

  test("returns inbox list", async () => {
    mockGetInbox.mockImplementation(() =>
      createInboxListResponse([createValidInboxResponse()]),
    );

    const caller = createCaller(createTestContext());
    const result = await caller.get({});

    expect(result.data).toHaveLength(1);
    expect(result.meta.hasNextPage).toBe(false);
  });

  test("handles minimal inbox data", async () => {
    mockGetInbox.mockImplementation(() =>
      createInboxListResponse([createMinimalInboxResponse()]),
    );

    const caller = createCaller(createTestContext());
    const result = await caller.get({});

    expect(result.data[0]!.transactionId).toBeNull();
  });

  test("handles empty list", async () => {
    mockGetInbox.mockImplementation(() => createInboxListResponse([]));

    const caller = createCaller(createTestContext());
    const result = await caller.get({});

    expect(result.data).toHaveLength(0);
  });
});

describe("tRPC: inbox.getById", () => {
  beforeEach(() => {
    mockGetInboxById.mockReset();
  });

  test("returns single inbox item", async () => {
    mockGetInboxById.mockImplementation(() => createValidInboxResponse());

    const caller = createCaller(createTestContext());
    const result = await caller.getById({
      id: "a1b2c3d4-5e6f-4a7b-8c9d-0e1f2a3b4c5d",
    });

    expect(result?.id).toBe("a1b2c3d4-5e6f-4a7b-8c9d-0e1f2a3b4c5d");
  });

  test("returns null for non-existent item", async () => {
    mockGetInboxById.mockImplementation(() => null);

    const caller = createCaller(createTestContext());
    const result = await caller.getById({
      id: "b2c3d4e5-6f7a-4b8c-9d0e-1f2a3b4c5d6e",
    });

    expect(result).toBeNull();
  });
});

describe("tRPC: inbox.update", () => {
  beforeEach(() => {
    mockUpdateInbox.mockReset();
    mockUpdateInbox.mockImplementation(() => createValidInboxResponse());
  });

  test("updates inbox item successfully", async () => {
    const caller = createCaller(createTestContext());
    const result = await caller.update({
      id: "a1b2c3d4-5e6f-4a7b-8c9d-0e1f2a3b4c5d",
      status: "done", // Use valid enum value
    });

    expect(result).toBeDefined();
  });
});

describe("tRPC: inbox.delete", () => {
  beforeEach(() => {
    mockDeleteInbox.mockReset();
    mockDeleteInbox.mockImplementation(() => ({
      id: "a1b2c3d4-5e6f-4a7b-8c9d-0e1f2a3b4c5d",
    }));
  });

  test("deletes inbox item successfully", async () => {
    const caller = createCaller(createTestContext());
    // inbox.delete returns void, so we just check it doesn't throw
    await caller.delete({ id: "a1b2c3d4-5e6f-4a7b-8c9d-0e1f2a3b4c5d" });
    expect(mockDeleteInbox).toHaveBeenCalled();
  });
});

describe("tRPC: inbox.getByStatus", () => {
  beforeEach(() => {
    mockGetInboxByStatus.mockReset();
    mockGetInboxByStatus.mockImplementation(() => [
      { id: "item-1", displayName: "Test", status: "pending" },
    ]);
  });

  test("returns inbox items by status", async () => {
    const caller = createCaller(createTestContext());
    const result = await caller.getByStatus({ status: "pending" });

    expect(result).toHaveLength(1);
  });
});
