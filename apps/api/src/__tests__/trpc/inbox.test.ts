import { beforeEach, describe, expect, test } from "bun:test";
import { createCallerFactory } from "../../trpc/init";
import { inboxRouter } from "../../trpc/routers/inbox";
import {
  createInboxListResponse,
  createMinimalInboxResponse,
  createValidInboxResponse,
} from "../factories/inbox";
import { createTestContext } from "../helpers/test-context";
import { mocks } from "../setup";

const createCaller = createCallerFactory(inboxRouter);

describe("tRPC: inbox.get", () => {
  beforeEach(() => {
    mocks.getInbox.mockReset();
    mocks.getInbox.mockImplementation(() => createInboxListResponse());
  });

  test("returns inbox list", async () => {
    mocks.getInbox.mockImplementation(() =>
      createInboxListResponse([createValidInboxResponse()]),
    );

    const caller = createCaller(createTestContext());
    const result = await caller.get({});

    expect(result.data).toHaveLength(1);
    expect(result.meta.hasNextPage).toBe(false);
  });

  test("handles minimal inbox data", async () => {
    mocks.getInbox.mockImplementation(() =>
      createInboxListResponse([createMinimalInboxResponse()]),
    );

    const caller = createCaller(createTestContext());
    const result = await caller.get({});

    expect(result.data[0]!.transactionId).toBeNull();
  });

  test("handles empty list", async () => {
    mocks.getInbox.mockImplementation(() => createInboxListResponse([]));

    const caller = createCaller(createTestContext());
    const result = await caller.get({});

    expect(result.data).toHaveLength(0);
  });
});

describe("tRPC: inbox.getById", () => {
  beforeEach(() => {
    mocks.getInboxById.mockReset();
  });

  test("returns single inbox item", async () => {
    mocks.getInboxById.mockImplementation(() => createValidInboxResponse());

    const caller = createCaller(createTestContext());
    const result = await caller.getById({
      id: "a1b2c3d4-5e6f-4a7b-8c9d-0e1f2a3b4c5d",
    });

    expect(result?.id).toBe("a1b2c3d4-5e6f-4a7b-8c9d-0e1f2a3b4c5d");
  });

  test("returns null for non-existent item", async () => {
    mocks.getInboxById.mockImplementation(() => null);

    const caller = createCaller(createTestContext());
    const result = await caller.getById({
      id: "b2c3d4e5-6f7a-4b8c-9d0e-1f2a3b4c5d6e",
    });

    expect(result).toBeNull();
  });
});

describe("tRPC: inbox.update", () => {
  beforeEach(() => {
    mocks.updateInbox.mockReset();
    mocks.updateInbox.mockImplementation(() => createValidInboxResponse());
  });

  test("updates inbox item successfully", async () => {
    const caller = createCaller(createTestContext());
    const result = await caller.update({
      id: "a1b2c3d4-5e6f-4a7b-8c9d-0e1f2a3b4c5d",
      status: "done",
    });

    expect(result).toBeDefined();
  });
});

describe("tRPC: inbox.delete", () => {
  beforeEach(() => {
    mocks.deleteInbox.mockReset();
    mocks.deleteInbox.mockImplementation(() => ({
      id: "a1b2c3d4-5e6f-4a7b-8c9d-0e1f2a3b4c5d",
    }));
  });

  test("deletes inbox item successfully", async () => {
    const caller = createCaller(createTestContext());
    await caller.delete({ id: "a1b2c3d4-5e6f-4a7b-8c9d-0e1f2a3b4c5d" });
    expect(mocks.deleteInbox).toHaveBeenCalled();
  });
});

describe("tRPC: inbox.getByStatus", () => {
  beforeEach(() => {
    mocks.getInboxByStatus.mockReset();
    mocks.getInboxByStatus.mockImplementation(() => [
      { id: "item-1", displayName: "Test", status: "pending" },
    ]);
  });

  test("returns inbox items by status", async () => {
    const caller = createCaller(createTestContext());
    const result = await caller.getByStatus({ status: "pending" });

    expect(result).toHaveLength(1);
  });
});

const INBOX_NEW_ID = "b3b7c1e2-4c2a-4e7a-9c1a-2b7c1e24c2a4";

describe("tRPC: inbox.create", () => {
  beforeEach(() => {
    mocks.createInbox.mockReset();
    mocks.createInbox.mockImplementation(() =>
      Promise.resolve({ id: INBOX_NEW_ID }),
    );
  });

  test("creates inbox row from upload metadata", async () => {
    const caller = createCaller(createTestContext());
    const result = await caller.create({
      filename: "invoice.pdf",
      mimetype: "application/pdf",
      size: 2048,
      filePath: ["test-team-id", "inbox", "invoice.pdf"],
    });

    expect(result).toMatchObject({ id: INBOX_NEW_ID });
    expect(mocks.createInbox).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        teamId: "test-team-id",
        displayName: "invoice.pdf",
        fileName: "invoice.pdf",
        filePath: ["test-team-id", "inbox", "invoice.pdf"],
        contentType: "application/pdf",
        size: 2048,
        status: "processing",
      }),
    );
  });
});

describe("tRPC: inbox.deleteMany", () => {
  beforeEach(() => {
    mocks.deleteInboxMany.mockReset();
    mocks.deleteInboxMany.mockImplementation(() =>
      Promise.resolve([{ id: INBOX_NEW_ID, filePath: null }]),
    );
  });

  test("deletes multiple inbox items by id", async () => {
    const caller = createCaller(createTestContext());
    const result = await caller.deleteMany([INBOX_NEW_ID]);

    expect(result).toEqual([{ id: INBOX_NEW_ID, filePath: null }]);
    expect(mocks.deleteInboxMany).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        ids: [INBOX_NEW_ID],
        teamId: "test-team-id",
      }),
    );
  });
});

describe("tRPC: inbox.search", () => {
  beforeEach(() => {
    mocks.getInboxSearch.mockReset();
    mocks.getInboxSearch.mockImplementation(() => Promise.resolve([]));
  });

  test("searches inbox with query string", async () => {
    const caller = createCaller(createTestContext());
    const result = await caller.search({ q: "test" });

    expect(result).toEqual([]);
    expect(mocks.getInboxSearch).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        teamId: "test-team-id",
        q: "test",
        limit: 10,
      }),
    );
  });
});
