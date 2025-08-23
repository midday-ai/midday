const pino = require("pino");

/**
 * Shared logger instance for consistent logging across all packages
 *
 * Features:
 * - Structured logging with JSON output
 * - Configurable log level via LOG_LEVEL environment variable
 * - Production-ready defaults
 *
 * @example
 * ```typescript
 * import { logger } from "@midday/logger";
 *
 * logger.info("User logged in", { userId: "123", email: "user@example.com" });
 * logger.error("Database connection failed", { error: error.message });
 * ```
 */
export const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  ...(process.env.NODE_ENV !== "production" && {
    transport: {
      target: "pino-pretty",
      options: {
        colorize: true,
        translateTime: "HH:MM:ss",
        ignore: "pid,hostname",
      },
    },
  }),
});

export default logger;
