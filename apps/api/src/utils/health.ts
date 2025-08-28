import { checkHealth as checkRedisHealth } from "@midday/cache/health";
import { checkHealth as checkDbHealth } from "@midday/db/utils/health";

export async function checkHealth(): Promise<void> {
  await Promise.all([checkDbHealth(), checkRedisHealth()]);
}
