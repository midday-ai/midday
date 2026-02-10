import { publicMiddleware } from "@api/rest/middleware";
import type { Context } from "@api/rest/types";
import { validateResponse } from "@api/utils/validate-response";
import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import {
  createSlackWebClient,
  fileShare,
  publishAppHome,
  verifySlackWebhook,
} from "@midday/app-store/slack/server";
import { getAppBySlackTeamId } from "@midday/db/queries";
import { createLoggerWithContext } from "@midday/logger";
import type { FileShareMessageEvent } from "@slack/web-api";
import { HTTPException } from "hono/http-exception";

const logger = createLoggerWithContext("slack:webhook");

const app = new OpenAPIHono<Context>();

const slackEventSchema = z.object({
  type: z.string(),
  event: z
    .object({
      type: z.string(),
      subtype: z.string().optional(),
      ts: z.string().optional(), // Message timestamp
      user: z.string().optional(), // User ID for app_home_opened
      files: z
        .array(
          z.object({
            id: z.string(),
            name: z.string().nullable(),
            mimetype: z.string().nullable(),
            size: z.number().nullable(),
            url_private_download: z.string().nullable(),
          }),
        )
        .optional(),
      channel: z.string().optional(),
      thread_ts: z.string().optional(),
    })
    .optional(),
  challenge: z.string().optional(),
  team_id: z.string().optional(),
});

const successResponseSchema = z.object({
  challenge: z.string().optional(),
  ok: z.boolean().optional(),
});

app.use("*", ...publicMiddleware);

app.openapi(
  createRoute({
    method: "post",
    path: "/",
    summary: "Slack webhook handler",
    operationId: "slackWebhook",
    description:
      "Handles incoming webhook events from Slack. Verifies request signature and processes events.",
    tags: ["Integrations"],
    responses: {
      200: {
        description: "Webhook processed successfully",
        content: {
          "application/json": {
            schema: successResponseSchema,
          },
        },
      },
    },
  }),
  async (c) => {
    const db = c.get("db");

    try {
      // Verify Slack webhook signature using raw request
      // We need to clone the request because verifySlackWebhook reads the body
      const clonedRequest = c.req.raw.clone();
      const body = await verifySlackWebhook(clonedRequest as Request);

      logger.debug("Slack webhook received", {
        eventType: body.event?.type,
        subtype: body.event?.subtype,
        channel: body.event?.channel,
        hasFiles: !!body.event?.files?.length,
      });

      // Handle URL verification challenge (Slack requires this on initial setup)
      if (body.challenge) {
        logger.debug("Slack webhook challenge received");
        return c.json(
          validateResponse(
            { challenge: String(body.challenge) },
            successResponseSchema,
          ),
        );
      }

      const parsedBody = slackEventSchema.safeParse(body);

      if (!parsedBody.success) {
        logger.error("Slack webhook schema validation failed", {
          error: parsedBody.error.format(),
        });
        throw new HTTPException(400, {
          message: "Invalid event payload",
        });
      }

      const { type, event, team_id } = parsedBody.data;

      // Handle different event types
      if (type === "event_callback" && event) {
        // Get Slack app integration for this team
        if (!team_id) {
          logger.error("Slack webhook team ID missing from event");
          throw new HTTPException(400, {
            message: "Team ID not found in event",
          });
        }

        // Use channel ID to help identify the correct Midday team
        // Each Slack integration stores a channel_id during OAuth setup
        const slackApp = await getAppBySlackTeamId(db, {
          slackTeamId: team_id,
          channelId: event.channel, // Use channel from event to find the correct integration
        });

        if (!slackApp?.config) {
          logger.error("Slack integration not found for team", {
            slackTeamId: team_id,
          });
          throw new HTTPException(404, {
            message: "Slack integration not found for team",
          });
        }

        // @ts-expect-error - config is JSONB
        const token = slackApp.config.access_token;
        const middayTeamId = slackApp.teamId;

        if (!middayTeamId) {
          logger.error("Midday team ID not found in app integration", {
            slackTeamId: team_id,
            appId: slackApp.id,
          });
          throw new HTTPException(400, {
            message: "Team ID not found in app integration",
          });
        }

        // Log for debugging - verify we're using the correct team
        logger.info("Found Slack app integration", {
          slackTeamId: team_id,
          middayTeamId,
          appId: slackApp.id,
          // @ts-expect-error - config is JSONB
          slackTeamName: slackApp.config.team_name,
        });

        // Handle events using switch statement
        switch (event.type) {
          case "app_home_opened": {
            if (event.user) {
              const client = createSlackWebClient({ token });

              // Publish home view asynchronously
              publishAppHome({
                client,
                userId: event.user,
                db,
                teamId: middayTeamId,
                slackApp: {
                  config: slackApp.config,
                  settings: slackApp.settings,
                },
              }).catch((error) => {
                logger.error("Failed to publish App Home", {
                  error: error instanceof Error ? error.message : String(error),
                  userId: event.user,
                  middayTeamId,
                });
              });

              logger.debug("Published App Home", {
                userId: event.user,
                middayTeamId,
              });
            }
            break;
          }

          case "message": {
            // Handle message events with subtype "file_share"
            if (
              event.subtype === "file_share" &&
              event.files &&
              event.files.length > 0 &&
              event.channel
            ) {
              const channelId = event.channel;
              const isPublicChannel = channelId.startsWith("C");
              const isPrivateChannel = channelId.startsWith("G");

              // Auto-join public channels if needed (bot must be member to receive events)
              if (isPublicChannel) {
                try {
                  const client = createSlackWebClient({ token });
                  await client.conversations.join({ channel: channelId });
                  logger.debug("Bot joined public channel", {
                    channel: channelId,
                  });
                } catch (joinError: unknown) {
                  // If already in channel, that's fine - continue processing
                  let errorMessage: string;
                  if (
                    joinError &&
                    typeof joinError === "object" &&
                    "data" in joinError &&
                    joinError.data &&
                    typeof joinError.data === "object" &&
                    "error" in joinError.data
                  ) {
                    errorMessage = String(joinError.data.error);
                  } else if (joinError instanceof Error) {
                    errorMessage = joinError.message;
                  } else {
                    errorMessage = String(joinError);
                  }

                  if (
                    errorMessage === "already_in_channel" ||
                    errorMessage === "channel_not_found"
                  ) {
                    // Already in channel or channel doesn't exist - continue
                    logger.debug(
                      "Bot already in channel or channel not found",
                      {
                        channel: channelId,
                        error: errorMessage,
                      },
                    );
                  } else {
                    // Log other errors but don't fail - we'll try to process anyway
                    logger.warn(
                      "Failed to join channel (will try to process anyway)",
                      {
                        channel: channelId,
                        error: errorMessage,
                      },
                    );
                  }
                }
              } else if (isPrivateChannel) {
                // For private channels, bot must be explicitly invited
                logger.debug(
                  "Private channel detected - bot must be invited manually",
                  {
                    channel: channelId,
                  },
                );
              }

              // Convert to FileShareMessageEvent format
              const fileShareEvent = {
                type: "message" as const,
                subtype: "file_share" as const,
                ts: event.ts, // Message timestamp for reactions
                files: event.files.map((file) => ({
                  id: file.id,
                  name: file.name || undefined,
                  mimetype: file.mimetype || undefined,
                  size: file.size || undefined,
                  url_private_download: file.url_private_download || undefined,
                })) as any,
                channel: channelId,
                thread_ts: event.thread_ts,
              } as FileShareMessageEvent;

              // Process file asynchronously - don't await to ACK Slack quickly
              fileShare(fileShareEvent, {
                teamId: middayTeamId,
                token,
              }).catch((error) => {
                logger.error(
                  "Failed to process file_share event asynchronously",
                  {
                    error:
                      error instanceof Error ? error.message : String(error),
                    fileCount: event.files?.length || 0,
                    channel: channelId,
                  },
                );
              });

              logger.info("Queued file_share event for processing", {
                fileCount: event.files.length,
                channel: channelId,
              });
            } else {
              // Other message types (not file_share)
              logger.debug("Received message event (not file_share)", {
                subtype: event.subtype || "none",
                hasFiles: !!event.files?.length,
                channel: event.channel,
              });
            }
            break;
          }

          default:
            logger.debug("Unhandled event type", {
              eventType: event.type,
              subtype: event.subtype,
            });
            break;
        }
      }

      return c.json(validateResponse({ ok: true }, successResponseSchema));
    } catch (err) {
      if (err instanceof HTTPException) {
        throw err;
      }

      if (err instanceof Error && err.message.includes("signature")) {
        logger.error("Slack webhook signature validation failed", {
          error: err.message,
        });
        throw new HTTPException(401, {
          message: "Invalid Slack signature",
        });
      }

      logger.error("Slack webhook processing failed", {
        error: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? err.stack : undefined,
      });
      throw new HTTPException(500, {
        message: "Failed to process webhook",
      });
    }
  },
);

export { app as webhookRouter };
