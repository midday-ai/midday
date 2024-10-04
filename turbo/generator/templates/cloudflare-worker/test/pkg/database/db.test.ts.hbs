import { DrizzleD1Database } from "drizzle-orm/d1";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DatabaseClient } from "../../../src/pkg/database/db";
import {
  DatabaseError,
  QueryError,
  TransactionError,
} from "../../../src/pkg/errors";

// Mock the drizzle function
vi.mock("drizzle-orm/d1", () => ({
  drizzle: vi.fn(() => mockDrizzleDb),
}));

const mockDrizzleDb = {
  transaction: vi.fn(),
};

describe("DatabaseClient", () => {
  let mockD1Database: D1Database;
  let dbClient: DatabaseClient;

  beforeEach(() => {
    mockD1Database = {
      prepare: vi.fn(),
      exec: vi.fn(),
      batch: vi.fn(),
      // Add other D1Database methods as needed
    } as unknown as D1Database;

    dbClient = new DatabaseClient(mockD1Database);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should initialize the database client", () => {
    expect(dbClient).toBeDefined();
  });

  it("should throw DatabaseError if getClient is called before initialization", () => {
    const uninitializedClient = new DatabaseClient(mockD1Database);
    (uninitializedClient as any).db = undefined; // Simulate uninitialized state

    expect(() => uninitializedClient.getClient()).toThrow(DatabaseError);
  });

  it("should throw QueryError if query execution fails", async () => {
    const mockQueryFn = vi.fn().mockRejectedValue(new Error("Query failed"));

    await expect(dbClient.executeQuery(mockQueryFn)).rejects.toThrow(
      QueryError,
    );
  });

  it("should throw TransactionError if transaction execution fails", async () => {
    const mockTransactionFn = vi
      .fn()
      .mockRejectedValue(new Error("Transaction failed"));
    mockDrizzleDb.transaction.mockImplementation((fn) => fn(mockDrizzleDb));

    await expect(
      dbClient.executeTransaction(mockTransactionFn),
    ).rejects.toThrow(TransactionError);
  });
});
