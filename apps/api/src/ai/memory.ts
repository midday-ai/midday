import { RedisProvider } from "@ai-sdk-tools/memory/redis";
import { createRedisAdapter } from "@midday/cache/bun-redis-adapter";

export const memoryProvider = new RedisProvider(
  createRedisAdapter() as unknown as Parameters<typeof RedisProvider>[0],
);
