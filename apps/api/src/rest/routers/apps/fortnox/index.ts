import type { Context } from "@api/rest/types";
import { OpenAPIHono } from "@hono/zod-openapi";
import { installUrlRouter } from "./install-url";
import { oauthCallbackRouter } from "./oauth-callback";

const app = new OpenAPIHono<Context>();

app.route("/oauth-callback", oauthCallbackRouter);
app.route("/install-url", installUrlRouter);

export { app as fortnoxRouter };
