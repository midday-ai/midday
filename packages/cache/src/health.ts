import { RedisCache } from "./redis-client";

export async function checkHealth(): Promise<void> {
  const healthChecker = new RedisCache("health", 0);
  await healthChecker.healthCheck();
}
