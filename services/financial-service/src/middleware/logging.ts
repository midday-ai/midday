import { logger } from "hono/logger";
import { logger as customLogger } from "../utils/logger";

/**
 * Logging middleware
 *
 * @description Logs incoming requests using a custom logger
 */
export const loggingMiddleware = logger(customLogger);