declare module "cloudflare:test" {
    import { Env } from "@/env";

    export const env: Env & {
        TEST_MIGRATIONS: any[];
    };
}
