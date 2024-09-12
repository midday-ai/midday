// This example has relative imports to do type checks, you need to import from "@unkey/cache"
import { createCache, DefaultStatefulContext, Namespace } from ".."; // @unkey/cache
import { CloudflareStore, MemoryStore } from "../stores"; // @unkey/cache/stores

/**
 * In serverless you'd get this from the request handler
 * See https://unkey.com/docs/libraries/ts/cache/overview#context
 */
const ctx = new DefaultStatefulContext();

/**
 * Define the type of your data, or perhaps generate the types from your database
 */
type User = {
  id: string;
  email: string;
};

const memory = new MemoryStore({ persistentMap: new Map() });

/**
 * @see https://unkey.com/docs/libraries/ts/cache/overview#cloudflare
 */
const cloudflare = new CloudflareStore({
  domain: "cache.unkey.dev",
  zoneId: process.env.CLOUDFLARE_ZONE_ID!,
  cloudflareApiKey: process.env.CLOUDFLARE_API_KEY!,
});

const userNamespace = new Namespace<User>(ctx, {
  /**
   * Specifying first `memory`, then `cloudflare` will automatically check both stores in order
   * If a value is found in memory, it is returned, else it will check cloudflare, and if it's found
   * in cloudflare, the value is backfilled to memory.
   */
  stores: [memory, cloudflare],
  fresh: 60_000, // Data is fresh for 60 seconds
  stale: 300_000, // Data is stale for 300 seconds
});

const cache = createCache({ user: userNamespace });

async function main() {
  await cache.user.set("userId", { id: "userId", email: "user@email.com" });

  const user = await cache.user.get("userId");

  console.info(user);
}

main();
