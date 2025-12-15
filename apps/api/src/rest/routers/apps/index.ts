import type { Context } from "@api/rest/types";
import { OpenAPIHono } from "@hono/zod-openapi";
import { gmailRouter } from "./gmail";
import { outlookRouter } from "./outlook";
import { slackRouter } from "./slack";
import { xeroRouter } from "./xero";

const app = new OpenAPIHono<Context>();

// Mount app-specific routers
app.route("/slack", slackRouter);
app.route("/gmail", gmailRouter);
app.route("/outlook", outlookRouter);
app.route("/xero", xeroRouter);

export { app as appsRouter };
