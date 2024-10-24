import { DatabaseError, QueryError, TransactionError } from "@/errors";
import { HonoEnv } from "@/hono/env";
import { D1Database } from "@cloudflare/workers-types";
import { ExtractTablesWithRelations } from "drizzle-orm";
import { drizzle, DrizzleD1Database } from "drizzle-orm/d1";
import { SQLiteTransaction } from "drizzle-orm/sqlite-core";
import { Context as HonoContext } from "hono";
import * as schema from "./schema";

// Use a single schema import and type
export type Schema = typeof schema;

// Consistent use of DrizzleD1Database type
export type DrizzleDB = DrizzleD1Database<Schema>;

/**
 * Database client class that handles initialization, transactions, and queries.
 */
export class DatabaseClient {
  protected db: DrizzleDB | undefined;

  /**
   * Initializes the database client with either a D1Database or a HonoContext.
   * @param dbOrContext - Either a D1Database instance or a HonoContext with HonoEnv.
   * @throws {DatabaseError} If there's an error initializing the database client.
   */
  public constructor(
    dbOrContext: D1Database | HonoContext<HonoEnv> | DrizzleDB,
  ) {
    if ("env" in dbOrContext && "DB" in dbOrContext.env) {
      this.initialize(dbOrContext.env.DB);
    } else if (
      "prepare" in dbOrContext &&
      typeof dbOrContext.prepare === "function"
    ) {
      // Check for a method that D1Database should have
      this.initialize(dbOrContext as D1Database);
    } else if ("all" in dbOrContext && typeof dbOrContext.all === "function") {
      // This is likely a DrizzleDB instance
      this.db = dbOrContext as DrizzleDB;
    } else {
      throw new DatabaseError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Invalid database or context provided",
      });
    }
  }

  /**
   * Initializes the database client.
   * @param db - The D1Database instance.
   * @throws {DatabaseError} If there's an error initializing the database client.
   */
  private async initialize(db: D1Database): Promise<void> {
    try {
      this.db = drizzle(db, { schema });
    } catch (error) {
      throw new DatabaseError({
        code: "INTERNAL_SERVER_ERROR",
        message: `Failed to initialize database client: ${error instanceof Error ? error.message : "Unknown error"}`,
      });
    }
  }

  /**
   * Gets the Drizzle database client.
   * @param db - Optional D1Database instance to initialize the client if not already initialized.
   * @returns The DrizzleD1Database instance.
   * @throws {DatabaseError} If the database client is not initialized.
   */
  public getClient(db?: D1Database): DrizzleDB {
    if (!this.db) {
      if (!db) {
        throw new DatabaseError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database client is not initialized",
        });
      }
      this.initialize(db);
    }

    return this.db as DrizzleDB;
  }

  /**
   * Helper function to execute a database query with enhanced error handling.
   *
   * @param queryFn - A function that performs the database query.
   * @returns A Promise that resolves to the query result.
   * @throws {QueryError} If there's an error executing the query.
   *
   * @example
   * const result = await executeQuery(db, async (db) => {
   *   return db.select().from(users).where(eq(users.id, userId));
   * });
   */
  public async executeQuery<T>(
    queryFn: (db: DrizzleDB) => Promise<T>,
  ): Promise<T> {
    try {
      return await queryFn(this.getClient());
    } catch (error) {
      const queryString =
        error instanceof Error ? error.message : "Unknown query";
      console.error("Database query error:", error);
      throw new QueryError({
        code: "INTERNAL_SERVER_ERROR",
        message: `Failed to execute query: ${queryString}`,
      });
    }
  }

  /**
   * Helper function to perform a database transaction with enhanced error handling.
   *
   * @param transactionFn - A function that performs the database operations within a transaction.
   * @returns A Promise that resolves to the transaction result.
   * @throws {TransactionError} If there's an error during the transaction.
   *
   * @example
   * const result = await executeTransaction(db, async (tx) => {
   *   await tx.insert(users).values({ name: 'John Doe', email: 'john@example.com' });
   *   await tx.insert(posts).values({ userId: 1, title: 'My First Post' });
   *   return { success: true };
   * });
   */
  public async executeTransaction<T>(
    transactionFn: (
      tx: SQLiteTransaction<
        "async",
        D1Result<unknown>,
        typeof schema,
        ExtractTablesWithRelations<typeof schema>
      >,
    ) => Promise<T>,
  ): Promise<T> {
    try {
      return await this.getClient().transaction(async (tx) => {
        return await transactionFn(tx);
      });
    } catch (error) {
      console.error("Transaction error:", error);
      throw new TransactionError({
        code: "INTERNAL_SERVER_ERROR",
        message: `Failed to execute transaction: ${error instanceof Error ? error.message : "Unknown transaction error"}`,
      });
    }
  }

  /**
   * Initializes the Drizzle database using a provided D1Database.
   * If the `db` is already initialized, it returns the current instance
   * instead of re-initializing it.
   * This method replaces the previous initDB function.
   *
   * @param d1 - The D1Database instance.
   * @returns {DrizzleDB} The initialized or current Drizzle database instance.
   */
  public initDB(d1: D1Database): DrizzleDB {
    // Check if the database is already initialized
    if (this.db) {
      return this.db;
    }

    // Initialize the database if not already initialized
    this.db = drizzle(d1, { schema });
    return this.db;
  }

  /**
   * Initializes and returns the Drizzle database using the context's environment.
   * If the `db` is already initialized, it returns the current instance.
   * This method replaces the previous getDB function.
   *
   * @param context - The HonoContext that contains the environment configuration.
   * @returns {DrizzleDB} The initialized or current Drizzle database instance.
   */
  public getDBOrInitialize(context: HonoContext<HonoEnv>): DrizzleDB {
    // Check if the database is already initialized
    if (this.db) {
      return this.db;
    }

    // Initialize the database using the environment's DB if not already initialized
    this.db = drizzle(context.env.DB, { schema });
    return this.db;
  }

  public getDb(): DrizzleDB {
    if (!this.db) {
      throw new DatabaseError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Database client is not initialized",
      });
    }

    return this.db;
  }
}
