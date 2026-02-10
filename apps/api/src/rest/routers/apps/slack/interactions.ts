import { createHmac, timingSafeEqual } from "node:crypto";
import { publicMiddleware } from "@api/rest/middleware";
import type { Context } from "@api/rest/types";
import { validateResponse } from "@api/utils/validate-response";
import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import {
  createSlackWebClient,
  ensureBotInChannel,
} from "@midday/app-store/slack/server";
import type { Database } from "@midday/db/client";
import {
  confirmSuggestedMatch,
  declineSuggestedMatch,
  getAppBySlackTeamId,
  getInboxById,
  getSuggestionByInboxAndTransaction,
} from "@midday/db/queries";
import { logger } from "@midday/logger";
import { HTTPException } from "hono/http-exception";

const app = new OpenAPIHono<Context>();

const successResponseSchema = z.object({
  ok: z.boolean(),
});

// Helper function to get message timestamp from inbox item and add emoji reaction
async function addEmojiReactionToOriginalMessage({
  db,
  slackClient,
  inboxId,
  teamId,
  channelId,
  emojiName,
}: {
  db: Database;
  slackClient: ReturnType<typeof createSlackWebClient>;
  inboxId: string;
  teamId: string;
  channelId: string;
  emojiName: string;
}): Promise<void> {
  try {
    const inboxItem = await getInboxById(db, {
      id: inboxId,
      teamId,
    });

    if (
      inboxItem?.meta &&
      typeof inboxItem.meta === "object" &&
      "sourceMetadata" in inboxItem.meta &&
      inboxItem.meta.sourceMetadata &&
      typeof inboxItem.meta.sourceMetadata === "object"
    ) {
      const sourceMeta = inboxItem.meta.sourceMetadata as {
        messageTs?: string;
        threadTs?: string;
      };
      const originalMessageTs =
        sourceMeta.messageTs || sourceMeta.threadTs || null;

      if (originalMessageTs) {
        try {
          await ensureBotInChannel({
            client: slackClient,
            channelId,
          });
          await slackClient.reactions.add({
            channel: channelId,
            timestamp: originalMessageTs,
            name: emojiName,
          });
        } catch (reactionError) {
          logger.debug(`Failed to add ${emojiName} emoji reaction`, {
            error:
              reactionError instanceof Error
                ? reactionError.message
                : String(reactionError),
            channelId,
            messageTs: originalMessageTs,
          });
        }
      }
    }
  } catch (inboxError) {
    logger.debug("Failed to get inbox item for emoji reaction", {
      error:
        inboxError instanceof Error ? inboxError.message : String(inboxError),
      inboxId,
    });
  }
}

// Slack interaction payload schema (simplified)
const slackInteractionSchema = z.object({
  type: z.literal("block_actions"),
  user: z.object({
    id: z.string(),
    username: z.string().optional(),
  }),
  team: z.object({
    id: z.string(),
  }),
  actions: z.array(
    z.object({
      action_id: z.string(),
      value: z.string().optional(),
    }),
  ),
  response_url: z.string(),
  message: z
    .object({
      ts: z.string(),
    })
    .optional(),
  channel: z
    .object({
      id: z.string(),
    })
    .optional(),
});

async function verifySlackInteraction(req: Request): Promise<unknown> {
  const SLACK_SIGNING_SECRET = process.env.SLACK_SIGNING_SECRET;

  if (!SLACK_SIGNING_SECRET) {
    throw new Error("SLACK_SIGNING_SECRET is not set");
  }

  const fiveMinutesInSeconds = 5 * 60;
  const slackSignatureVersion = "v0";

  const body = await req.text();
  const timestamp = req.headers.get("x-slack-request-timestamp");
  const slackSignature = req.headers.get("x-slack-signature");

  if (!timestamp || !slackSignature) {
    throw new Error("Missing required Slack headers");
  }

  const currentTime = Math.floor(Date.now() / 1000);
  if (
    Math.abs(currentTime - Number.parseInt(timestamp, 10)) >
    fiveMinutesInSeconds
  ) {
    throw new Error("Request is too old");
  }

  const sigBasestring = `${slackSignatureVersion}:${timestamp}:${body}`;
  const mySignature = createHmac("sha256", SLACK_SIGNING_SECRET)
    .update(sigBasestring)
    .digest("hex");

  const expectedSignature = `${slackSignatureVersion}=${mySignature}`;
  const expectedBuffer = Buffer.from(expectedSignature);
  const receivedBuffer = Buffer.from(slackSignature);

  // timingSafeEqual requires buffers of equal length
  if (
    expectedBuffer.length !== receivedBuffer.length ||
    !timingSafeEqual(expectedBuffer, receivedBuffer)
  ) {
    throw new Error("Invalid Slack signature");
  }

  // Parse URL-encoded body
  const params = new URLSearchParams(body);
  const payload = params.get("payload");

  if (!payload) {
    throw new Error("No payload in request");
  }

  return JSON.parse(payload);
}

app.use("*", ...publicMiddleware);

app.openapi(
  createRoute({
    method: "post",
    path: "/",
    summary: "Slack interactions handler",
    operationId: "slackInteractions",
    description:
      "Handles interactive component actions from Slack (button clicks, etc.)",
    tags: ["Integrations"],
    responses: {
      200: {
        description: "Interaction handled successfully",
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
      // Verify and parse the Slack interaction
      const clonedRequest = c.req.raw.clone();
      const payload = await verifySlackInteraction(clonedRequest as Request);

      const parsed = slackInteractionSchema.safeParse(payload);

      if (!parsed.success) {
        logger.error("Invalid Slack interaction payload", {
          error: parsed.error.format(),
        });
        throw new HTTPException(400, {
          message: "Invalid interaction payload",
        });
      }

      const { actions, team, response_url, channel } = parsed.data;

      if (!actions.length) {
        return c.json(validateResponse({ ok: true }, successResponseSchema));
      }

      const action = actions[0]!;
      const actionId = action.action_id;

      // Handle approve/decline match actions
      if (
        actionId.startsWith("approve_match_") ||
        actionId.startsWith("decline_match_")
      ) {
        const isApprove = actionId.startsWith("approve_match_");

        // Parse action value to get inboxId, transactionId, teamId
        let actionData: {
          inboxId: string;
          transactionId: string;
          teamId: string;
        };
        try {
          actionData = JSON.parse(action.value || "{}");
        } catch {
          throw new HTTPException(400, {
            message: "Invalid action value",
          });
        }

        const { inboxId, transactionId, teamId } = actionData;

        if (!inboxId || !transactionId || !teamId) {
          throw new HTTPException(400, {
            message: "Missing required action data",
          });
        }

        // Get Slack app for response
        const slackApp = await getAppBySlackTeamId(db, {
          slackTeamId: team.id,
        });

        if (!slackApp?.config) {
          throw new HTTPException(404, {
            message: "Slack integration not found",
          });
        }

        // Security check: Verify that the teamId from the action payload matches
        if (teamId !== slackApp.teamId) {
          logger.warn("Team ID mismatch in Slack interaction", {
            payloadTeamId: teamId,
            slackAppTeamId: slackApp.teamId,
            slackTeamId: team.id,
            actionId,
          });
          throw new HTTPException(403, {
            message: "Unauthorized: Team ID mismatch",
          });
        }

        const slackClient = createSlackWebClient({
          // @ts-expect-error - config is JSONB
          token: slackApp.config.access_token,
        });

        if (isApprove) {
          // Approve the match
          try {
            // Get the suggestion to confirm
            const suggestion = await getSuggestionByInboxAndTransaction(db, {
              inboxId,
              transactionId,
              teamId,
            });

            if (!suggestion) {
              throw new Error("Match suggestion not found");
            }

            await confirmSuggestedMatch(db, {
              suggestionId: suggestion.id,
              inboxId,
              transactionId,
              userId: undefined, // Slack interactions don't have Midday user ID mapping
              teamId,
            });

            // Add checkmark emoji reaction to original processed message
            if (channel?.id) {
              await addEmojiReactionToOriginalMessage({
                db,
                slackClient,
                inboxId,
                teamId,
                channelId: channel.id,
                emojiName: "white_check_mark",
              });
            }

            // Update Slack message to show success
            await fetch(response_url, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                replace_original: true,
                text: "Match approved!",
                blocks: [
                  {
                    type: "section",
                    text: {
                      type: "mrkdwn",
                      text: "✅ *Match approved!*\n\nThe receipt has been linked to the transaction.",
                    },
                  },
                  {
                    type: "actions",
                    elements: [
                      {
                        type: "button",
                        text: {
                          type: "plain_text",
                          text: "View transaction",
                          emoji: true,
                        },
                        url: `https://app.midday.ai/transactions?id=${encodeURIComponent(transactionId)}`,
                        action_id: "view_transaction_after_match",
                      },
                    ],
                  },
                ],
              }),
            });
          } catch (error) {
            logger.error("Failed to approve Slack match", {
              error: error instanceof Error ? error.message : String(error),
              inboxId,
              transactionId,
              teamId,
            });

            // Update Slack message to show error
            await fetch(response_url, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                replace_original: true,
                text: "Failed to approve match",
                blocks: [
                  {
                    type: "section",
                    text: {
                      type: "mrkdwn",
                      text: `❌ *Failed to approve match*\n\n${error instanceof Error ? error.message : "An error occurred"}`,
                    },
                  },
                ],
              }),
            });
          }
        } else {
          // Decline the match
          try {
            // Get the suggestion to decline
            const suggestion = await getSuggestionByInboxAndTransaction(db, {
              inboxId,
              transactionId,
              teamId,
            });

            if (!suggestion) {
              throw new Error("Match suggestion not found");
            }

            await declineSuggestedMatch(db, {
              suggestionId: suggestion.id,
              inboxId,
              userId: undefined, // Slack interactions don't have Midday user ID mapping
              teamId,
            });

            // Add cross emoji reaction to original processed message
            if (channel?.id) {
              await addEmojiReactionToOriginalMessage({
                db,
                slackClient,
                inboxId,
                teamId,
                channelId: channel.id,
                emojiName: "x",
              });
            }

            // Update Slack message to show declined
            await fetch(response_url, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                replace_original: true,
                text: "Match declined",
                blocks: [
                  {
                    type: "section",
                    text: {
                      type: "mrkdwn",
                      text: "❌ *Match declined*\n\nThe suggestion has been dismissed. You can manually match this receipt in Midday.",
                    },
                  },
                  {
                    type: "actions",
                    elements: [
                      {
                        type: "button",
                        text: {
                          type: "plain_text",
                          text: "View in Midday",
                          emoji: true,
                        },
                        url: `https://app.midday.ai/inbox?inboxId=${encodeURIComponent(inboxId)}`,
                        action_id: "view_inbox_after_decline",
                      },
                    ],
                  },
                ],
              }),
            });
          } catch (error) {
            logger.error("Failed to decline Slack match", {
              error: error instanceof Error ? error.message : String(error),
              inboxId,
              transactionId,
              teamId,
            });

            await fetch(response_url, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                replace_original: true,
                text: "Failed to decline match",
                blocks: [
                  {
                    type: "section",
                    text: {
                      type: "mrkdwn",
                      text: "❌ *Failed to decline match*",
                    },
                  },
                ],
              }),
            });
          }
        }
      }

      return c.json(validateResponse({ ok: true }, successResponseSchema));
    } catch (err) {
      if (err instanceof HTTPException) {
        throw err;
      }

      if (err instanceof Error && err.message.includes("signature")) {
        throw new HTTPException(401, {
          message: "Invalid Slack signature",
        });
      }

      logger.error("Slack interactions processing failed", {
        error: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? err.stack : undefined,
      });
      throw new HTTPException(500, {
        message: "Failed to process interaction",
      });
    }
  },
);

export { app as interactionsRouter };
