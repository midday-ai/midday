import type { Context } from "@api/rest/types";
import { OpenAPIHono } from "@hono/zod-openapi";
import { dropboxRouter } from "./dropbox";
import { googledriveRouter } from "./googledrive";
import { gmailRouter } from "./gmail";
import { outlookRouter } from "./outlook";
import { slackRouter } from "./slack";

const app = new OpenAPIHono<Context>();

// Mount app-specific routers
app.route("/slack", slackRouter);
app.route("/gmail", gmailRouter);
app.route("/outlook", outlookRouter);
app.route("/dropbox", dropboxRouter);
app.route("/googledrive", googledriveRouter);

export { app as appsRouter };
