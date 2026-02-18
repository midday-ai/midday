import type { Context } from "@api/rest/types";
import { isTeamEligibleForSync } from "@api/utils/check-team-eligibility";
import { validatePlaidWebhook } from "@api/utils/plaid";
import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import {
  deleteTransactionsByInternalIds,
  getBankConnectionByReferenceId,
  updateBankConnectionStatus,
} from "@midday/db/queries";
import type { SyncConnectionPayload } from "@midday/jobs/schema";
import { logger } from "@midday/logger";
import { tasks } from "@trigger.dev/sdk";
import { isAfter, subDays } from "date-fns";
import { HTTPException } from "hono/http-exception";

const app = new OpenAPIHono<Context>();

const errorSchema = z
  .object({
    error_type: z.string(),
    error_code: z.string(),
    error_code_reason: z.string().nullable().optional(),
    error_message: z.string(),
    display_message: z.string().nullable().optional(),
    request_id: z.string().optional(),
    causes: z.array(z.unknown()).optional(),
    status: z.number().optional(),
  })
  .nullable()
  .optional();

const webhookSchema = z.object({
  webhook_type: z.enum(["TRANSACTIONS", "ITEM"]),
  webhook_code: z.string(),
  item_id: z.string(),
  error: errorSchema,
  environment: z.enum(["sandbox", "production"]),
  // TRANSACTIONS fields
  new_transactions: z.number().optional(),
  removed_transactions: z.array(z.string()).optional(),
  // ITEM fields
  user_id: z.string().optional(),
  reason: z.string().optional(),
  consent_expiration_time: z.string().optional(),
  account_id: z.string().optional(),
  new_webhook_url: z.string().optional(),
});

const webhookResponseSchema = z.object({
  success: z.boolean(),
});

app.openapi(
  createRoute({
    method: "post",
    path: "/",
    summary: "Plaid webhook handler",
    operationId: "plaidWebhook",
    description:
      "Handles Plaid webhook events for transaction updates and item status changes. Verifies the Plaid-Verification JWT signature.",
    tags: ["Webhooks"],
    responses: {
      200: {
        description: "Webhook processed successfully",
        content: {
          "application/json": {
            schema: webhookResponseSchema,
          },
        },
      },
      400: {
        description: "Invalid webhook payload",
      },
      401: {
        description: "Invalid webhook signature",
      },
    },
  }),
  async (c) => {
    const rawBody = await c.req.text();

    const isValid = await validatePlaidWebhook({
      body: rawBody,
      verificationHeader: c.req.header("plaid-verification") ?? null,
    });

    if (!isValid) {
      throw new HTTPException(401, {
        message: "Invalid webhook signature",
      });
    }

    const body = JSON.parse(rawBody);

    const result = webhookSchema.safeParse(body);

    if (!result.success) {
      logger.warn("Invalid Plaid webhook payload", {
        details: result.error.issues,
      });
      throw new HTTPException(400, {
        message: "Invalid webhook payload",
      });
    }

    const { webhook_type, webhook_code } = result.data;
    const db = c.get("db");

    const connectionData = await getBankConnectionByReferenceId(db, {
      referenceId: result.data.item_id,
    });

    if (!connectionData) {
      logger.warn("Plaid webhook: connection not found", {
        itemId: result.data.item_id,
        webhookType: webhook_type,
        webhookCode: webhook_code,
      });
      return c.json({ success: true });
    }

    if (webhook_type === "ITEM") {
      switch (webhook_code) {
        case "ERROR": {
          logger.info("Plaid item error", {
            connectionId: connectionData.id,
            errorCode: result.data.error?.error_code,
            errorMessage: result.data.error?.error_message,
          });

          await updateBankConnectionStatus(db, {
            id: connectionData.id,
            status: "disconnected",
          });

          break;
        }

        case "PENDING_DISCONNECT":
        case "USER_PERMISSION_REVOKED": {
          logger.info("Plaid item disconnecting", {
            connectionId: connectionData.id,
            webhookCode: webhook_code,
            reason: result.data.reason,
          });

          await updateBankConnectionStatus(db, {
            id: connectionData.id,
            status: "disconnected",
          });

          break;
        }

        case "LOGIN_REPAIRED": {
          logger.info("Plaid item login repaired", {
            connectionId: connectionData.id,
          });

          await updateBankConnectionStatus(db, {
            id: connectionData.id,
            status: "connected",
          });

          break;
        }

        default: {
          logger.info("Plaid item webhook (unhandled)", {
            connectionId: connectionData.id,
            webhookCode: webhook_code,
          });
        }
      }

      return c.json({ success: true });
    }

    if (
      !isTeamEligibleForSync({
        plan: connectionData.team.plan,
        createdAt: connectionData.team.createdAt,
      })
    ) {
      logger.info("Plaid webhook: team not eligible for sync", {
        teamId: connectionData.team.id,
      });
      return c.json({ success: true });
    }

    if (webhook_type === "TRANSACTIONS") {
      switch (webhook_code) {
        case "SYNC_UPDATES_AVAILABLE":
        case "DEFAULT_UPDATE":
        case "INITIAL_UPDATE":
        case "HISTORICAL_UPDATE": {
          const manualSync =
            webhook_code === "HISTORICAL_UPDATE" &&
            isAfter(new Date(connectionData.createdAt), subDays(new Date(), 1));

          logger.info("Plaid webhook: triggering sync", {
            connectionId: connectionData.id,
            webhookCode: webhook_code,
            manualSync,
          });

          await tasks.trigger("sync-connection", {
            connectionId: connectionData.id,
            manualSync,
          } satisfies SyncConnectionPayload);

          break;
        }

        case "TRANSACTIONS_REMOVED": {
          const removedIds = result.data.removed_transactions;

          if (removedIds && removedIds.length > 0) {
            logger.info("Plaid webhook: removing transactions", {
              connectionId: connectionData.id,
              count: removedIds.length,
            });

            await deleteTransactionsByInternalIds(db, {
              teamId: connectionData.team.id,
              internalIds: removedIds,
            });
          }

          break;
        }
      }
    }

    return c.json({ success: true });
  },
);

export { app as plaidWebhookRouter };
