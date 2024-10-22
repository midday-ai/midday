import { TaskContext, test } from "vitest";
import { APIKeyRepository } from "@/data/apiKeyRepository";
import { IntegrationHarness } from "@/test-util/integration-harness";
import * as cloudflareTest from "cloudflare:test";

test("should create and read API key", async (t: TaskContext) => {
    // const h = await IntegrationHarness.init(t, env.DB);
    // console.log("task bindings", JSON.stringify(t, null, 2));
    // const apiKeyRepository = new APIKeyRepository(h.db);
    // console.log(apiKeyRepository);
    console.log(cloudflareTest.env.DB);
});
