import type { Context } from "@api/rest/types";
import { OpenAPIHono } from "@hono/zod-openapi";
import { downloadRouter } from "./download";
import { serveRouter } from "./serve";

const app = new OpenAPIHono<Context>();

app.route("/", serveRouter);

app.route("/download", downloadRouter);

export { app as filesRouter };
