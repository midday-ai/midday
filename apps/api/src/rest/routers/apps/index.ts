import type { Context } from "@api/rest/types";
import { OpenAPIHono } from "@hono/zod-openapi";
import { fortnoxRouter } from "./fortnox";
import { gmailRouter } from "./gmail";
import { outlookRouter } from "./outlook";
import { quickbooksRouter } from "./quickbooks";
import { slackRouter } from "./slack";
import { stripeRouter } from "./stripe";
import { xeroRouter } from "./xero";

const app = new OpenAPIHono<Context>();

// Mount app-specific routers
app.route("/slack", slackRouter);
app.route("/gmail", gmailRouter);
app.route("/outlook", outlookRouter);
app.route("/xero", xeroRouter);
app.route("/quickbooks", quickbooksRouter);
app.route("/fortnox", fortnoxRouter);
app.route("/stripe", stripeRouter);

export { app as appsRouter };
