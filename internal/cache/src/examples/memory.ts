// This example has relative imports to do type checks, you need to import from "@unkey/cache"
import { createCache, DefaultStatefulContext, Namespace } from ".."; // @unkey/cache
import { MemoryStore } from "../stores"; // @unkey/cache/stores

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

const userNamespace = new Namespace<User>(ctx, {
  stores: [memory],
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
