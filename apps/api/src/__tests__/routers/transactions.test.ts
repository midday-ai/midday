import { beforeEach, describe, expect, test } from "bun:test";
import { transactionsRouter } from "../../rest/routers/transactions";
import {
  createMalformedTransactionResponse,
  createMinimalTransactionResponse,
  createTransactionInput,
  createTransactionsListResponse,
  createTransactionWithAttachments,
  createTransactionWithCategory,
  createTransactionWithTags,
  createValidTransactionResponse,
} from "../factories/transaction";
import { createTestApp } from "../helpers";
import { mocks } from "../setup";

// Type for response JSON
interface TransactionListResponse {
  data: Array<{
    id: string;
    category: unknown;
    tags: unknown[] | null;
    attachments: unknown[] | null;
    [key: string]: unknown;
  }>;
  meta: {
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    cursor?: string;
  };
}

interface TransactionResponse {
  id: string;
  category?: { name: string } | null;
  status?: string;
  [key: string]: unknown;
}

function createApp() {
  const app = createTestApp();
  app.route("/transactions", transactionsRouter);
  return app;
}

describe("REST: GET /transactions", () => {
  const app = createApp();

  beforeEach(() => {
    mocks.getTransactions.mockReset();
    mocks.getTransactions.mockImplementation(() =>
      createTransactionsListResponse(),
    );
  });

  test("returns 200 with valid transaction data", async () => {
    mocks.getTransactions.mockImplementation(() =>
      createTransactionsListResponse([createValidTransactionResponse()]),
    );

    const res = await app.request("/transactions");

    expect(res.status).toBe(200);
    const json = (await res.json()) as TransactionListResponse;
    expect(json.data).toHaveLength(1);
    expect(json.meta.hasNextPage).toBe(false);
  });

  test("handles transactions with all nullable fields as null", async () => {
    mocks.getTransactions.mockImplementation(() =>
      createTransactionsListResponse([createMinimalTransactionResponse()]),
    );

    const res = await app.request("/transactions");

    expect(res.status).toBe(200);
    const json = (await res.json()) as TransactionListResponse;
    expect(json.data[0]!.category).toBeNull();
    expect(json.data[0]!.tags).toBeNull();
  });

  test("handles empty transaction list", async () => {
    mocks.getTransactions.mockImplementation(() =>
      createTransactionsListResponse([]),
    );

    const res = await app.request("/transactions");

    expect(res.status).toBe(200);
    const json = (await res.json()) as TransactionListResponse;
    expect(json.data).toEqual([]);
  });

  test("handles transactions with nested category", async () => {
    mocks.getTransactions.mockImplementation(() =>
      createTransactionsListResponse([createTransactionWithCategory()]),
    );

    const res = await app.request("/transactions");

    expect(res.status).toBe(200);
    const json = (await res.json()) as TransactionListResponse;
    expect(json.data[0]!.category).toBeDefined();
    expect((json.data[0]!.category as { name: string }).name).toBe(
      "Office Supplies",
    );
  });

  test("handles transactions with tags", async () => {
    mocks.getTransactions.mockImplementation(() =>
      createTransactionsListResponse([createTransactionWithTags()]),
    );

    const res = await app.request("/transactions");

    expect(res.status).toBe(200);
    const json = (await res.json()) as TransactionListResponse;
    expect(json.data[0]!.tags).toHaveLength(2);
  });

  test("handles transactions with attachments", async () => {
    mocks.getTransactions.mockImplementation(() =>
      createTransactionsListResponse([createTransactionWithAttachments()]),
    );

    const res = await app.request("/transactions");

    expect(res.status).toBe(200);
    const json = (await res.json()) as TransactionListResponse;
    expect(json.data[0]!.attachments).toHaveLength(1);
  });

  test("handles pagination metadata", async () => {
    mocks.getTransactions.mockImplementation(() =>
      createTransactionsListResponse([createValidTransactionResponse()], {
        cursor: "next-cursor",
        hasNextPage: true,
        hasPreviousPage: false,
      }),
    );

    const res = await app.request("/transactions");

    expect(res.status).toBe(200);
    const json = (await res.json()) as TransactionListResponse;
    expect(json.meta.hasNextPage).toBe(true);
    expect(json.meta.cursor).toBe("next-cursor");
  });

  test("returns 500 when DB returns malformed data", async () => {
    mocks.getTransactions.mockImplementation(() =>
      createTransactionsListResponse([
        createMalformedTransactionResponse() as any,
      ]),
    );

    const res = await app.request("/transactions");

    // validateResponse should throw, resulting in 500
    expect(res.status).toBe(500);
  });

  test("passes query parameters to DB query", async () => {
    mocks.getTransactions.mockImplementation(() =>
      createTransactionsListResponse([]),
    );

    await app.request("/transactions?type=expense&pageSize=10");

    expect(mocks.getTransactions).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        type: "expense",
        pageSize: 10,
        teamId: "test-team-id",
      }),
    );
  });
});

describe("REST: GET /transactions/:id", () => {
  const app = createApp();

  beforeEach(() => {
    mocks.getTransactionById.mockReset();
  });

  test("returns 200 for existing transaction", async () => {
    mocks.getTransactionById.mockImplementation(() =>
      createValidTransactionResponse(),
    );

    const res = await app.request(
      "/transactions/b3b7c8e2-1f2a-4c3d-9e4f-5a6b7c8d9e0f",
    );

    expect(res.status).toBe(200);
    const json = (await res.json()) as TransactionResponse;
    expect(json.id).toBe("b3b7c8e2-1f2a-4c3d-9e4f-5a6b7c8d9e0f");
  });

  test("handles transaction with nested category", async () => {
    mocks.getTransactionById.mockImplementation(() =>
      createTransactionWithCategory(),
    );

    const res = await app.request(
      "/transactions/b3b7c8e2-1f2a-4c3d-9e4f-5a6b7c8d9e0f",
    );

    expect(res.status).toBe(200);
    const json = (await res.json()) as TransactionResponse;
    expect(json.category?.name).toBe("Office Supplies");
  });

  test("returns 500 when DB returns malformed data", async () => {
    mocks.getTransactionById.mockImplementation(() =>
      createMalformedTransactionResponse(),
    );

    const res = await app.request(
      "/transactions/b3b7c8e2-1f2a-4c3d-9e4f-5a6b7c8d9e0f",
    );

    expect(res.status).toBe(500);
  });
});

describe("REST: POST /transactions", () => {
  const app = createApp();

  beforeEach(() => {
    mocks.createTransaction.mockReset();
    mocks.createTransaction.mockImplementation(() =>
      createValidTransactionResponse(),
    );
  });

  test("creates transaction with valid payload", async () => {
    const res = await app.request("/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(createTransactionInput()),
    });

    expect(res.status).toBe(200);
    const json = (await res.json()) as TransactionResponse;
    expect(json.id).toBeDefined();
  });

  test("returns 400 for missing required fields", async () => {
    const res = await app.request("/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Missing fields",
        // Missing: amount, currency, date, bankAccountId
      }),
    });

    expect(res.status).toBe(400);
  });

  test("returns 400 for invalid amount type", async () => {
    const res = await app.request("/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...createTransactionInput(),
        amount: "not-a-number",
      }),
    });

    expect(res.status).toBe(400);
  });

  test("passes correct data to DB query", async () => {
    const input = createTransactionInput();

    await app.request("/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });

    expect(mocks.createTransaction).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        name: input.name,
        amount: input.amount,
        currency: input.currency,
        teamId: "test-team-id",
      }),
    );
  });
});

describe("REST: PATCH /transactions/:id", () => {
  const app = createApp();

  beforeEach(() => {
    mocks.updateTransaction.mockReset();
    mocks.updateTransaction.mockImplementation(() =>
      createValidTransactionResponse(),
    );
  });

  test("updates transaction successfully", async () => {
    const res = await app.request(
      "/transactions/b3b7c8e2-1f2a-4c3d-9e4f-5a6b7c8d9e0f",
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Updated Name" }),
      },
    );

    expect(res.status).toBe(200);
  });

  test("updates transaction status", async () => {
    mocks.updateTransaction.mockImplementation(() =>
      createValidTransactionResponse({ status: "archived" }),
    );

    const res = await app.request(
      "/transactions/b3b7c8e2-1f2a-4c3d-9e4f-5a6b7c8d9e0f",
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "archived" }),
      },
    );

    expect(res.status).toBe(200);
    const json = (await res.json()) as TransactionResponse;
    expect(json.status).toBe("archived");
  });

  test("updates transaction category", async () => {
    await app.request("/transactions/b3b7c8e2-1f2a-4c3d-9e4f-5a6b7c8d9e0f", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ categorySlug: "office-supplies" }),
    });

    expect(mocks.updateTransaction).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        categorySlug: "office-supplies",
        teamId: "test-team-id",
      }),
    );
  });
});

describe("REST: DELETE /transactions/:id", () => {
  const app = createApp();

  beforeEach(() => {
    mocks.deleteTransactions.mockReset();
    mocks.deleteTransactions.mockImplementation(() => [
      { id: "b3b7c8e2-1f2a-4c3d-9e4f-5a6b7c8d9e0f" },
    ]);
  });

  test("deletes transaction successfully", async () => {
    const res = await app.request(
      "/transactions/b3b7c8e2-1f2a-4c3d-9e4f-5a6b7c8d9e0f",
      {
        method: "DELETE",
      },
    );

    expect(res.status).toBe(200);
    const json = (await res.json()) as TransactionResponse;
    expect(json.id).toBe("b3b7c8e2-1f2a-4c3d-9e4f-5a6b7c8d9e0f");
  });
});

describe("REST: POST /transactions/bulk", () => {
  const app = createApp();

  beforeEach(() => {
    mocks.createTransactions.mockReset();
    mocks.createTransactions.mockImplementation(() => [
      createValidTransactionResponse(),
    ]);
  });

  test("creates multiple transactions", async () => {
    const res = await app.request("/transactions/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify([
        createTransactionInput(),
        createTransactionInput(),
      ]),
    });

    expect(res.status).toBe(200);
  });

  test("returns 400 for empty array", async () => {
    const res = await app.request("/transactions/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify([]),
    });

    expect(res.status).toBe(400);
  });
});

describe("REST: DELETE /transactions/bulk", () => {
  const app = createApp();

  beforeEach(() => {
    mocks.deleteTransactions.mockReset();
    mocks.deleteTransactions.mockImplementation(() => [
      { id: "b3b7c8e2-1f2a-4c3d-9e4f-5a6b7c8d9e0f" },
      { id: "c4c8d9e3-2f3b-4d4e-9f5a-6b7c8d9e0f1a" },
    ]);
  });

  test("deletes multiple transactions", async () => {
    const res = await app.request("/transactions/bulk", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify([
        "b3b7c8e2-1f2a-4c3d-9e4f-5a6b7c8d9e0f",
        "c4c8d9e3-2f3b-4d4e-9f5a-6b7c8d9e0f1a",
      ]),
    });

    expect(res.status).toBe(200);
  });

  test("returns 400 for empty array", async () => {
    const res = await app.request("/transactions/bulk", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify([]),
    });

    expect(res.status).toBe(400);
  });

  test("returns 400 for invalid UUID", async () => {
    const res = await app.request("/transactions/bulk", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(["not-a-uuid"]),
    });

    expect(res.status).toBe(400);
  });
});
