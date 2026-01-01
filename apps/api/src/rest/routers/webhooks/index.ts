import { publicMiddleware } from "@api/rest/middleware";
import type { Context } from "@api/rest/types";
import { OpenAPIHono } from "@hono/zod-openapi";
import { inboxWebhookRouter } from "./inbox";
import { stripeWebhookRouter } from "./stripe";
import { whatsappWebhookRouter } from "./whatsapp";

const app = new OpenAPIHono<Context>();

// Apply public middleware to all webhooks (no authentication required)
app.use("*", ...publicMiddleware);

// Mount individual webhook routes
app.route("/inbox", inboxWebhookRouter);
app.route("/whatsapp", whatsappWebhookRouter);
app.route("/stripe", stripeWebhookRouter);

export { app as webhookRouter };
