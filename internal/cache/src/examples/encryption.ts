// This example has relative imports to do type checks, you need to import from "@unkey/cache"
import { createCache, DefaultStatefulContext, Namespace } from ".."; // @unkey/cache
import { withEncryption } from "../middleware"; // @unkey/cache/middleware
import { CloudflareStore, MemoryStore } from "../stores"; // @unkey/cache/stores

/**
 * Define the type of your data, or perhaps generate the types from your database
 */
type User = {
  id: string;
  email: string;
};
async function main() {
  /**
   * In serverless you'd get this from the request handler
   * See https://unkey.com/docs/libraries/ts/cache/overview#context
   */
  const ctx = new DefaultStatefulContext();

  const memory = new MemoryStore({ persistentMap: new Map() });

  /**
   * @see https://unkey.com/docs/libraries/ts/cache/overview#cloudflare
   */
  const cloudflare = new CloudflareStore({
    domain: "cache.unkey.dev",
    zoneId: process.env.CLOUDFLARE_ZONE_ID!,
    cloudflareApiKey: process.env.CLOUDFLARE_API_KEY!,
  });

  /**
   * Create an encryption middleware that wraps the cloudflare cache.
   * All data is now encrypted before writing to the underlying data store and decrypted before
   * getting returned.
   */
  const middleware = await withEncryption(process.env.CACHE_ENCRYPTION_KEY!);
  const encryptedCloudflare = middleware.wrap(cloudflare);

  const userNamespace = new Namespace<User>(ctx, {
    stores: [memory, encryptedCloudflare],
    fresh: 60_000, // Data is fresh for 60 seconds
    stale: 300_000, // Data is stale for 300 seconds
  });

  const cache = createCache({ user: userNamespace });

  await cache.user.set("userId", { id: "userId", email: "user@email.com" });
  const user = await cache.user.get("userId");
  console.info(user);
}

main();
