import { createApp } from "@midday/apps/db";
import { config, createSlackApp, slackInstaller } from "@midday/apps/slack";
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

  const parsedMetadata = metadataSchema.safeParse(
    JSON.parse(parsedParams.data.state),
  );

  // const veryfiedState = await slackInstaller.stateStore?.verifyStateParam(
  //   new Date(),
  //   parsedParams.data.state,
  // );

  // const parsedMetadata = metadataSchema.safeParse(
  //   JSON.parse(veryfiedState?.metadata ?? "{}"),
  // );

  // if (!parsedMetadata.success) {
  //   console.error("Invalid metadata", parsedMetadata.error.errors);
  //   return NextResponse.json({ error: "Invalid metadata" }, { status: 400 });
  // }

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

    console.log(parsedMetadata);

    const createdSlackIntegration = await createApp({
      team_id: parsedMetadata.data.teamId,
      app_id: config.id,
      settings: {
        access_token: parsedJson.data.access_token,
        team_id: parsedJson.data.team.id,
        team_name: parsedJson.data.team.name,
        channel: parsedJson.data.incoming_webhook.channel,
        channel_id: parsedJson.data.incoming_webhook.channel_id,
        slack_configuration_url:
          parsedJson.data.incoming_webhook.configuration_url,
        url: parsedJson.data.incoming_webhook.url,
      },
    });

    // const createdSlackIntegration = await prisma.integrationSlack
    //   .upsert({
    //     where: {
    //       team_id: parsedMetadata.data.teamId,
    //       team: {
    //         members: {
    //           some: {
    //             user_id: parsedMetadata.data.userId,
    //           },
    //         },
    //       },
    //     },
    //     update: {},
    //     create: {
    // team_id: parsedMetadata.data.teamId,
    // slack_access_token: parsedJson.data.access_token,
    // slack_team_id: parsedJson.data.team.id,
    // slack_team_name: parsedJson.data.team.name,
    // slack_channel: parsedJson.data.incoming_webhook.channel,
    // slack_channel_id: parsedJson.data.incoming_webhook.channel_id,
    // slack_configuration_url:
    //   parsedJson.data.incoming_webhook.configuration_url,
    // slack_url: parsedJson.data.incoming_webhook.url,
    // slack_bot_user_id: parsedJson.data.bot_user_id,
    //     },
    //     select: {
    //       slack_access_token: true,
    //       slack_bot_user_id: true,
    //       slack_channel_id: true,
    //       team: {
    //         select: {
    //           id: true,
    //           name: true,
    //         },
    //       },
    //     },
    //   })
    //   .catch((_err) => {
    //     throw new Error("Failed to create slack integration");
    //   });

    if (true) {
      // const slackApp = createSlackApp({
      //   token: createdSlackIntegration.slack_access_token,
      //   botId: createdSlackIntegration.slack_bot_user_id,
      // });

      // slackApp.client.chat.postMessage({
      //   channel: createdSlackIntegration.slack_channel_id,
      //   text: `👋 Hello, I'm Seventy Seven. I'll send notifications in this channel for the *${createdSlackIntegration.team.name}* team`,
      // });

      // const requestUrl = new URL(request.url);

      // if (process.env.NODE_ENV === "development") {
      //   requestUrl.protocol = "http";
      // }

      //   analyticsClient.event("slack_integration_complete", {
      //     team_id: createdSlackIntegration.team.id,
      //     profileId: parsedMetadata.data.userId,
      //   });

      // This window will be in a popup so we redirect to the all-done route which closes the window
      // and then sends a browser event to the parent window. Actions can be taken based on this event.
      return NextResponse.redirect(
        `${requestUrl.origin}/all-done?event=slack_oauth_completed`,
      );
      // return NextResponse.redirect(`${requestUrl.origin}/settings/integrations`)
    }
  } catch (err) {
    console.error(err);
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
