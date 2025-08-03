import { createApp } from "@midday/app-store/db";
import {
  config,
  createSlackApp,
  getSlackInstaller,
} from "@midday/app-store/slack";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const paramsSchema = z.object({
  code: z.string(),
  state: z.string(),
});

const metadataSchema = z.object({
  teamId: z.string(),
  userId: z.string(),
});

const slackAuthResponseSchema = z.object({
  ok: z.literal(true),
  app_id: z.string(),
  authed_user: z.object({
    id: z.string(),
  }),
  scope: z.string(),
  token_type: z.literal("bot"),
  access_token: z.string(),
  bot_user_id: z.string(),
  team: z.object({
    id: z.string(),
    name: z.string(),
  }),
  incoming_webhook: z.object({
    channel: z.string(),
    channel_id: z.string(),
    configuration_url: z.string().url(),
    url: z.string().url(),
  }),
});

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);

  const rawParams = Object.fromEntries(requestUrl.searchParams.entries());
  const parsedParams = paramsSchema.safeParse(rawParams);

  if (!parsedParams.success) {
    console.error("Invalid params", parsedParams.error.errors);
    return NextResponse.json({ error: "Invalid params" }, { status: 400 });
  }

  const veryfiedState = await getSlackInstaller().stateStore?.verifyStateParam(
    new Date(),
    parsedParams.data.state,
  );
  const parsedMetadata = metadataSchema.safeParse(
    JSON.parse(veryfiedState?.metadata ?? "{}"),
  );

  if (!parsedMetadata.success) {
    console.error("Invalid metadata", parsedMetadata.error.errors);
    return NextResponse.json({ error: "Invalid metadata" }, { status: 400 });
  }

  try {
    const slackOauthAccessUrl = [
      "https://slack.com/api/oauth.v2.access",
      `?client_id=${process.env.NEXT_PUBLIC_SLACK_CLIENT_ID}`,
      `&client_secret=${process.env.SLACK_CLIENT_SECRET}`,
      `&code=${parsedParams.data.code}`,
      `&redirect_uri=${process.env.NEXT_PUBLIC_SLACK_OAUTH_REDIRECT_URL}`,
    ].join("");

    const response = await fetch(slackOauthAccessUrl);
    const json = await response.json();

    const parsedJson = slackAuthResponseSchema.safeParse(json);

    if (!parsedJson.success) {
      console.error(
        "Invalid JSON response from slack",
        parsedJson.error.errors,
      );
      return NextResponse.json(
        { error: "Failed to exchange code for token" },
        { status: 500 },
      );
    }

    const createdSlackIntegration = await createApp({
      team_id: parsedMetadata.data.teamId,
      created_by: parsedMetadata.data.userId,
      app_id: config.id,
      settings: config.settings,
      config: {
        access_token: parsedJson.data.access_token,
        team_id: parsedJson.data.team.id,
        team_name: parsedJson.data.team.name,
        channel: parsedJson.data.incoming_webhook.channel,
        channel_id: parsedJson.data.incoming_webhook.channel_id,
        slack_configuration_url:
          parsedJson.data.incoming_webhook.configuration_url,
        url: parsedJson.data.incoming_webhook.url,
        bot_user_id: parsedJson.data.bot_user_id,
      },
    });

    if (createdSlackIntegration?.config) {
      const slackApp = createSlackApp({
        // @ts-expect-error - config is JSONB
        token: createdSlackIntegration?.config?.access_token,
        // @ts-expect-error - config is JSONB
        botId: createdSlackIntegration?.config?.bot_user_id,
      });

      try {
        await slackApp.client.chat.postMessage({
          // @ts-expect-error - config is JSONB
          channel: createdSlackIntegration?.config?.channel_id,
          unfurl_links: false,
          unfurl_media: false,
          blocks: [
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text: "Hello there! 👋 I'm your new Midday bot, I'll send notifications in this channel regarding new transactions and other important updates.",
              },
            },
            {
              type: "divider",
            },
            {
              type: "context",
              elements: [
                {
                  type: "mrkdwn",
                  text: "<https://app.midday.ai/apps?app=slack&settings=true|Notification settings>",
                },
              ],
            },
          ],
        });
      } catch (err) {
        console.error(err);
      }

      const requestUrl = new URL(request.url);

      if (process.env.NODE_ENV === "development") {
        requestUrl.protocol = "http";
      }

      // This window will be in a popup so we redirect to the all-done route which closes the window
      // and then sends a browser event to the parent window. Actions can be taken based on this event.
      return NextResponse.redirect(
        `${requestUrl.origin}/all-done?event=app_oauth_completed`,
      );
    }
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to exchange code for token" },
      { status: 500 },
    );
  }

  return NextResponse.json(
    { error: "Failed to exchange code for token" },
    { status: 500 },
  );
}
