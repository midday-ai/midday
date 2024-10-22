import { z } from "zod";

/**
 * Defines the environment variables required for connecting to the database.
 * 
 * This schema ensures that the environment variables `DATABASE_HOST`, `DATABASE_USERNAME`, and 
 * `DATABASE_PASSWORD` are correctly defined and provides default values if they are not present in the environment.
 * 
 * - `DATABASE_HOST`: The host URL of the database. Defaults to `localhost:3900`.
 * - `DATABASE_USERNAME`: The username for accessing the database. Defaults to `unkey`.
 * - `DATABASE_PASSWORD`: The password for accessing the database. Defaults to `password`.
 * 
 * @example
 * ```typescript
 * const config = databaseEnv.parse(process.env);
 * console.log(config.DATABASE_HOST); // "localhost:3900" or the value in the environment
 * ```
 */
export const databaseEnv = z.object({
    DATABASE_HOST: z.string().default("localhost:3900"),
    DATABASE_USERNAME: z.string().default("unkey"),
    DATABASE_PASSWORD: z.string().default("password"),
});

/**
 * Defines the environment variables for the integration testing environment.
 * 
 * This merges the `databaseEnv` schema with additional environment variables required for integration testing.
 * 
 * - `ENGINE_BASE_URL`: The base URL for the testing engine. Must be a valid URL and defaults to `http://localhost:8787`.
 * 
 * @example
 * ```typescript
 * const config = integrationTestEnv.parse(process.env);
 * console.log(config.ENGINE_BASE_URL); // "http://localhost:8787" or the value in the environment
 * ```
 */
export const integrationTestEnv = databaseEnv.merge(
    z.object({
        ENGINE_BASE_URL: z.string().url().default("http://localhost:8787"),
    }),
);

/**
 * Defines the environment variables for the benchmark testing environment.
 * 
 * This merges the `databaseEnv` schema with additional environment variables specific to benchmark testing.
 * 
 * - `PLANETFALL_URL`: The URL for the Planetfall service. Must be a valid URL and is required.
 * - `PLANETFALL_API_KEY`: The API key for authenticating with the Planetfall service. Required.
 * - `ENGINE_BASE_URL`: The base URL for the engine service. Must be a valid URL and is required.
 * 
 * @example
 * ```typescript
 * const config = benchmarkTestEnv.parse(process.env);
 * console.log(config.PLANETFALL_URL); // A valid URL as set in the environment
 * ```
 */
export const benchmarkTestEnv = databaseEnv.merge(
    z.object({
        PLANETFALL_URL: z.string().url(),
        PLANETFALL_API_KEY: z.string(),
        ENGINE_BASE_URL: z.string().url(),
    }),
);