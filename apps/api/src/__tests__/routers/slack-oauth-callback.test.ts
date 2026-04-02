import { beforeEach, describe, expect, mock, test } from "bun:test";
import { createTestApp } from "../helpers";
import { mocks } from "../setup";

const initializeMock = mock(() => Promise.resolve());
const setInstallationMock = mock(() => Promise.resolve());
const getAdapterMock = mock(() => ({
  setInstallation: setInstallationMock,
}));
const verifyStateParamMock = mock(() =>
  Promise.resolve({
    metadata: JSON.stringify({
      teamId: "team_123",
      userId: "user_123",
    }),
  }),
);
const createSlackWebClientMock = mock(() => ({}));
const publishAppHomeMock = mock(() => Promise.resolve());
const createSlackAppMock = mock(() => ({
  client: {
    chat: {
      postMessage: mock(() => Promise.resolve()),
    },
  },
}));
const ensureBotInChannelMock = mock(() => Promise.resolve());

mock.module("@midday/bot", () => ({
  bot: {
    initialize: initializeMock,
    getAdapter: getAdapterMock,
  },
}));

mock.module("@midday/app-store/slack", () => ({
  config: {
    id: "slack",
    settings: {
      events: [],
    },
  },
}));

mock.module("@midday/app-store/slack/server", () => ({
  getSlackInstaller: () => ({
    stateStore: {
      verifyStateParam: verifyStateParamMock,
    },
  }),
  createSlackWebClient: createSlackWebClientMock,
  publishAppHome: publishAppHomeMock,
  createSlackApp: createSlackAppMock,
  ensureBotInChannel: ensureBotInChannelMock,
}));

const { oauthCallbackRouter } = await import(
  "../../rest/routers/apps/slack/oauth-callback"
);

function createApp() {
  const app = createTestApp();
  app.route("/apps/slack/oauth-callback", oauthCallbackRouter);
  return app;
}

const slackOAuthResponse = {
  ok: true,
  app_id: "A123",
  authed_user: {
    id: "U123",
  },
  scope: "chat:write",
  token_type: "bot",
  access_token: "xoxb-test-token",
  bot_user_id: "B123",
  team: {
    id: "T123",
    name: "Midday Test Team",
  },
  incoming_webhook: {
    channel: "#general",
    channel_id: "C123",
    configuration_url: "https://slack.com/app_redirect?channel=C123",
    url: "https://hooks.slack.com/services/test",
  },
};

describe("REST: GET /apps/slack/oauth-callback", () => {
  const app = createApp();

  beforeEach(() => {
    process.env.SLACK_CLIENT_ID = "client-id";
    process.env.SLACK_CLIENT_SECRET = "client-secret";
    process.env.SLACK_OAUTH_REDIRECT_URL =
      "http://localhost:3003/apps/slack/oauth-callback";

    initializeMock.mockReset();
    initializeMock.mockImplementation(() => Promise.resolve());
    setInstallationMock.mockReset();
    setInstallationMock.mockImplementation(() => Promise.resolve());
    getAdapterMock.mockReset();
    getAdapterMock.mockImplementation(() => ({
      setInstallation: setInstallationMock,
    }));
    verifyStateParamMock.mockReset();
    verifyStateParamMock.mockImplementation(() =>
      Promise.resolve({
        metadata: JSON.stringify({
          teamId: "team_123",
          userId: "user_123",
        }),
      }),
    );
    createSlackWebClientMock.mockReset();
    createSlackWebClientMock.mockImplementation(() => ({}));
    publishAppHomeMock.mockReset();
    publishAppHomeMock.mockImplementation(() => Promise.resolve());
    createSlackAppMock.mockReset();
    createSlackAppMock.mockImplementation(() => ({
      client: {
        chat: {
          postMessage: mock(() => Promise.resolve()),
        },
      },
    }));
    ensureBotInChannelMock.mockReset();
    ensureBotInChannelMock.mockImplementation(() => Promise.resolve());

    mocks.createApp.mockReset();
    mocks.createApp.mockImplementation(() =>
      Promise.resolve({
        config: {
          access_token: slackOAuthResponse.access_token,
          channel_id: slackOAuthResponse.incoming_webhook.channel_id,
          bot_user_id: slackOAuthResponse.bot_user_id,
          url: slackOAuthResponse.incoming_webhook.url,
        },
        settings: {},
      }),
    );
    mocks.createOrUpdatePlatformIdentity.mockReset();
    mocks.createOrUpdatePlatformIdentity.mockImplementation(() =>
      Promise.resolve({
        id: "identity_123",
      }),
    );

    globalThis.fetch = mock(() =>
      Promise.resolve(
        new Response(JSON.stringify(slackOAuthResponse), {
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
        }),
      ),
    ) as unknown as typeof fetch;
  });

  test("persists Slack installation only after database records exist", async () => {
    const callOrder: string[] = [];

    mocks.createApp.mockImplementationOnce(() => {
      callOrder.push("createApp");
      return Promise.resolve({
        config: {
          access_token: slackOAuthResponse.access_token,
          channel_id: slackOAuthResponse.incoming_webhook.channel_id,
          bot_user_id: slackOAuthResponse.bot_user_id,
          url: slackOAuthResponse.incoming_webhook.url,
        },
        settings: {},
      });
    });
    mocks.createOrUpdatePlatformIdentity.mockImplementationOnce(() => {
      callOrder.push("createOrUpdatePlatformIdentity");
      return Promise.resolve({
        id: "identity_123",
      });
    });
    initializeMock.mockImplementationOnce(() => {
      callOrder.push("initialize");
      return Promise.resolve();
    });
    setInstallationMock.mockImplementationOnce(() => {
      callOrder.push("setInstallation");
      return Promise.resolve();
    });

    const res = await app.request(
      "/apps/slack/oauth-callback?code=test-code&state=test-state",
    );

    expect(res.status).toBe(302);
    expect(callOrder).toEqual([
      "createApp",
      "createOrUpdatePlatformIdentity",
      "initialize",
      "setInstallation",
    ]);
  });

  test("does not store the Slack installation when app creation fails", async () => {
    mocks.createApp.mockImplementationOnce(() =>
      Promise.reject(new Error("insert failed")),
    );

    const res = await app.request(
      "/apps/slack/oauth-callback?code=test-code&state=test-state",
    );

    expect(res.status).toBe(500);
    expect(initializeMock).not.toHaveBeenCalled();
    expect(setInstallationMock).not.toHaveBeenCalled();
    expect(mocks.createOrUpdatePlatformIdentity).not.toHaveBeenCalled();
  });
});
