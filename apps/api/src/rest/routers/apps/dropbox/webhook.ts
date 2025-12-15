import crypto from "node:crypto";
import { publicMiddleware } from "@api/rest/middleware";
import type { Context } from "@api/rest/types";
import { validateResponse } from "@api/utils/validate-response";
import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { getDropboxConnections } from "@midday/db/queries";
import { triggerJob } from "@midday/job-client";
import { createLoggerWithContext } from "@midday/logger";
import { HTTPException } from "hono/http-exception";

const logger = createLoggerWithContext("dropbox:webhook");

const app = new OpenAPIHono<Context>();

const dropboxWebhookSchema = z.object({
  list_folder: z
    .object({
      accounts: z.array(z.string()).optional(),
    })
    .optional(),
  delta: z
    .object({
      users: z.array(z.number()).optional(),
    })
    .optional(),
});

const successResponseSchema = z.object({
  challenge: z.string().optional(),
  ok: z.boolean().optional(),
});

app.use("*", ...publicMiddleware);

/**
 * Dropbox webhook verification endpoint (GET)
 * Dropbox sends a GET request with a challenge parameter to verify the webhook URL
 */
app.openapi(
  createRoute({
    method: "get",
    path: "/",
    summary: "Dropbox webhook verification",
    operationId: "dropboxWebhookVerification",
    description:
      "Verifies the Dropbox webhook URL by responding to the challenge parameter",
    tags: ["Integrations"],
    request: {
      query: z.object({
        challenge: z.string().optional(),
      }),
    },
    responses: {
      200: {
        description: "Webhook verified successfully",
        content: {
          "application/json": {
            schema: successResponseSchema,
          },
        },
      },
    },
  }),
  async (c) => {
    const challenge = c.req.query("challenge");

    if (challenge) {
      logger.debug("Dropbox webhook challenge received", { challenge });
      return c.json(validateResponse({ challenge }, successResponseSchema));
    }

    return c.json({ ok: true });
  },
);

/**
 * Dropbox webhook handler (POST)
 * Receives file change notifications from Dropbox
 */
app.openapi(
  createRoute({
    method: "post",
    path: "/",
    summary: "Dropbox webhook handler",
    operationId: "dropboxWebhook",
    description:
      "Handles incoming webhook events from Dropbox. Verifies request signature and processes file change events.",
    tags: ["Integrations"],
    request: {
      body: {
        content: {
          "application/json": {
            schema: dropboxWebhookSchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: "Webhook processed successfully",
        content: {
          "application/json": {
            schema: successResponseSchema,
          },
        },
      },
      403: {
        description: "Invalid signature",
      },
    },
  }),
  async (c) => {
    const db = c.get("db");

    try {
      // Verify Dropbox webhook signature
      const signature = c.req.header("X-Dropbox-Signature");
      const appSecret = process.env.DROPBOX_APP_SECRET;

      if (!appSecret) {
        logger.error("DROPBOX_APP_SECRET not configured");
        throw new HTTPException(500, {
          message: "Dropbox webhook not configured",
        });
      }

      // Get raw body for signature verification
      const rawBody = await c.req.text();

      if (
        signature &&
        !verifyDropboxWebhookSignature(rawBody, signature, appSecret)
      ) {
        logger.warn("Dropbox webhook signature verification failed");
        throw new HTTPException(403, { message: "Invalid signature" });
      }

      const body = JSON.parse(rawBody);
      const parsedBody = dropboxWebhookSchema.safeParse(body);

      if (!parsedBody.success) {
        logger.error("Dropbox webhook schema validation failed", {
          error: parsedBody.error.format(),
        });
        throw new HTTPException(400, {
          message: "Invalid event payload",
        });
      }

      logger.debug("Dropbox webhook received", {
        hasListFolder: !!body.list_folder,
        hasDelta: !!body.delta,
      });

      // Handle list_folder webhook (initial webhook setup)
      if (body.list_folder) {
        const accounts = body.list_folder.accounts || [];
        logger.info("Dropbox list_folder webhook received", {
          accountCount: accounts.length,
        });

        // For each account, trigger a sync
        for (const accountId of accounts) {
          // Find Dropbox connections for this account
          // Note: We'll need to get teamId from accountId
          // For now, we'll trigger sync for all teams with Dropbox connections
          // This will be refined when we have the accountId -> teamId mapping
        }
      }

      // Handle delta webhook (file changes)
      if (body.delta) {
        const users = body.delta.users || [];
        logger.info("Dropbox delta webhook received", {
          userCount: users.length,
        });

        // For each user, trigger a sync
        // Note: users array contains Dropbox account IDs
        // We'll need to find the corresponding connections and trigger sync
        for (const userId of users) {
          // Find connections by externalId (Dropbox account ID)
          // Trigger sync job for those connections
        }
      }

      return c.json(validateResponse({ ok: true }, successResponseSchema));
    } catch (error) {
      logger.error("Error processing Dropbox webhook", {
        error: error instanceof Error ? error.message : "Unknown error",
      });

      if (error instanceof HTTPException) {
        throw error;
      }

      throw new HTTPException(500, {
        message: "Internal server error",
      });
    }
  },
);

/**
 * Verify Dropbox webhook signature using HMAC-SHA256
 * @param body - Raw request body
 * @param signature - X-Dropbox-Signature header value
 * @param appSecret - Dropbox app secret
 */
function verifyDropboxWebhookSignature(
  body: string,
  signature: string,
  appSecret: string,
): boolean {
  try {
    const hmac = crypto.createHmac("sha256", appSecret);
    hmac.update(body);
    const expectedSignature = hmac.digest("hex");

    // Dropbox sends signature as hex string
    return crypto.timingSafeEqual(
      Buffer.from(signature, "hex"),
      Buffer.from(expectedSignature, "hex"),
    );
  } catch (error) {
    logger.error("Error verifying Dropbox webhook signature", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return false;
  }
}

export { app as webhookRouter };
