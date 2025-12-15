import { publicMiddleware } from "@api/rest/middleware";
import type { Context } from "@api/rest/types";
import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { apps } from "@midday/db/schema";
import { triggerJob } from "@midday/job-client";
import { createLoggerWithContext } from "@midday/logger";
import { eq } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";

const logger = createLoggerWithContext("googledrive:webhook");

const app = new OpenAPIHono<Context>();

const googleDriveWebhookSchema = z.object({
  kind: z.literal("api#channel"),
  id: z.string(),
  resourceId: z.string(),
  resourceUri: z.string(),
  token: z.string().optional(),
  expiration: z.string(),
});

const successResponseSchema = z.object({
  ok: z.boolean(),
});

app.use("*", ...publicMiddleware);

/**
 * Google Drive push notification handler (POST)
 * Receives file change notifications from Google Drive via changes.watch
 */
app.openapi(
  createRoute({
    method: "post",
    path: "/",
    summary: "Google Drive push notification handler",
    operationId: "googleDriveWebhook",
    description:
      "Receives push notifications from Google Drive when files change in watched folders",
    tags: ["Integrations"],
    request: {
      body: {
        content: {
          "application/json": {
            schema: googleDriveWebhookSchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: "Notification received successfully",
        content: {
          "application/json": {
            schema: successResponseSchema,
          },
        },
      },
      400: {
        description: "Invalid request",
      },
    },
  }),
  async (c) => {
    const db = c.get("db");
    const body = c.req.valid("json");

    try {
      // Google Drive sends notifications with resourceId
      // We need to find which teams have Google Drive connections with watch channels matching this resourceId
      const { resourceId } = body;

      // Get all teams with Google Drive apps and check their watch channels
      // Note: This is a simplified approach - in production, you might want to
      // store teamId in the watch channel token or maintain a mapping
      const allGoogleDriveApps = await db
        .select({ teamId: apps.teamId })
        .from(apps)
        .where(eq(apps.appId, "googledrive"));

      const teamIds = new Set(allGoogleDriveApps.map((app) => app.teamId));

      // Trigger sync for each team that has Google Drive connections
      // The sync processor will check watch channels and only process relevant folders
      for (const teamId of teamIds) {
        try {
          await triggerJob(
            "sync-inbox-apps",
            { teamId, manualSync: false },
            "inbox-provider",
          );
        } catch (error) {
          logger.error("Failed to trigger sync for team", {
            teamId,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }

      logger.info("Google Drive webhook notification received", {
        resourceId,
        teamsTriggered: teamIds.size,
      });

      return c.json({ ok: true });
    } catch (error) {
      logger.error("Error processing Google Drive webhook", {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });

      throw new HTTPException(500, {
        message: "Failed to process webhook",
      });
    }
  },
);

export { app as webhookRouter };
