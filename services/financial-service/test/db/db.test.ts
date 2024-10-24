import { DatabaseClient } from "@/db/client";
import { DatabaseError, QueryError, TransactionError } from "@/errors";
import { HonoEnv } from "@/hono/env";
import { D1Database, D1Result } from "@cloudflare/workers-types";
import { env } from "cloudflare:test";
import { DrizzleD1Database } from "drizzle-orm/d1";
import { Context } from "hono";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("DatabaseClient", () => {
    let mockD1Database: D1Database;
    let mockHonoContext: Context<HonoEnv>;
    let dbClient: DatabaseClient;

    beforeEach(() => {
        // Create a more complete mock D1Database
        mockD1Database = {
            prepare: vi.fn(),
            dump: vi.fn(),
            batch: vi.fn(),
            exec: vi.fn(),
            transaction: vi.fn(async (fn) => {
                // Mock successful transaction execution
                const mockTx = {
                    execute: vi.fn().mockResolvedValue({ success: true } as D1Result<unknown>),
                };
                return await fn(mockTx);
            }),
        } as unknown as D1Database;

        // Mock Hono context
        mockHonoContext = {
            env: {
                DB: mockD1Database,
            },
        } as Context<HonoEnv>;

        dbClient = new DatabaseClient(mockD1Database);
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe("Initialization", () => {
        it("should initialize the database client with D1Database", () => {
            const client = new DatabaseClient(mockD1Database);
            expect(client).toBeDefined();
            expect(client.getClient()).toBeDefined();
        });

        it("should initialize the database client with HonoContext", () => {
            const client = new DatabaseClient(mockHonoContext);
            expect(client).toBeDefined();
            expect(client.getClient()).toBeDefined();
        });

        it("should throw DatabaseError when initialized with invalid input", () => {
            expect(() => new DatabaseClient({} as D1Database)).toThrow(DatabaseError);
        });
    });

    describe("Client Operations", () => {
        it("should throw DatabaseError if getClient is called before initialization", () => {
            const uninitializedClient = new DatabaseClient(mockD1Database);
            (uninitializedClient as any).db = undefined; // Simulate uninitialized state

            expect(() => uninitializedClient.getClient()).toThrow(DatabaseError);
        });

        it("should initialize database if getClient is called with new D1Database", async () => {
            const client = new DatabaseClient(mockD1Database);
            (client as any).db = undefined; // Simulate uninitialized state

            const newMockDb = {
                ...mockD1Database,
                prepare: vi.fn(),
            } as unknown as D1Database;

            await expect(async () => {
                const result = client.getClient(newMockDb);
                expect(result).toBeDefined();
            }).not.toThrow();
        });
    });

    describe("Query Execution", () => {
        it("should successfully execute a query", async () => {
            const mockQueryResult = { id: 1, name: "Test" };
            const mockQueryFn = vi.fn().mockResolvedValue(mockQueryResult);

            const result = await dbClient.executeQuery(mockQueryFn);

            expect(result).toEqual(mockQueryResult);
            expect(mockQueryFn).toHaveBeenCalled();
        });

        it("should throw QueryError if query execution fails", async () => {
            const mockQueryFn = vi.fn().mockRejectedValue(new Error("Query failed"));

            await expect(dbClient.executeQuery(mockQueryFn)).rejects.toThrow(
                QueryError,
            );
        });

        it("should handle query errors with unknown error types", async () => {
            const mockQueryFn = vi.fn().mockRejectedValue("Unknown error");

            await expect(dbClient.executeQuery(mockQueryFn)).rejects.toThrow(
                QueryError,
            );
        });
    });

    describe("Transaction Execution", () => {
        it("should successfully execute a transaction", async () => {
            // Mock the drizzle instance
            const mockDrizzleDB = {
                transaction: vi.fn().mockImplementation(async (fn) => {
                    const mockTx = {
                        // Add mock methods that your transaction might use
                        execute: vi.fn().mockResolvedValue({ success: true }),
                        query: vi.fn().mockResolvedValue({ success: true }),
                    };
                    return await fn(mockTx);
                }),
            } as unknown as DrizzleD1Database<any>;

            // Replace the internal db instance with our mock
            (dbClient as any).db = mockDrizzleDB;

            const mockTransactionResult = { success: true };
            const mockTransactionFn = vi.fn().mockResolvedValue(mockTransactionResult);

            const result = await dbClient.executeTransaction(mockTransactionFn);

            expect(result).toEqual(mockTransactionResult);
            expect(mockTransactionFn).toHaveBeenCalled();
            expect(mockDrizzleDB.transaction).toHaveBeenCalled();
        });

        it("should throw TransactionError if transaction execution fails", async () => {
            // Mock the drizzle instance with a failing transaction
            const mockDrizzleDB = {
                transaction: vi.fn().mockRejectedValue(new Error("Transaction failed")),
            } as unknown as DrizzleD1Database<any>;

            // Replace the internal db instance with our mock
            (dbClient as any).db = mockDrizzleDB;

            const mockTransactionFn = vi.fn();

            await expect(dbClient.executeTransaction(mockTransactionFn)).rejects.toThrow(
                TransactionError,
            );
        });

        it("should handle transaction errors with unknown error types", async () => {
            // Mock the drizzle instance with a failing transaction
            const mockDrizzleDB = {
                transaction: vi.fn().mockRejectedValue("Unknown error"),
            } as unknown as DrizzleD1Database<any>;

            // Replace the internal db instance with our mock
            (dbClient as any).db = mockDrizzleDB;

            const mockTransactionFn = vi.fn();

            await expect(dbClient.executeTransaction(mockTransactionFn)).rejects.toThrow(
                TransactionError,
            );
        });
    });

    describe("Database Initialization Methods", () => {
        it("should initialize database using initDB method", () => {
            const client = new DatabaseClient(mockD1Database);
            const result = client.initDB(mockD1Database);

            expect(result).toBeDefined();
        });

        it("should return existing database instance when calling initDB", () => {
            const client = new DatabaseClient(mockD1Database);
            const firstInit = client.initDB(mockD1Database);
            const secondInit = client.initDB(mockD1Database);

            expect(firstInit).toBe(secondInit);
        });

        it("should initialize database using getDB method", () => {
            const client = new DatabaseClient(mockD1Database);
            const result = client.getDB(mockHonoContext);

            expect(result).toBeDefined();
        });

        it("should return existing database instance when calling getDB", () => {
            const client = new DatabaseClient(mockD1Database);
            const firstGet = client.getDB(mockHonoContext);
            const secondGet = client.getDB(mockHonoContext);

            expect(firstGet).toBe(secondGet);
        });
    });
});