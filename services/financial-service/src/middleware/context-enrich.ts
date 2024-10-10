import { newId } from "@/analytics";
import { LoggerSingleton, LogSchema } from "@/logger";
import { Context, Next } from "hono";


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
    
    c.set('services', { logger });
    await next();
};