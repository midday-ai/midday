<div align="center">
    <h1 align="center">@unkey/cache</h1>
    <h5>Cache all the things</h5>
</div>

<div align="center">
  <a href="https://unkey.com/docs/libraries/ts/cache/overview">Documentation</a>
</div>
<br/>

Battle-tested, strongly typed caching with metrics and tracing out of the box.

## Features

- Tiered caching
- Memory Cache
- Cloudflare Cache
- Cloudflare KV (todo)
- Cloudflare R2 (todo)
- Emit metrics

## Quickstart

```bash
npm install @internal/cache
```

```ts
import { createCache, DefaultStatefulContext } from "@internal/cache";
import { MemoryStore, CloudflareStore } from "@internal/cache/stores";

// Only required in stateful environments.
// Cloudflare workers or Vercel provide an executionContext for you.
const ctx = new DefaultStatefulContext();

type User = {
  id: string;
  email: string;
};

type Post = {
  slug: string;
  title: string;
  content: string;
  publishedAt: Date;
};

const fresh = 60_000;
const stale = 900_000;

const ctx = new DefaultStatefulContext();

const memory = new MemoryStore({
  persistentMap: new Map(),
});

const cloudflare = new CloudflareStore({
  cloudflareApiKey: "CLOUDFLARE_API_KEY",
  zoneId: "CLOUDFLARE_ZONE_ID",
  domain: "my-domain-on-cloudflare",
});
const cache = createCache({
  account: new Namespace<Account>(ctx, {
    stores: [memory],
    fresh,
    stale,
  }),
  user: new Namespace<User>(ctx, {
    stores: [memory, cloudflare],
    fresh,
    stale,
  }),
});

await cache.user.set("chronark", { id: "chronark", email: "iykyk" });

// This is fully typesafe and will check the stores in the above defined order.
const user = await cache.user.get("chronark");
```

### Stale while revalidate with origin refresh

Add your database query and the cache will return the stale data while revalidating the data in the background.

```ts
const user = await cache.user.swr("chronark", async (id) => {
  return await db.query.users.findFirst({
    where: (table, { eq }) => eq(table.id, id),
  });
});
```

### Documentation

[Read the full documentation](https://unkey.com/docs/libraries/ts/cache/overview)
