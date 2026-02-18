import type { Context } from "@api/rest/types";
import { isTeamEligibleForSync } from "@api/utils/check-team-eligibility";
import { validateTellerSignature } from "@api/utils/teller";
import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import {
  getBankConnectionByEnrollmentId,
  updateBankConnectionStatus,
} from "@midday/db/queries";
import type { SyncConnectionPayload } from "@midday/jobs/schema";
import { logger } from "@midday/logger";
import { tasks } from "@trigger.dev/sdk";
import { isAfter, subDays } from "date-fns";
import { HTTPException } from "hono/http-exception";

const app = new OpenAPIHono<Context>();

const webhookSchema = z.object({
  id: z.string(),
  payload: z.object({
    enrollment_id: z.string().optional(),
    reason: z.string().optional(),
  }),
  timestamp: z.string(),
  type: z.enum([
    "enrollment.disconnected",
    "transactions.processed",
    "account.number_verification.processed",
    "webhook.test",
  ]),
});

const webhookResponseSchema = z.object({
  success: z.boolean(),
});

app.openapi(
  createRoute({
    method: "post",
    path: "/",
    summary: "Teller webhook handler",
    operationId: "tellerWebhook",
    description:
      "Handles Teller webhook events for enrollment disconnections and transaction updates.",
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
    const body = JSON.parse(rawBody);

    const signatureValid = validateTellerSignature({
      signatureHeader: c.req.header("teller-signature") ?? null,
      text: rawBody,
    });

    if (!signatureValid) {
      throw new HTTPException(401, {
        message: "Invalid webhook signature",
      });
    }

    const result = webhookSchema.safeParse(body);

    if (!result.success) {
      logger.warn("Invalid Teller webhook payload", {
        details: result.error.issues,
      });
      throw new HTTPException(400, {
        message: "Invalid webhook payload",
      });
    }

    const { type, payload } = result.data;

    if (type === "webhook.test") {
      return c.json({ success: true });
    }

    if (!payload.enrollment_id) {
      throw new HTTPException(400, {
        message: "Missing enrollment_id",
      });
    }

    const db = c.get("db");

    const connectionData = await getBankConnectionByEnrollmentId(db, {
      enrollmentId: payload.enrollment_id,
    });

    if (!connectionData) {
      logger.warn("Teller webhook: connection not found", {
        enrollmentId: payload.enrollment_id,
      });
      return c.json({ success: true });
    }

    if (type === "enrollment.disconnected") {
      logger.info("Teller enrollment disconnected", {
        connectionId: connectionData.id,
        reason: payload.reason,
      });

      await updateBankConnectionStatus(db, {
        id: connectionData.id,
        status: "disconnected",
      });

      return c.json({ success: true });
    }

    if (
      !isTeamEligibleForSync({
        plan: connectionData.team.plan,
        createdAt: connectionData.team.createdAt,
      })
    ) {
      logger.info("Teller webhook: team not eligible for sync", {
        teamId: connectionData.team.id,
      });
      return c.json({ success: true });
    }

    switch (type) {
      case "transactions.processed": {
        const manualSync = isAfter(
          new Date(connectionData.createdAt),
          subDays(new Date(), 1),
        );

        await tasks.trigger("sync-connection", {
          connectionId: connectionData.id,
          manualSync,
        } satisfies SyncConnectionPayload);

        break;
      }
    }

    return c.json({ success: true });
  },
);

export { app as tellerWebhookRouter };
