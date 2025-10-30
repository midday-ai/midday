import { createCacheBackend, createCachedFunction } from "@ai-sdk-tools/cache";

const backend = createCacheBackend({
  type: "lru",
  defaultTTL: 60 * 60 * 24,
});

export const cached = createCachedFunction(backend, {
  debug: process.env.NODE_ENV === "development",
});
