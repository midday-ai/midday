/**
 * Imports required modules for defining the worker's project configuration and reading D1 migrations.
 * 
 * @module CloudflareVitestPoolWorkersConfig
 */
import {
    defineWorkersProject,
    readD1Migrations,
} from "@cloudflare/vitest-pool-workers/config";

import path from "node:path";

/**
 * Defines the worker's project using Cloudflare Vitest Pool Workers and reads migrations.
 * This function configures the testing environment and project settings for running tests 
 * in a Cloudflare Workers environment.
 * 
 * @async
 * @function defineWorkersProject
 * @returns {Promise<object>} - The test configuration object containing setup files, 
 * pool options, and service bindings for the test environment.
 */
export default defineWorkersProject(async () => {
    /**
     * Path to the directory where migration files are stored.
     * 
     * @constant {string} migrationsPath - The absolute path to the `migrations` directory.
     */
    const migrationsPath = path.join(__dirname, "migrations");

    /**
     * Reads all D1 migrations in the `migrations` directory.
     * 
     * @async
     * @function readD1Migrations
     * @param {string} migrationsPath - The path to the directory containing the migration files.
     * @returns {Promise<any>} - Returns a promise that resolves to the list of migration bindings.
     */
    const migrations = await readD1Migrations(migrationsPath);

    return {
        /**
         * Test environment configuration for Cloudflare Workers.
         * 
         * @property {object} test - Test configuration settings.
         * @property {Array<string>} setupFiles - An array of setup files to be executed before tests.
         * @property {object} poolOptions - Pool options for configuring worker instances.
         */
        test: {
            globals: true, // This allows using describe, it, etc. without importing them
            environment: 'node', // or 'jsdom' if you're testing browser code
            setupFiles: ["./test/apply-migrations.ts"],
            exclude: ["./src/integration/**", "./src/routes/**", "./src/benchmarks/**"],
            reporters: ["html", "verbose"],
            outputFile: "./.vitest/index.html",
            include: ["./**/*.test.ts", "./**/*.test.tsx"],
            alias: {
                "@/": new URL("./src/", import.meta.url).pathname,
            },
            /**
             * Pool options for worker configuration.
             * 
             * @property {object} workers - Configuration for worker instances in the test environment.
             * @property {boolean} singleWorker - Flag to indicate if only one worker should be used.
             * @property {object} wrangler - Configuration options for Wrangler, Cloudflare's CLI tool.
             * @property {string} configPath - Path to the Wrangler configuration file (`wrangler.toml`).
             * @property {object} miniflare - Miniflare configuration options for the test environment.
             */
            poolOptions: {
                workers: {
                    singleWorker: true,
                    isolatedStorage: false,
                    wrangler: {
                        configPath: "./wrangler.toml",
                        environment: "local",
                    },
                    miniflare: {
                        /**
                         * Compatibility flags to enable experimental features in Miniflare.
                         * 
                         * @property {Array<string>} compatibilityFlags - Flags to enable experimental features like `SELF.queue()`.
                         */
                        compatibilityFlags: ["service_binding_extra_handlers"],

                        /**
                         * Queue consumers configuration, used to specify the maximum batch timeout for the test queue.
                         * 
                         * @property {object} queueConsumers - Configuration for queue consumers.
                         * @property {object} queue - Queue configuration settings.
                         * @property {number} maxBatchTimeout - Maximum batch timeout for queue consumers (in seconds).
                         */
                        queueConsumers: {
                            queue: { maxBatchTimeout: 0.05 /* 50ms */ },
                        },

                        /**
                         * Service bindings for the worker, pulled from the Wrangler configuration file.
                         * 
                         * @property {object} bindings - Configuration of environment bindings used in the test environment.
                         * @property {any} TEST_MIGRATIONS - Migrations bindings for use in tests.
                         */
                        bindings: {
                            TEST_MIGRATIONS: migrations,
                        },
                        d1Databases: ['DB'],
                        kvNamespaces: ['KV'],
                        r2Buckets: ['STORAGE', 'BANK_STATEMENTS'],
                        rateLimits: ['RATE_LIMITER'],
                        fetchers: ['TELLER_CERT'],
                        queues: ['USER_ACTIONS_QUEUE'],
                        compatibilityDate: '2024-04-01',
                    },
                },
            },
        },
        /**
         * Configuration for module resolution and path aliases.
         * 
         * @property {object} resolve - Settings for resolving modules and paths.
         * @property {object} alias - An object containing path aliases for simplifying imports.
         * @property {string} alias["@"] - Path alias for the `src` directory.
         */
        resolve: {
            alias: {
                "@": path.resolve(__dirname, "./src"),
            },
        },
    };
});
