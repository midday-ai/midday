import type { Context } from "@api/rest/types";
import { OpenAPIHono } from "@hono/zod-openapi";
import {
  getBankConnectionByReferenceId,
  getTeamById,
} from "@midday/db/queries";
import { triggerJob } from "@midday/job-client";
import { logger } from "@midday/logger";
import { isAfter, subDays } from "date-fns";
import { z } from "zod";

const app = new OpenAPIHono<Context>();

// https://plaid.com/docs/api/webhooks/#configuring-webhooks
const ALLOWED_IPS = [
  "52.21.26.131",
  "52.21.47.157",
  "52.41.247.19",
  "52.88.82.239",
];

const webhookBodySchema = z.object({
  webhook_type: z.enum(["TRANSACTIONS"]),
  webhook_code: z.enum([
    "SYNC_UPDATES_AVAILABLE",
    "HISTORICAL_UPDATE",
    "DEFAULT_UPDATE",
    "TRANSACTIONS_REMOVED",
    "INITIAL_UPDATE",
  ]),
  item_id: z.string(),
  error: z
    .object({
      error_type: z.string(),
      error_code: z.string(),
      error_code_reason: z.string(),
      error_message: z.string(),
      display_message: z.string(),
      request_id: z.string(),
      causes: z.array(z.string()),
      status: z.number(),
    })
    .nullable(),
  new_transactions: z.number().optional(),
  environment: z.enum(["sandbox", "production"]),
});

/**
 * Checks if a team is eligible for sync operations based on:
 * 1. Teams with starter or pro plan (always eligible)
 * 2. Trial teams created during beta period (within 14 days of creation)
 */
function isTeamEligibleForSync(team: {
  plan: string | null;
  createdAt: string | null;
}): boolean {
  // Pro and starter teams are always eligible
  if (team.plan === "pro" || team.plan === "starter") {
    return true;
  }

  // Trial teams are only eligible if created within the beta period (14 days)
  if (team.plan === "trial" && team.createdAt) {
    const teamCreatedAt = new Date(team.createdAt);
    const fourteenDaysAgo = subDays(new Date(), 14);
    return teamCreatedAt >= fourteenDaysAgo;
  }

  // All other cases are not eligible
  return false;
}

app.post("/", async (c) => {
  const db = c.get("db");
  const clientIp = c.req.header("x-forwarded-for") || "";

  // Verify IP address is from Plaid
  if (!ALLOWED_IPS.includes(clientIp)) {
    return c.json({ error: "Unauthorized IP address" }, 403);
  }

  // Parse and validate body
  const rawBody = await c.req.json();
  const parseResult = webhookBodySchema.safeParse(rawBody);

  if (!parseResult.success) {
    logger.warn("Plaid webhook: Invalid payload", {
      errors: parseResult.error.issues,
    });
    return c.json({ error: "Invalid webhook payload" }, 400);
  }

  const body = parseResult.data;

  // Find the bank connection by Plaid item_id (stored as reference_id)
  const connection = await getBankConnectionByReferenceId(db, {
    referenceId: body.item_id,
  });

  if (!connection) {
    return c.json({ error: "Connection not found" }, 404);
  }

  // Get team details for eligibility check
  const team = await getTeamById(db, connection.teamId);

  if (!team) {
    return c.json({ error: "Team not found" }, 404);
  }

  // Check if team is eligible for sync operations
  if (!isTeamEligibleForSync({ plan: team.plan, createdAt: team.createdAt })) {
    logger.info("Plaid webhook: Team not eligible for sync", {
      teamId: team.id,
      plan: team.plan,
    });

    return c.json({ success: true });
  }

  if (body.webhook_type === "TRANSACTIONS") {
    switch (body.webhook_code) {
      case "SYNC_UPDATES_AVAILABLE":
      case "DEFAULT_UPDATE":
      case "INITIAL_UPDATE":
      case "HISTORICAL_UPDATE": {
        // Only run manual sync if the historical update is complete
        // and the connection was created in the last 24 hours
        const manualSync =
          body.webhook_code === "HISTORICAL_UPDATE" &&
          connection.createdAt !== null &&
          isAfter(connection.createdAt, subDays(new Date(), 1));

        logger.info("Plaid webhook: Triggering sync", {
          connectionId: connection.id,
          webhookCode: body.webhook_code,
          manualSync,
        });

        await triggerJob(
          "sync-connection",
          {
            connectionId: connection.id,
            manualSync,
          },
          "banking",
        );

        break;
      }
    }
  }

  return c.json({ success: true });
});

export { app as plaidWebhookRouter };
