import type { Context } from "@api/rest/types";
import { OpenAPIHono } from "@hono/zod-openapi";
import { foldersRouter } from "./folders";
import { installUrlRouter } from "./install-url";
import { oauthCallbackRouter } from "./oauth-callback";
import { selectFolderRouter } from "./select-folder";

const app = new OpenAPIHono<Context>();

app.route("/oauth-callback", oauthCallbackRouter);
app.route("/install-url", installUrlRouter);
app.route("/folders", foldersRouter);
app.route("/select-folder", selectFolderRouter);

export { app as googleDriveRouter };

