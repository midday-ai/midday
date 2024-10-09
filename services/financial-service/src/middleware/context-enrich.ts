import { newId } from "@/analytics";
import { ServiceContext } from "@/common/bindings";
import { initDB } from "@/db";
import { LoggerSingleton, LogSchema } from "@/logger";
import { Context, Next } from "hono";

/**
 * These maps persist between worker executions and are used for caching
 */
const rlMap = new Map();

/**
 * workerId and coldStartAt are used to track the lifetime of the worker
 * and are set once when the worker is first initialized.
 *
 * subsequent requests will use the same workerId and coldStartAt
 */
let isolateId: string | undefined = undefined;

export const enrichContext = async (c: Context, next: Next) => {
    if (!isolateId) {
        isolateId = crypto.randomUUID();
    }

    c.set("isolateId", isolateId);
    c.set("isolateCreatedAt", Date.now());
    const requestId = newId("request");
    c.set("requestId", requestId);

    c.res.headers.set("API-Request-Id", requestId);

    const logger = LoggerSingleton.getInstance(requestId, {
        environment: c.env.ENVIRONMENT as LogSchema["environment"],
        application: "api",
        defaultFields: { environment: c.env.ENVIRONMENT },
    });
    
    c.set('services', { db: initDB(c.env.DB), logger } as ServiceContext);
    await next();
};