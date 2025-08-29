import { checkHealth as checkDbHealth } from "@midday/db/utils/health";

export async function checkHealth(): Promise<void> {
  await checkDbHealth();
}
