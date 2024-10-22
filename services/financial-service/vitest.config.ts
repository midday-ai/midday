import path from "node:path";
import {
    defineWorkersProject,
    readD1Migrations,
} from "@cloudflare/vitest-pool-workers/config";
import { D1Database, R2Bucket } from "@cloudflare/workers-types/experimental";

export default defineWorkersProject(async () => {
    // Read all migrations in the `migrations` directory
    const migrationsPath = path.join(__dirname, "migrations");
    const migrations = await readD1Migrations(migrationsPath);

    return {
        test: {
            setupFiles: ["./test/apply-migrations.ts"],
            poolOptions: {
                workers: {
                    singleWorker: true,
                    wrangler: {
                        configPath: "./wrangler.toml",
                        environment: "production",
                    },
                    miniflare: {
                        // Add a test-only binding for migrations, so we can apply them in a
                        // setup file
                        bindings: {
                            TEST_MIGRATIONS: migrations,
                            DB: D1Database,
                            STORAGE: R2Bucket,
                            BANK_STATEMENTS: R2Bucket
                        },
                    },
                },
            },
            types: ["@cloudflare/workers-types", "cloudflare:test"],
        },
    };
});
