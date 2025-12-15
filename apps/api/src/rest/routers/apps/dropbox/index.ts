import type { Context } from "@api/rest/types";
import { OpenAPIHono } from "@hono/zod-openapi";
import { installUrlRouter } from "./install-url";
import { oauthCallbackRouter } from "./oauth-callback";
import { webhookRouter } from "./webhook";

const app = new OpenAPIHono<Context>();

app.route("/webhook", webhookRouter);
app.route("/oauth-callback", oauthCallbackRouter);
app.route("/install-url", installUrlRouter);

export { app as dropboxRouter };
