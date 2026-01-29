import crypto from "node:crypto";
import type { Context } from "@api/rest/types";
import { OpenAPIHono } from "@hono/zod-openapi";
import {
  getBankConnectionByEnrollmentId,
  getTeamById,
  isTeamEligibleForBankSync,
} from "@midday/db/queries";
import { triggerJob } from "@midday/job-client";
import { logger } from "@midday/logger";
import { isAfter, subDays } from "date-fns";
import { z } from "zod";

const app = new OpenAPIHono<Context>();

// ============================================================================
// Teller Signature Validation
// https://teller.io/docs/api/webhooks#verifying-messages
// ============================================================================

function parseTellerSignatureHeader(header: string): {
  timestamp: string;
  signatures: string[];
} {
  const parts = header.split(",");
  const timestampPart = parts.find((p) => p.startsWith("t="));
  const signatureParts = parts.filter((p) => p.startsWith("v1="));

  if (!timestampPart) {
    throw new Error("No timestamp in Teller-Signature header");
  }

  const timestamp = timestampPart.split("=")[1];
  const signatures = signatureParts
    .map((p) => p.split("=")[1])
    .filter((sig): sig is string => sig !== undefined);

  if (!timestamp || signatures.some((sig) => !sig)) {
    throw new Error("Invalid Teller-Signature header format");
  }

  return { timestamp, signatures };
}

function validateTellerSignature(params: {
  signatureHeader: string | null;
  text: string;
}): boolean {
  if (!params.signatureHeader) {
    return false;
  }

  const signingSecret = process.env.TELLER_SIGNING_SECRET;
  if (!signingSecret) {
    logger.error("TELLER_SIGNING_SECRET not configured");
    return false;
  }

  try {
    const { timestamp, signatures } = parseTellerSignatureHeader(
      params.signatureHeader,
    );

    const threeMinutesAgo = Math.floor(Date.now() / 1000) - 3 * 60;

    if (Number.parseInt(timestamp) < threeMinutesAgo) {
      return false;
    }

    const signedMessage = `${timestamp}.${params.text}`;
    const calculatedSignature = crypto
      .createHmac("sha256", signingSecret)
      .update(signedMessage)
      .digest("hex");

    return signatures.includes(calculatedSignature);
  } catch {
    return false;
  }
}

// ============================================================================
// Webhook Schema
// ============================================================================

const webhookBodySchema = z.object({
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

// ============================================================================
// Webhook Route
// ============================================================================

app.post("/", async (c) => {
  const db = c.get("db");

  // Get raw body for signature verification
  const rawBody = await c.req.text();
  const signatureHeader = c.req.header("teller-signature") ?? null;

  // Verify webhook signature
  const signatureValid = validateTellerSignature({
    signatureHeader,
    text: rawBody,
  });

  if (!signatureValid) {
    return c.json({ error: "Invalid webhook signature" }, 401);
  }

  // Parse and validate body
  const parseResult = webhookBodySchema.safeParse(JSON.parse(rawBody));

  if (!parseResult.success) {
    return c.json({ error: "Invalid webhook payload" }, 400);
  }

  const { type, payload } = parseResult.data;

  // Test webhooks return success immediately
  if (type === "webhook.test") {
    return c.json({ success: true });
  }

  if (!payload.enrollment_id) {
    return c.json({ error: "Missing enrollment_id" }, 400);
  }

  // Find the bank connection by Teller enrollment_id
  const connection = await getBankConnectionByEnrollmentId(db, {
    enrollmentId: payload.enrollment_id,
  });

  if (!connection) {
    logger.warn("Teller webhook: connection not found", {
      enrollmentId: payload.enrollment_id,
    });

    return c.json({ error: "Connection not found" }, 404);
  }

  // Get team details for eligibility check
  const team = await getTeamById(db, connection.teamId);

  if (!team) {
    return c.json({ error: "Team not found" }, 404);
  }

  // Check if team is eligible for sync operations
  if (
    !isTeamEligibleForBankSync({
      plan: team.plan,
      createdAt: team.createdAt,
      canceledAt: team.canceledAt,
    })
  ) {
    logger.info("Teller webhook: Team not eligible for sync", {
      teamId: team.id,
      plan: team.plan,
    });

    return c.json({ success: true });
  }

  switch (type) {
    case "transactions.processed": {
      // Only run manual sync if the connection was created in the last 24 hours
      const manualSync =
        connection.createdAt !== null &&
        isAfter(connection.createdAt, subDays(new Date(), 1));

      logger.info("Teller webhook: Triggering sync", {
        connectionId: connection.id,
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

  return c.json({ success: true });
});

export { app as tellerWebhookRouter };
