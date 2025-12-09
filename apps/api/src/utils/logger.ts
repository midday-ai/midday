import { logger } from "@midday/logger";
import type { Context, MiddlewareHandler } from "hono";

export const httpLogger = (): MiddlewareHandler => {
  return async (context: Context, next) => {
    const start = process.hrtime.bigint();

    const method = context.req.method;
    const url = context.req.url;
    const path = new URL(url).pathname;

    logger.info(`${method} ${path} - incoming request`);

    await next();

    const duration = Number(process.hrtime.bigint() - start) / 1000000; // Convert to ms
    const statusCode = context.res.status;

    logger.info(
      `${method} ${path} ${statusCode} - completed in ${duration.toFixed(2)}ms`,
    );
  };
};
