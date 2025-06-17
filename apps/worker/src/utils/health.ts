import { redisConnection } from "@worker/config/redis";

export async function getHealthCheck() {
  try {
    await redisConnection.ping();

    return {
      status: "ok",
    };
  } catch (error) {
    throw new Error(
      `Queue health check failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}
