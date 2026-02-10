import { beforeEach, describe, expect, test } from "bun:test";
// Import after mocking (mocks are set up via preload)
import { createCallerFactory } from "../../trpc/init";
import { transactionsRouter } from "../../trpc/routers/transactions";
import {
  createMinimalTransactionResponse,
  createTransactionInput,
  createTransactionsListResponse,
  createTransactionWithCategory,
  createValidTransactionResponse,
} from "../factories/transaction";
import { createTestContext } from "../helpers/test-context";
import { mocks } from "../setup";

// Create a test caller
const createCaller = createCallerFactory(transactionsRouter);

describe("tRPC: transactions.get", () => {
  beforeEach(() => {
    mocks.getTransactions.mockReset();
    mocks.getTransactions.mockImplementation(() =>
      createTransactionsListResponse(),
    );
  });

  test("returns transactions list", async () => {
    mocks.getTransactions.mockImplementation(() =>
      createTransactionsListResponse([createValidTransactionResponse()]),
    );

    const caller = createCaller(createTestContext());
    const result = await caller.get({});

    expect(result.data).toHaveLength(1);
    expect(result.meta.hasNextPage).toBe(false);
  });

  test("handles minimal transaction data", async () => {
    mocks.getTransactions.mockImplementation(() =>
      createTransactionsListResponse([createMinimalTransactionResponse()]),
    );

    const caller = createCaller(createTestContext());
    const result = await caller.get({});

    expect(result.data[0]!.category).toBeNull();
  });

  test("handles empty list", async () => {
    mocks.getTransactions.mockImplementation(() =>
      createTransactionsListResponse([]),
    );

    const caller = createCaller(createTestContext());
    const result = await caller.get({});

    expect(result.data).toHaveLength(0);
  });

  test("filters by type", async () => {
    mocks.getTransactions.mockImplementation(() =>
      createTransactionsListResponse([]),
    );

    const caller = createCaller(createTestContext());
    await caller.get({ type: "expense" });

    expect(mocks.getTransactions).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ type: "expense", teamId: "test-team-id" }),
    );
  });

  test("handles pagination parameters", async () => {
    mocks.getTransactions.mockImplementation(() =>
      createTransactionsListResponse([createValidTransactionResponse()], {
        cursor: "next-cursor",
        hasNextPage: true,
      }),
    );

    const caller = createCaller(createTestContext());
    const result = await caller.get({ pageSize: 10 });

    expect(result.meta.hasNextPage).toBe(true);
    expect(result.meta.cursor).toBe("next-cursor");
  });

  test("handles transactions with category", async () => {
    mocks.getTransactions.mockImplementation(() =>
      createTransactionsListResponse([createTransactionWithCategory()]),
    );

    const caller = createCaller(createTestContext());
    const result = await caller.get({});

    expect(result.data[0]!.category).toBeDefined();
    expect(result.data[0]!.category?.name).toBe("Office Supplies");
  });
});

describe("tRPC: transactions.getById", () => {
  beforeEach(() => {
    mocks.getTransactionById.mockReset();
  });

  test("returns single transaction", async () => {
    mocks.getTransactionById.mockImplementation(() =>
      createValidTransactionResponse(),
    );

    const caller = createCaller(createTestContext());
    const result = await caller.getById({
      id: "b3b7c8e2-1f2a-4c3d-9e4f-5a6b7c8d9e0f",
    });

    expect(result?.id).toBe("b3b7c8e2-1f2a-4c3d-9e4f-5a6b7c8d9e0f");
  });

  test("returns null for non-existent transaction", async () => {
    mocks.getTransactionById.mockImplementation(() => null);

    const caller = createCaller(createTestContext());
    const result = await caller.getById({
      id: "c4c8d9e3-2f3b-5d4e-9f5a-6b7c8d9e0f1a",
    });

    expect(result).toBeNull();
  });

  test("passes correct parameters to DB query", async () => {
    mocks.getTransactionById.mockImplementation(() =>
      createValidTransactionResponse(),
    );

    const caller = createCaller(createTestContext());
    await caller.getById({ id: "d5d9e0f4-3a4c-6e5f-af6b-7c8d9e0f1a2b" });

    expect(mocks.getTransactionById).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        id: "d5d9e0f4-3a4c-6e5f-af6b-7c8d9e0f1a2b",
        teamId: "test-team-id",
      }),
    );
  });
});

describe("tRPC: transactions.create", () => {
  beforeEach(() => {
    mocks.createTransaction.mockReset();
    mocks.createTransaction.mockImplementation(() =>
      createValidTransactionResponse(),
    );
  });

  test("creates transaction with valid data", async () => {
    const caller = createCaller(createTestContext());
    const result = await caller.create(createTransactionInput());

    expect(result).toBeDefined();
    expect(result?.id).toBe("b3b7c8e2-1f2a-4c3d-9e4f-5a6b7c8d9e0f");
  });

  test("passes teamId to DB query", async () => {
    const caller = createCaller(createTestContext());
    await caller.create(createTransactionInput());

    expect(mocks.createTransaction).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        teamId: "test-team-id",
      }),
    );
  });
});

describe("tRPC: transactions.update", () => {
  beforeEach(() => {
    mocks.updateTransaction.mockReset();
    mocks.updateTransaction.mockImplementation(() =>
      createValidTransactionResponse(),
    );
  });

  test("updates transaction successfully", async () => {
    const caller = createCaller(createTestContext());
    const result = await caller.update({
      id: "b3b7c8e2-1f2a-4c3d-9e4f-5a6b7c8d9e0f",
      name: "Updated Name",
    });

    expect(result).toBeDefined();
  });

  test("updates transaction status", async () => {
    mocks.updateTransaction.mockImplementation(() =>
      createValidTransactionResponse({ status: "archived" }),
    );

    const caller = createCaller(createTestContext());
    const result = await caller.update({
      id: "b3b7c8e2-1f2a-4c3d-9e4f-5a6b7c8d9e0f",
      status: "archived",
    });

    expect(result?.status).toBe("archived");
  });

  test("passes userId to DB query", async () => {
    const caller = createCaller(createTestContext());
    await caller.update({
      id: "e6e0f1a5-4b5d-7f6a-ba7c-8d9e0f1a2b3c",
      name: "Updated",
    });

    expect(mocks.updateTransaction).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        userId: "test-user-id",
        teamId: "test-team-id",
      }),
    );
  });
});

describe("tRPC: transactions.updateMany", () => {
  beforeEach(() => {
    mocks.updateTransactions.mockReset();
    mocks.updateTransactions.mockImplementation(() => ({
      data: [createValidTransactionResponse()],
      meta: {},
    }));
  });

  test("updates multiple transactions", async () => {
    const caller = createCaller(createTestContext());
    const result = await caller.updateMany({
      ids: ["id-1", "id-2"],
      status: "completed",
    });

    expect(result).toBeDefined();
  });

  test("passes all IDs to DB query", async () => {
    const caller = createCaller(createTestContext());
    await caller.updateMany({
      ids: ["id-1", "id-2", "id-3"],
      categorySlug: "office",
    });

    expect(mocks.updateTransactions).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        ids: ["id-1", "id-2", "id-3"],
        categorySlug: "office",
      }),
    );
  });
});

describe("tRPC: transactions.deleteMany", () => {
  beforeEach(() => {
    mocks.deleteTransactions.mockReset();
    mocks.deleteTransactions.mockImplementation(() => [
      { id: "a1a2b3c4-5d6e-4f8a-9b0c-1d2e3f4a5b6c" },
      { id: "b2b3c4d5-6e7f-4a9b-8c1d-2e3f4a5b6c7d" },
    ]);
  });

  test("deletes multiple transactions", async () => {
    const caller = createCaller(createTestContext());
    const result = await caller.deleteMany([
      "a1a2b3c4-5d6e-4f8a-9b0c-1d2e3f4a5b6c",
      "b2b3c4d5-6e7f-4a9b-8c1d-2e3f4a5b6c7d",
    ]);

    expect(result).toHaveLength(2);
  });

  test("passes teamId to DB query", async () => {
    const caller = createCaller(createTestContext());
    await caller.deleteMany(["c3c4d5e6-7f8a-4b0c-9d2e-3f4a5b6c7d8e"]);

    expect(mocks.deleteTransactions).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        teamId: "test-team-id",
      }),
    );
  });
});

describe("tRPC: transactions.getReviewCount", () => {
  beforeEach(() => {
    mocks.getTransactionsReadyForExportCount.mockReset();
    mocks.getTransactionsReadyForExportCount.mockImplementation(() => 5);
  });

  test("returns review count", async () => {
    const caller = createCaller(createTestContext());
    const result = await caller.getReviewCount();

    expect(result).toBe(5);
  });
});

describe("tRPC: transactions.getSimilarTransactions", () => {
  beforeEach(() => {
    mocks.getSimilarTransactions.mockReset();
    mocks.getSimilarTransactions.mockImplementation(() => []);
  });

  test("returns similar transactions", async () => {
    mocks.getSimilarTransactions.mockImplementation(() => [
      createValidTransactionResponse(),
    ]);

    const caller = createCaller(createTestContext());
    const result = await caller.getSimilarTransactions({ name: "Office" });

    expect(result).toHaveLength(1);
  });

  test("passes correct parameters to DB query", async () => {
    const caller = createCaller(createTestContext());
    await caller.getSimilarTransactions({
      name: "Office Supplies",
      categorySlug: "office",
    });

    expect(mocks.getSimilarTransactions).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        name: "Office Supplies",
        categorySlug: "office",
        teamId: "test-team-id",
      }),
    );
  });
});

describe("tRPC: transactions.searchTransactionMatch", () => {
  beforeEach(() => {
    mocks.searchTransactionMatch.mockReset();
    mocks.searchTransactionMatch.mockImplementation(() => []);
  });

  test("returns matching transactions", async () => {
    mocks.searchTransactionMatch.mockImplementation(() => [
      { transaction: createValidTransactionResponse(), score: 0.9 },
    ]);

    const caller = createCaller(createTestContext());
    const result = await caller.searchTransactionMatch({ query: "office" });

    expect(result).toHaveLength(1);
  });
});

describe("tRPC: transactions.moveToReview", () => {
  beforeEach(() => {
    mocks.moveTransactionToReview.mockReset();
    mocks.moveTransactionToReview.mockImplementation(() => ({}));
  });

  test("moves transaction to review", async () => {
    const caller = createCaller(createTestContext());
    const result = await caller.moveToReview({
      transactionId: "b3b7c8e2-1f2a-4c3d-9e4f-5a6b7c8d9e0f",
    });

    expect(result.success).toBe(true);
  });

  test("passes correct parameters to DB query", async () => {
    const caller = createCaller(createTestContext());
    await caller.moveToReview({
      transactionId: "f7f1a2b6-5c6e-4a7b-8b8d-9e0f1a2b3c4d",
    });

    expect(mocks.moveTransactionToReview).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        transactionId: "f7f1a2b6-5c6e-4a7b-8b8d-9e0f1a2b3c4d",
        teamId: "test-team-id",
      }),
    );
  });
});
