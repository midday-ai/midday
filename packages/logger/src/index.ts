import pino from "pino";
import type { Logger } from "pino";

/**
 * Check if we're in development mode
 */
const isDevelopment =
  process.env.NODE_ENV !== "production" && !process.env.FLY_APP_NAME;

/**
 * Create a pino logger instance with pretty printing in development
 */
function createLogger(): Logger {
  const baseConfig = {
    level: process.env.LOG_LEVEL || "info",
  };

  if (isDevelopment) {
    return pino({
      ...baseConfig,
      transport: {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "HH:MM:ss.l",
          ignore: "pid,hostname",
          messageFormat: "{msg}",
          hideObject: false,
          singleLine: false,
        },
      },
    });
  }

  return pino(baseConfig);
}

/**
 * Default logger instance
 */
export const logger = createLogger();

/**
 * Create a child logger with additional context
 * @param bindings - Key-value pairs to add to all log messages
 * @returns A new logger instance with the bindings
 *
 * @example
 * ```ts
 * const logger = createLogger({ component: "my-component" });
 * logger.info("Hello"); // Will include component: "my-component"
 * ```
 */
export function createLoggerWithContext(
  bindings: Record<string, unknown>,
): Logger {
  return logger.child(bindings);
}

export default logger;
