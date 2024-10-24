import type { TaskContext } from "vitest";
import { DrizzleDB, initDB } from "../db/client";
import { Env } from "@/env";

/**
 * The `Harness` class provides an abstract base for testing environments that require
 * database access and setup/teardown functionality. It handles the initialization
 * of the database connection and provides methods for seeding data and performing
 * teardown operations after tests are finished.
 *
 * @abstract
 */
export abstract class Harness {

    /**
     * The database instance initialized using the `DrizzleDB` library.
     * This instance is used for all database operations within the test harness.
     *
     * @type {DrizzleDB}
     */
    public readonly db: DrizzleDB;

    /**
     * Constructs a new `Harness` instance, initializing the database connection using the
     * environment bindings from the provided `TaskContext`. It also sets up a listener
     * that ensures `teardown` is called after the test is completed.
     *
     * @param {TaskContext<HonoEnv>} t - The test execution context provided by Vitest, which includes `HonoEnv`.
     * The context provides access to environment bindings, such as the database connection, through `t.task.Bindings.DB`.
     */
    constructor(t: TaskContext, db: D1Database) {
        this.db = initDB(db);

        // Set up an event listener to ensure teardown is called after the test is finished
        t.onTestFinished(async () => {
            await this.teardown();
        });
    }

    /**
     * Teardown method that is executed after each test finishes. This is meant to be
     * overridden by subclasses if any cleanup is needed after tests. By default, it does nothing.
     *
     * @returns {Promise<void>} - A promise that resolves when the teardown is complete.
     * @private
     */
    private async teardown(): Promise<void> { }

    /**
     * Seed method that can be used to insert initial data into the database before tests are run.
     * This is meant to be overridden by subclasses to provide test-specific seed data.
     * By default, this method does nothing.
     *
     * @returns {Promise<void>} - A promise that resolves when the seeding is complete.
     * @protected
     */
    protected async seed(): Promise<void> {
        // Example: Insert initial data into the database before tests
        // await this.db.insert(schema.workspaces).values(this.resources.unkeyWorkspace);
    }
}