import pino from "pino";

/**
 * Check if we're in pretty mode
 */
const isPretty = process.env.LOG_PRETTY === "true";

/**
 * Create the base pino logger instance
 */
const baseLogger = pino({
  level: process.env.LOG_LEVEL || "info",
  serializers: {
    req: pino.stdSerializers.req,
    res: pino.stdSerializers.res,
    err: pino.stdSerializers.err,
  },
  // Use pretty printing in development, structured JSON in production
  ...(isPretty && {
    transport: {
      target: "pino-pretty",
      options: {
        colorize: true,
        translateTime: "HH:MM:ss",
        ignore: "pid,hostname",
        messageFormat: "{msg}",
        hideObject: false,
        singleLine: false,
        useLevelLabels: true,
        levelFirst: true,
      },
    },
  }),
});

/**
 * Create a logger adapter that wraps pino to match the existing API
 */
function createLoggerAdapter(pinoLogger: pino.Logger, prefixContext?: string) {
  // Format context with brackets if not already formatted
  const formatContext = (ctx?: string): string => {
    if (!ctx) return "";
    // If already has brackets, use as-is, otherwise wrap in brackets
    if (ctx.startsWith("[") && ctx.endsWith("]")) {
      return ctx;
    }
    return `[${ctx}]`;
  };

  const formattedContext = formatContext(prefixContext);

  return {
    info: (message: string, data?: object) => {
      try {
        const fullMessage = formattedContext
          ? `${formattedContext} ${message}`
          : message;
        if (data) {
          pinoLogger.info(data, fullMessage);
        } else {
          pinoLogger.info(fullMessage);
        }
      } catch (error) {
        // Silently ignore logger stream errors to prevent crashes
        // This can happen when pino-pretty transport's stream is closing
      }
    },
    error: (message: string, data?: object) => {
      try {
        const fullMessage = formattedContext
          ? `${formattedContext} ${message}`
          : message;
        if (data) {
          pinoLogger.error(data, fullMessage);
        } else {
          pinoLogger.error(fullMessage);
        }
      } catch (error) {
        // Silently ignore logger stream errors to prevent crashes
        // This can happen when pino-pretty transport's stream is closing
      }
    },
    warn: (message: string, data?: object) => {
      try {
        const fullMessage = formattedContext
          ? `${formattedContext} ${message}`
          : message;
        if (data) {
          pinoLogger.warn(data, fullMessage);
        } else {
          pinoLogger.warn(fullMessage);
        }
      } catch (error) {
        // Silently ignore logger stream errors to prevent crashes
        // This can happen when pino-pretty transport's stream is closing
      }
    },
    debug: (message: string, data?: object) => {
      try {
        const fullMessage = formattedContext
          ? `${formattedContext} ${message}`
          : message;
        if (data) {
          pinoLogger.debug(data, fullMessage);
        } else {
          pinoLogger.debug(fullMessage);
        }
      } catch (error) {
        // Silently ignore logger stream errors to prevent crashes
        // This can happen when pino-pretty transport's stream is closing
      }
    },
  };
}

/**
 * Default logger instance
 */
export const logger = createLoggerAdapter(baseLogger);

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
export function createLoggerWithContext(context: string) {
  const childLogger = baseLogger.child({ context });
  return createLoggerAdapter(childLogger, context);
}

export default logger;
