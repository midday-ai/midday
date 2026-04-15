import { getConnectionOptions } from "@midday/job-client";
import { createLoggerWithContext } from "@midday/logger";

const logger = createLoggerWithContext("compute:config");

const isProduction =
  process.env.NODE_ENV === "production" ||
  process.env.RAILWAY_ENVIRONMENT === "production";

export function getRedisConnection() {
  const baseOptions = getConnectionOptions();

  return {
    ...baseOptions,
    connectTimeout: isProduction ? 15000 : 5000,
    retryStrategy: (times: number) => {
      const delay = Math.min(1000 * 2 ** times, 20000);
      if (times > 5) {
        logger.info(
          `[Redis/Compute] Reconnecting in ${delay}ms (attempt ${times})`,
        );
      }
      return delay;
    },
    reconnectOnError: (err: Error) => {
      if (err.message.includes("READONLY")) {
        logger.info(
          "[Redis/Compute] READONLY error detected, reconnecting",
        );
        return true;
      }
      if (
        err.message.includes("timed out") ||
        err.message.includes("ETIMEDOUT")
      ) {
        logger.info("[Redis/Compute] Timeout error detected, reconnecting");
        return true;
      }
      return false;
    },
  };
}

export const AGENT_LIMITS = {
  maxToolCalls: 50,
  maxLlmCalls: 10,
  memoryLimitMb: 64,
  cpuTimeLimitMs: 30_000,
} as const;
