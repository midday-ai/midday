declare module "cloudflare:test" {
    // Controls the type of `import("cloudflare:test").env`
    interface ProvidedEnv extends Env {
        TEST_MIGRATIONS: D1Migration[]; // Defined in `vitest.config.mts`
        DB: D1Database;
        KV: KVNamespace;
        STORAGE: R2Bucket;
        BANK_STATEMENTS: R2Bucket;
        RATE_LIMITER: RateLimit;
        ENGINE_BASE_URL: string;
    }
}
