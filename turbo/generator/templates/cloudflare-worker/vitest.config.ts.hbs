import {
  defineWorkersProject,
  readD1Migrations,
} from "@cloudflare/vitest-pool-workers/config";
import path from "node:path";

export default defineWorkersProject(async () => {
  // Read all migrations in the `migrations` directory
  const migrationsPath = path.join(__dirname, "migrations");
  const migrations = await readD1Migrations(migrationsPath);

  return {
    test: {
      setupFiles: ["./test/apply-migrations.ts"],
      poolOptions: {
        isolatedStorage: true,
        main: "./src/index.ts",
        workers: {
          singleWorker: true,
          wrangler: {
            configPath: "./wrangler.toml",
          },
          miniflare: {
            // Required to use `SELF.queue()`. This is an experimental
            // compatibility flag, and cannot be enabled in production.
            compatibilityFlags: ["service_binding_extra_handlers"],
            // Use a shorter `max_batch_timeout` in tests
            queueConsumers: {
              queue: { maxBatchTimeout: 0.05 /* 50ms */ },
            },
            // Add a test-only binding for migrations, so we can apply them in a
            // setup file
            bindings: { TEST_MIGRATIONS: migrations },
          },
        },
      },
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
