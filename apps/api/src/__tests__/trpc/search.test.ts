import { beforeEach, describe, expect, test } from "bun:test";
import { createCallerFactory } from "../../trpc/init";
import { searchRouter } from "../../trpc/routers/search";
import { createTestContext } from "../helpers/test-context";
import { mocks } from "../setup";

const createCaller = createCallerFactory(searchRouter);

describe("tRPC: search.global", () => {
  beforeEach(() => {
    mocks.globalSearchQuery.mockReset();
    mocks.globalSemanticSearchQuery.mockReset();
    mocks.globalSearchQuery.mockImplementation(() => Promise.resolve([]));
    mocks.globalSemanticSearchQuery.mockImplementation(() =>
      Promise.resolve([]),
    );
  });

  test("returns empty search results for a single-word query", async () => {
    mocks.globalSearchQuery.mockImplementation(() => Promise.resolve([]));

    const caller = createCaller(createTestContext());
    const result = await caller.global({ searchTerm: "test" });

    expect(result).toEqual([]);
  });

  test("passes teamId to globalSearchQuery", async () => {
    mocks.globalSearchQuery.mockImplementation(() => Promise.resolve([]));

    const caller = createCaller(createTestContext());
    await caller.global({ searchTerm: "test" });

    expect(mocks.globalSearchQuery).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        teamId: "test-team-id",
        searchTerm: "test",
      }),
    );
  });

  test("forwards custom relevanceThreshold for single-word queries", async () => {
    mocks.globalSearchQuery.mockImplementation(() => Promise.resolve([]));

    const caller = createCaller(createTestContext());
    await caller.global({
      searchTerm: "test",
      relevanceThreshold: 0.42,
    });

    expect(mocks.globalSearchQuery).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        teamId: "test-team-id",
        searchTerm: "test",
        relevanceThreshold: 0.42,
      }),
    );
  });
});

describe("tRPC: search.attachments", () => {
  beforeEach(() => {
    mocks.getInboxSearch.mockReset();
    mocks.getInvoices.mockReset();
    mocks.getInboxSearch.mockImplementation(() => Promise.resolve([]));
    mocks.getInvoices.mockImplementation(() =>
      Promise.resolve({
        data: [],
        meta: { hasNextPage: false, hasPreviousPage: false },
      }),
    );
  });

  test("returns empty list when inbox and invoices have no matches", async () => {
    mocks.getInboxSearch.mockImplementation(() => Promise.resolve([]));
    mocks.getInvoices.mockImplementation(() =>
      Promise.resolve({
        data: [],
        meta: { hasNextPage: false, hasPreviousPage: false },
      }),
    );

    const caller = createCaller(createTestContext());
    const result = await caller.attachments({ q: "receipt" });

    expect(result).toEqual([]);
  });

  test("passes teamId to getInboxSearch and getInvoices", async () => {
    mocks.getInboxSearch.mockImplementation(() => Promise.resolve([]));
    mocks.getInvoices.mockImplementation(() =>
      Promise.resolve({
        data: [],
        meta: { hasNextPage: false, hasPreviousPage: false },
      }),
    );

    const caller = createCaller(createTestContext());
    await caller.attachments({ q: "receipt" });

    expect(mocks.getInboxSearch).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        teamId: "test-team-id",
        q: "receipt",
      }),
    );
    expect(mocks.getInvoices).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        teamId: "test-team-id",
        q: "receipt",
      }),
    );
  });

  test("maps inbox rows into attachment results", async () => {
    mocks.getInboxSearch.mockImplementation(() =>
      Promise.resolve([
        {
          id: "inbox-row-1",
          fileName: "scan.pdf",
          filePath: ["vault", "scan.pdf"],
          displayName: "Scan",
          amount: 100,
          currency: "USD",
          contentType: "application/pdf",
          date: "2024-06-01",
          size: 1024,
          description: null,
          status: "pending",
          website: null,
          baseAmount: null,
          baseCurrency: null,
          taxAmount: null,
          taxRate: null,
          taxType: null,
          createdAt: "2024-06-01T12:00:00.000Z",
        },
      ]),
    );
    mocks.getInvoices.mockImplementation(() =>
      Promise.resolve({
        data: [],
        meta: { hasNextPage: false, hasPreviousPage: false },
      }),
    );

    const caller = createCaller(createTestContext());
    const result = await caller.attachments({ q: "receipt", limit: 10 });

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual(
      expect.objectContaining({
        type: "inbox",
        id: "inbox-row-1",
        fileName: "scan.pdf",
        filePath: ["vault", "scan.pdf"],
        amount: 100,
        currency: "USD",
      }),
    );
    expect(mocks.getInboxSearch).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        limit: 10,
        q: "receipt",
      }),
    );
  });
});
