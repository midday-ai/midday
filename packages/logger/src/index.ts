import pino from "pino";
import type { Context } from "hono";
import type { MiddlewareHandler } from "hono";

export const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  serializers: {
    req: pino.stdSerializers.req,
    res: pino.stdSerializers.res,
    err: pino.stdSerializers.err,
  },
  // Use pretty printing in development, structured JSON in production
  ...(process.env.NODE_ENV === "development" && {
    transport: {
      target: "pino-pretty",
      options: {
        colorize: true,
        translateTime: "HH:MM:ss Z",
        ignore: "pid,hostname",
        messageFormat: "{levelName} - {msg}",
        hideObject: false,
        singleLine: false,
      },
    },
  }),
});

// HTTP request logger middleware for Hono
export const httpLogger = (): MiddlewareHandler => {
  return async (context: Context, next) => {
    const start = process.hrtime.bigint();
    
    // Use pino's req serializer-compatible format
    const req = {
      method: context.req.method,
      url: context.req.url,
      headers: Object.fromEntries(context.req.raw.headers.entries()),
      remoteAddress: context.req.header('x-forwarded-for') || context.req.header('x-real-ip'),
    };

    logger.info({ req }, 'incoming request');
    
    await next();
    
    const duration = Number(process.hrtime.bigint() - start) / 1000000; // Convert to ms
    
    logger.info({ 
      req: { method: req.method, url: req.url },
      statusCode: context.res.status,
      headers: Object.fromEntries(context.res.headers.entries()),
      responseTime: duration,
    }, 'request completed');
  };
};

export default logger;
