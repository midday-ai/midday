/**
 * Check if we're in development mode
 */
const isDevelopment =
  process.env.NODE_ENV !== "production" && !process.env.FLY_APP_NAME;

/**
 * Simple logger interface
 */
interface SimpleLogger {
  info: (context: string, data?: object) => void;
  error: (context: string, data?: object) => void;
  warn: (context: string, data?: object) => void;
  debug: (context: string, data?: object) => void;
}

/**
 * Format log message for development
 */
function formatDevLog(level: string, context: string, data?: object): string {
  const timestamp = new Date().toISOString();
  const levelUpper = level.toUpperCase().padEnd(5);

  if (data) {
    return `[${timestamp}] ${levelUpper} [${context}] ${JSON.stringify(data, null, 2)}`;
  }

  return `[${timestamp}] ${levelUpper} [${context}]`;
}

/**
 * Format log message for production
 */
function formatProdLog(level: string, context: string, data?: object): string {
  const logEntry = {
    timestamp: new Date().toISOString(),
    level,
    context,
    ...(data && { data }),
  };

  return JSON.stringify(logEntry);
}

/**
 * Create a simple logger instance
 */
function createLogger(): SimpleLogger {
  const logLevel = process.env.LOG_LEVEL || "info";
  const levels = ["debug", "info", "warn", "error"];
  const currentLevelIndex = levels.indexOf(logLevel.toLowerCase());

  const shouldLog = (level: string): boolean => {
    const levelIndex = levels.indexOf(level.toLowerCase());
    return levelIndex >= currentLevelIndex;
  };

  return {
    info: (context: string, data?: object) => {
      if (!shouldLog("info")) return;
      const message = isDevelopment
        ? formatDevLog("info", context, data)
        : formatProdLog("info", context, data);
      console.log(message);
    },
    error: (context: string, data?: object) => {
      if (!shouldLog("error")) return;
      const message = isDevelopment
        ? formatDevLog("error", context, data)
        : formatProdLog("error", context, data);
      console.error(message);
    },
    warn: (context: string, data?: object) => {
      if (!shouldLog("warn")) return;
      const message = isDevelopment
        ? formatDevLog("warn", context, data)
        : formatProdLog("warn", context, data);
      console.warn(message);
    },
    debug: (context: string, data?: object) => {
      if (!shouldLog("debug")) return;
      const message = isDevelopment
        ? formatDevLog("debug", context, data)
        : formatProdLog("debug", context, data);
      console.log(message);
    },
  };
}

/**
 * Default logger instance
 */
export const logger = createLogger();

/**
 * Create a child logger with additional context
 * @param context - Context string to prepend to all log messages
 * @returns A new logger instance with the context
 *
 * @example
 * ```ts
 * const logger = createLoggerWithContext("my-component");
 * logger.info("Processing", { userId: 123 }); // Will log with "my-component" as context
 * ```
 */
export function createLoggerWithContext(context: string): SimpleLogger {
  return {
    info: (message: string, data?: object) => {
      logger.info(`${context}: ${message}`, data);
    },
    error: (message: string, data?: object) => {
      logger.error(`${context}: ${message}`, data);
    },
    warn: (message: string, data?: object) => {
      logger.warn(`${context}: ${message}`, data);
    },
    debug: (message: string, data?: object) => {
      logger.debug(`${context}: ${message}`, data);
    },
  };
}

export default logger;
