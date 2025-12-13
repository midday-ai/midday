import type { Context } from "@api/rest/types";
import { OpenAPIHono } from "@hono/zod-openapi";
import { slackRouter } from "./slack";

const app = new OpenAPIHono<Context>();

// Mount app-specific routers
app.route("/slack", slackRouter);

// Future apps can be added here:
// app.route("/whatsapp", whatsappRouter);

export { app as appsRouter };
