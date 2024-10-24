import { DatabaseClient } from "@/db";
import { DatabaseError, QueryError } from "@/errors";
import { env } from "cloudflare:test";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";


describe("DatabaseClient", () => {
    let mockD1Database: D1Database;
    let dbClient: DatabaseClient;

    beforeEach(() => {
        mockD1Database = env.DB
        dbClient = new DatabaseClient(env.DB);
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
});

