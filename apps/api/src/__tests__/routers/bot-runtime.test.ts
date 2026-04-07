import { beforeEach, describe, expect, mock, test } from "bun:test";
import { mocks } from "../setup";

const streamMiddayAssistantMock = mock(() =>
  Promise.resolve({
    fullStream: "assistant reply",
    cleanup: () => Promise.resolve(),
  }),
);
const toAiMessagesMock = mock(() => Promise.resolve([]));
const buildSystemPromptMock = mock(() => "system prompt");

let subscribedMessageHandler:
  | ((thread: any, message: any) => Promise<void>)
  | undefined;
let slackDmMessageHandler:
  | ((thread: any, message: any) => Promise<void>)
  | undefined;

mock.module("@api/chat/assistant-runtime", () => ({
  streamMiddayAssistant: streamMiddayAssistantMock,
}));

mock.module("@api/chat/prompt", () => ({
  buildSystemPrompt: buildSystemPromptMock,
}));

mock.module("@api/utils/scopes", () => ({
  expandScopes: () => ["apis.all"],
}));

mock.module("chat", () => ({
  toAiMessages: toAiMessagesMock,
}));

mock.module("@midday/logger", () => ({
  createLoggerWithContext: () => ({
    info: mock(() => undefined),
    error: mock(() => undefined),
    warn: mock(() => undefined),
    debug: mock(() => undefined),
    trace: mock(() => undefined),
    fatal: mock(() => undefined),
  }),
}));

mock.module("@midday/bot", () => ({
  bot: {
    onNewMention: mock(() => undefined),
    onSubscribedMessage: mock(
      (handler: (thread: any, message: any) => Promise<void>) => {
        subscribedMessageHandler = handler;
      },
    ),
    onNewMessage: mock(
      (
        _pattern: RegExp,
        handler: (thread: any, message: any) => Promise<void>,
      ) => {
        slackDmMessageHandler = handler;
      },
    ),
    onAssistantThreadStarted: mock(() => undefined),
    onAssistantContextChanged: mock(() => undefined),
    getAdapter: mock(() => ({
      setSuggestedPrompts: mock(() => Promise.resolve()),
    })),
  },
  formatInboxResultMessage: mock(() => ""),
  formatNotificationContextForPrompt: mock(() => ""),
  formatProcessedUploadSummary: mock(() => ""),
  getPlatformInstructions: mock(() => ""),
  isSupportedInboxUploadMediaType: mock(() => false),
  processInboxUpload: mock(() => Promise.resolve(null)),
}));

const { registerMiddayBotRuntime } = await import("../../bot/runtime");

registerMiddayBotRuntime();

function createLinkedUser() {
  return {
    id: "user_123",
    email: "test@example.com",
    timezone: "UTC",
    locale: "en",
    dateFormat: null,
    timeFormat: 24,
    fullName: "Test User",
    team: {
      baseCurrency: "USD",
      name: "Midday Test Team",
      countryCode: "US",
    },
  };
}

function createThread(
  platform: "whatsapp" | "telegram" | "slack" | "sendblue",
) {
  const posts: string[] = [];
  const sendMediaMessageMock = mock(() => Promise.resolve());

  return {
    posts,
    sendMediaMessageMock,
    thread: {
      adapter: { name: platform, sendMediaMessage: sendMediaMessageMock },
      id: `${platform}_thread_123`,
      channelId: `${platform}_channel_123`,
      isDM: platform === "slack",
      recentMessages: [],
      state: {},
      setState: mock(() => Promise.resolve()),
      post: mock((text: string) => {
        posts.push(text);
        return Promise.resolve();
      }),
      startTyping: mock(() => Promise.resolve()),
      subscribe: mock(() => Promise.resolve()),
      refresh: mock(() => Promise.resolve()),
    },
  };
}

function primeCommonLinkingMocks() {
  mocks.hasTeamAccess.mockReset();
  mocks.hasTeamAccess.mockImplementation(() => Promise.resolve(true));
  mocks.getTeamById.mockReset();
  mocks.getTeamById.mockImplementation(() =>
    Promise.resolve({ name: "Midday Test Team" }),
  );
  mocks.getUserById.mockReset();
  mocks.getUserById.mockImplementation(() =>
    Promise.resolve(createLinkedUser()),
  );
  mocks.createOrUpdatePlatformIdentity.mockReset();
  mocks.createOrUpdatePlatformIdentity.mockImplementation(() =>
    Promise.resolve({ id: "identity_123" }),
  );

  streamMiddayAssistantMock.mockReset();
  streamMiddayAssistantMock.mockImplementation(() =>
    Promise.resolve({
      fullStream: "assistant reply",
      cleanup: () => Promise.resolve(),
    }),
  );
  toAiMessagesMock.mockReset();
  toAiMessagesMock.mockImplementation(() => Promise.resolve([]));
  buildSystemPromptMock.mockReset();
  buildSystemPromptMock.mockImplementation(() => "system prompt");

  mocks.consumePlatformLinkToken.mockReset();
  mocks.consumePlatformLinkToken.mockImplementation(() =>
    Promise.resolve({
      code: "abc12345",
      provider: "whatsapp",
      teamId: "team_123",
      userId: "user_123",
    }),
  );

  mocks.getPlatformIdentity.mockReset();
  mocks.getPlatformIdentity
    .mockImplementationOnce(() => Promise.resolve(null))
    .mockImplementationOnce(() =>
      Promise.resolve({
        id: "identity_123",
        teamId: "team_123",
        userId: "user_123",
        metadata: null,
      }),
    );
}

describe("bot runtime link-code consumption", () => {
  beforeEach(() => {
    primeCommonLinkingMocks();

    mocks.addWhatsAppConnection.mockReset();
    mocks.addWhatsAppConnection.mockImplementation(() =>
      Promise.resolve({ id: "whatsapp_app_123" }),
    );

    mocks.addTelegramConnection.mockReset();
    mocks.addTelegramConnection.mockImplementation(() =>
      Promise.resolve({ id: "telegram_app_123" }),
    );

    mocks.getAppBySlackTeamId.mockReset();
    mocks.getAppBySlackTeamId.mockImplementation(() => Promise.resolve(null));
  });

  test("consumes a first-time WhatsApp link code before assistant processing", async () => {
    const { posts, thread } = createThread("whatsapp");
    const message = {
      id: "message_123",
      text: "Connect to Midday: abc12345",
      author: {
        userId: "+15551234567",
        fullName: "WhatsApp User",
        userName: "whatsapp_user",
      },
      attachments: [],
    };

    await subscribedMessageHandler?.(thread, message);

    expect(posts).toEqual([
      "Connected to Midday Test Team. You can chat with Midday, send receipts and PDFs, or create invoices \u2014 all from WhatsApp.\n\nYou'll receive notifications for new transactions, invoices, and receipt matches (all on by default). To manage these, go to Apps \u2192 WhatsApp \u2192 Settings in Midday.\n\nTry sending a receipt or asking \u201cWhat did I spend this week?\u201d",
    ]);
    expect(streamMiddayAssistantMock).not.toHaveBeenCalled();
    expect(toAiMessagesMock).not.toHaveBeenCalled();
    expect(mocks.getUserById).not.toHaveBeenCalled();
    expect(thread.startTyping).not.toHaveBeenCalled();
  });

  test("consumes a first-time Telegram link code before assistant processing", async () => {
    const { posts, thread } = createThread("telegram");
    const message = {
      id: "message_123",
      text: "/start abc12345",
      author: {
        userId: "telegram_user_123",
        fullName: "Telegram User",
        userName: "telegram_user",
      },
      attachments: [],
    };

    mocks.consumePlatformLinkToken.mockReset();
    mocks.consumePlatformLinkToken.mockImplementation(() =>
      Promise.resolve({
        code: "abc12345",
        provider: "telegram",
        teamId: "team_123",
        userId: "user_123",
      }),
    );

    await subscribedMessageHandler?.(thread, message);

    expect(posts).toEqual([
      "Connected to Midday Test Team. You can chat with Midday, send receipts and PDFs, or create invoices \u2014 all from Telegram.\n\nYou'll receive notifications for new transactions, invoices, and receipt matches (all on by default). To manage these, go to Apps \u2192 Telegram \u2192 Settings in Midday.\n\nTry sending a receipt or asking \u201cWhat did I spend this week?\u201d",
    ]);
    expect(streamMiddayAssistantMock).not.toHaveBeenCalled();
    expect(toAiMessagesMock).not.toHaveBeenCalled();
    expect(mocks.getUserById).not.toHaveBeenCalled();
    expect(thread.startTyping).not.toHaveBeenCalled();
  });

  test("consumes a first-time Slack link code before assistant processing", async () => {
    const { posts, thread } = createThread("slack");
    const message = {
      id: "message_123",
      text: "Connect to Midday: abc12345",
      raw: {
        team: "T123",
      },
      author: {
        userId: "U123",
        fullName: "Slack User",
        userName: "slack_user",
      },
      attachments: [],
    };

    mocks.consumePlatformLinkToken.mockReset();
    mocks.consumePlatformLinkToken.mockImplementation(() =>
      Promise.resolve({
        code: "abc12345",
        provider: "slack",
        teamId: "team_123",
        userId: "user_123",
      }),
    );

    await slackDmMessageHandler?.(thread, message);

    expect(posts).toEqual([
      "Connected to Midday Test Team. You can ask Midday questions, upload receipts, and track invoices right from Slack.\n\nYou'll receive notifications for new transactions, invoices, and match suggestions (all on by default). To manage these, go to Apps \u2192 Slack \u2192 Settings in Midday.\n\nTry asking \u201cWhat's my cash flow this month?\u201d",
    ]);
    expect(streamMiddayAssistantMock).not.toHaveBeenCalled();
    expect(toAiMessagesMock).not.toHaveBeenCalled();
    expect(mocks.getUserById).not.toHaveBeenCalled();
    expect(thread.startTyping).not.toHaveBeenCalled();
  });

  test("consumes a first-time Sendblue link code and sends vCard", async () => {
    const { posts, sendMediaMessageMock, thread } = createThread("sendblue");
    const message = {
      id: "message_123",
      text: "abc12345",
      author: {
        userId: "+14155551234",
        fullName: "iMessage User",
        userName: "+14155551234",
      },
      attachments: [],
    };

    mocks.consumePlatformLinkToken.mockReset();
    mocks.consumePlatformLinkToken.mockImplementation(() =>
      Promise.resolve({
        code: "abc12345",
        provider: "sendblue",
        teamId: "team_123",
        userId: "user_123",
      }),
    );

    await subscribedMessageHandler?.(thread, message);

    expect(posts).toEqual([
      "Connected to Midday Test Team. You can chat with Midday, send receipts and PDFs, or create invoices \u2014 all from iMessage.\n\nYou'll receive notifications for new transactions, invoices, and receipt matches (all on by default). To manage these, go to Apps \u2192 iMessage \u2192 Settings in Midday.\n\nTry sending a receipt or asking \u201cWhat did I spend this week?\u201d",
    ]);
    expect(sendMediaMessageMock).toHaveBeenCalledWith(
      thread.id,
      "https://cdn.midday.ai/midday-contact.vcf",
    );
    expect(streamMiddayAssistantMock).not.toHaveBeenCalled();
    expect(toAiMessagesMock).not.toHaveBeenCalled();
    expect(mocks.getUserById).not.toHaveBeenCalled();
    expect(thread.startTyping).not.toHaveBeenCalled();
  });

  test("re-connects Slack DM when an existing identity exists and a new link code is sent", async () => {
    const { posts, thread } = createThread("slack");
    const message = {
      id: "message_123",
      text: "Connect to Midday: xyzABCDE",
      raw: {
        team: "T123",
      },
      author: {
        userId: "U123",
        fullName: "Slack User",
        userName: "slack_user",
      },
      attachments: [],
    };

    mocks.consumePlatformLinkToken.mockReset();
    mocks.consumePlatformLinkToken.mockImplementation(() =>
      Promise.resolve({
        code: "xyzABCDE",
        provider: "slack",
        teamId: "team_new",
        userId: "user_new",
      }),
    );

    mocks.hasTeamAccess.mockReset();
    mocks.hasTeamAccess.mockImplementation(() => Promise.resolve(true));

    mocks.getPlatformIdentity.mockReset();
    mocks.getPlatformIdentity.mockImplementation(() =>
      Promise.resolve({
        id: "stale_identity",
        teamId: "team_old",
        userId: "user_old",
        metadata: null,
      }),
    );

    mocks.createOrUpdatePlatformIdentity.mockReset();
    mocks.createOrUpdatePlatformIdentity.mockImplementation(() =>
      Promise.resolve({ id: "identity_new" }),
    );

    mocks.getTeamById.mockReset();
    mocks.getTeamById.mockImplementation(() =>
      Promise.resolve({ name: "New Slack Team" }),
    );

    await slackDmMessageHandler?.(thread, message);

    expect(posts).toEqual([
      "Connected to New Slack Team. You can ask Midday questions, upload receipts, and track invoices right from Slack.\n\nYou'll receive notifications for new transactions, invoices, and match suggestions (all on by default). To manage these, go to Apps \u2192 Slack \u2192 Settings in Midday.\n\nTry asking \u201cWhat's my cash flow this month?\u201d",
    ]);
    expect(mocks.consumePlatformLinkToken).toHaveBeenCalled();
    expect(mocks.createOrUpdatePlatformIdentity).toHaveBeenCalled();
    expect(streamMiddayAssistantMock).not.toHaveBeenCalled();
  });

  test("re-connects Sendblue when a stale identity exists and a new link code is sent", async () => {
    const { posts, thread } = createThread("sendblue");
    const message = {
      id: "message_123",
      text: "abc12345",
      author: {
        userId: "+14155551234",
        fullName: "iMessage User",
        userName: "+14155551234",
      },
      attachments: [],
    };

    mocks.consumePlatformLinkToken.mockReset();
    mocks.consumePlatformLinkToken.mockImplementation(() =>
      Promise.resolve({
        code: "abc12345",
        provider: "sendblue",
        teamId: "team_new",
        userId: "user_new",
      }),
    );

    mocks.hasTeamAccess.mockReset();
    mocks.hasTeamAccess.mockImplementation(() => Promise.resolve(true));

    mocks.getPlatformIdentity.mockReset();
    mocks.getPlatformIdentity.mockImplementation(() =>
      Promise.resolve({
        id: "stale_identity",
        teamId: "team_old",
        userId: "user_old",
        metadata: null,
      }),
    );

    mocks.createOrUpdatePlatformIdentity.mockReset();
    mocks.createOrUpdatePlatformIdentity.mockImplementation(() =>
      Promise.resolve({ id: "identity_new" }),
    );

    mocks.getTeamById.mockReset();
    mocks.getTeamById.mockImplementation(() =>
      Promise.resolve({ name: "New Team" }),
    );

    await subscribedMessageHandler?.(thread, message);

    expect(posts).toEqual([
      "Connected to New Team. You can chat with Midday, send receipts and PDFs, or create invoices \u2014 all from iMessage.\n\nYou'll receive notifications for new transactions, invoices, and receipt matches (all on by default). To manage these, go to Apps \u2192 iMessage \u2192 Settings in Midday.\n\nTry sending a receipt or asking \u201cWhat did I spend this week?\u201d",
    ]);
    expect(mocks.consumePlatformLinkToken).toHaveBeenCalled();
    expect(mocks.createOrUpdatePlatformIdentity).toHaveBeenCalled();
    expect(streamMiddayAssistantMock).not.toHaveBeenCalled();
  });

  test("bare alphanumeric message from unlinked WhatsApp user shows prompt, not invalid-code error", async () => {
    const { posts, thread } = createThread("whatsapp");
    const message = {
      id: "message_123",
      text: "test1234",
      author: {
        userId: "+15559999999",
        fullName: "New User",
        userName: "new_user",
      },
      attachments: [],
    };

    mocks.consumePlatformLinkToken.mockReset();
    mocks.consumePlatformLinkToken.mockImplementation(() =>
      Promise.resolve(null),
    );

    mocks.getPlatformIdentity.mockReset();
    mocks.getPlatformIdentity.mockImplementation(() => Promise.resolve(null));

    await subscribedMessageHandler?.(thread, message);

    expect(posts).toEqual([
      "Connect WhatsApp from Midday first, then send the prefilled connection message here.",
    ]);
    expect(streamMiddayAssistantMock).not.toHaveBeenCalled();
  });

  test("bare alphanumeric message from unlinked Sendblue user shows prompt, not invalid-code error", async () => {
    const { posts, thread } = createThread("sendblue");
    const message = {
      id: "message_123",
      text: "test1234",
      author: {
        userId: "+15559999999",
        fullName: "New User",
        userName: "+15559999999",
      },
      attachments: [],
    };

    mocks.consumePlatformLinkToken.mockReset();
    mocks.consumePlatformLinkToken.mockImplementation(() =>
      Promise.resolve(null),
    );

    mocks.getPlatformIdentity.mockReset();
    mocks.getPlatformIdentity.mockImplementation(() => Promise.resolve(null));

    await subscribedMessageHandler?.(thread, message);

    expect(posts).toEqual([
      "Connect iMessage from Midday first, then send the connection code here.",
    ]);
    expect(streamMiddayAssistantMock).not.toHaveBeenCalled();
  });

  test("connected Slack DM user sending bare alphanumeric message gets assistant reply, not invalid-code error", async () => {
    const { posts, thread } = createThread("slack");
    const message = {
      id: "message_123",
      text: "test1234",
      raw: {
        team: "T123",
      },
      author: {
        userId: "U123",
        fullName: "Slack User",
        userName: "slack_user",
      },
      attachments: [],
    };

    mocks.consumePlatformLinkToken.mockReset();
    mocks.consumePlatformLinkToken.mockImplementation(() =>
      Promise.resolve(null),
    );

    mocks.hasTeamAccess.mockReset();
    mocks.hasTeamAccess.mockImplementation(() => Promise.resolve(true));

    mocks.getPlatformIdentity.mockReset();
    mocks.getPlatformIdentity.mockImplementation(() =>
      Promise.resolve({
        id: "identity_123",
        teamId: "team_123",
        userId: "user_123",
        metadata: null,
      }),
    );

    mocks.getUserById.mockReset();
    mocks.getUserById.mockImplementation(() =>
      Promise.resolve(createLinkedUser()),
    );

    await slackDmMessageHandler?.(thread, message);

    expect(posts).not.toContain(
      "That Slack link code is invalid or expired. Open Midday and generate a new one.",
    );
    expect(streamMiddayAssistantMock).toHaveBeenCalled();
    expect(thread.startTyping).toHaveBeenCalled();
  });

  test("afterConnect failure does not leave an orphaned identity (WhatsApp)", async () => {
    const { posts, thread } = createThread("whatsapp");
    const message = {
      id: "message_123",
      text: "Connect to Midday: abc12345",
      author: {
        userId: "+15551234567",
        fullName: "WhatsApp User",
        userName: "whatsapp_user",
      },
      attachments: [],
    };

    mocks.addWhatsAppConnection.mockReset();
    mocks.addWhatsAppConnection.mockImplementation(() => Promise.resolve(null));

    await subscribedMessageHandler?.(thread, message);

    expect(posts).toEqual([
      "Connected, but I couldn't finish setup. Try again.",
    ]);
    expect(mocks.createOrUpdatePlatformIdentity).not.toHaveBeenCalled();
    expect(streamMiddayAssistantMock).not.toHaveBeenCalled();
  });

  test("afterConnect failure does not leave an orphaned identity (Telegram)", async () => {
    const { posts, thread } = createThread("telegram");
    const message = {
      id: "message_123",
      text: "/start abc12345",
      author: {
        userId: "telegram_user_123",
        fullName: "Telegram User",
        userName: "telegram_user",
      },
      attachments: [],
    };

    mocks.consumePlatformLinkToken.mockReset();
    mocks.consumePlatformLinkToken.mockImplementation(() =>
      Promise.resolve({
        code: "abc12345",
        provider: "telegram",
        teamId: "team_123",
        userId: "user_123",
      }),
    );

    mocks.addTelegramConnection.mockReset();
    mocks.addTelegramConnection.mockImplementation(() => Promise.resolve(null));

    await subscribedMessageHandler?.(thread, message);

    expect(posts).toEqual([
      "Connected, but I couldn't finish setup. Try again.",
    ]);
    expect(mocks.createOrUpdatePlatformIdentity).not.toHaveBeenCalled();
    expect(streamMiddayAssistantMock).not.toHaveBeenCalled();
  });

  test("explicit 'Connect to Midday:' with invalid code shows invalid-code error", async () => {
    const { posts, thread } = createThread("whatsapp");
    const message = {
      id: "message_123",
      text: "Connect to Midday: xyzW0000",
      author: {
        userId: "+15559999999",
        fullName: "New User",
        userName: "new_user",
      },
      attachments: [],
    };

    mocks.consumePlatformLinkToken.mockReset();
    mocks.consumePlatformLinkToken.mockImplementation(() =>
      Promise.resolve(null),
    );

    mocks.getPlatformIdentity.mockReset();
    mocks.getPlatformIdentity.mockImplementation(() => Promise.resolve(null));

    await subscribedMessageHandler?.(thread, message);

    expect(posts).toEqual([
      "That WhatsApp link code is invalid or expired. Open Midday and generate a new one.",
    ]);
    expect(streamMiddayAssistantMock).not.toHaveBeenCalled();
  });

  test("explicit 'Connect to Midday:' with invalid code shows error even when existing identity exists", async () => {
    const { posts, thread } = createThread("whatsapp");
    const message = {
      id: "message_123",
      text: "Connect to Midday: xyzW0000",
      author: {
        userId: "+15551234567",
        fullName: "WhatsApp User",
        userName: "whatsapp_user",
      },
      attachments: [],
    };

    mocks.consumePlatformLinkToken.mockReset();
    mocks.consumePlatformLinkToken.mockImplementation(() =>
      Promise.resolve(null),
    );

    mocks.getPlatformIdentity.mockReset();
    mocks.getPlatformIdentity.mockImplementation(() =>
      Promise.resolve({
        id: "identity_123",
        teamId: "team_123",
        userId: "user_123",
        metadata: null,
      }),
    );

    mocks.hasTeamAccess.mockReset();
    mocks.hasTeamAccess.mockImplementation(() => Promise.resolve(true));

    await subscribedMessageHandler?.(thread, message);

    expect(posts).toEqual([
      "That WhatsApp link code is invalid or expired. Open Midday and generate a new one.",
    ]);
    expect(streamMiddayAssistantMock).not.toHaveBeenCalled();
  });

  test("explicit 'Connect to Midday:' with malformed code (too short) shows invalid-code error", async () => {
    const { posts, thread } = createThread("whatsapp");
    const message = {
      id: "message_123",
      text: "Connect to Midday: short",
      author: {
        userId: "+15559999999",
        fullName: "New User",
        userName: "new_user",
      },
      attachments: [],
    };

    mocks.consumePlatformLinkToken.mockReset();
    mocks.consumePlatformLinkToken.mockImplementation(() =>
      Promise.resolve(null),
    );

    mocks.getPlatformIdentity.mockReset();
    mocks.getPlatformIdentity.mockImplementation(() => Promise.resolve(null));

    await subscribedMessageHandler?.(thread, message);

    expect(posts).toEqual([
      "That WhatsApp link code is invalid or expired. Open Midday and generate a new one.",
    ]);
    expect(streamMiddayAssistantMock).not.toHaveBeenCalled();
  });

  test("telegram /start with malformed code (too long) shows invalid-code error", async () => {
    const { posts, thread } = createThread("telegram");
    const message = {
      id: "message_123",
      text: "/start toolongcode123",
      author: {
        userId: "telegram_user_123",
        fullName: "Telegram User",
        userName: "telegram_user",
      },
      attachments: [],
    };

    mocks.consumePlatformLinkToken.mockReset();
    mocks.consumePlatformLinkToken.mockImplementation(() =>
      Promise.resolve(null),
    );

    mocks.getPlatformIdentity.mockReset();
    mocks.getPlatformIdentity.mockImplementation(() => Promise.resolve(null));

    await subscribedMessageHandler?.(thread, message);

    expect(posts).toEqual([
      "That Telegram link code is invalid or expired. Open Midday and generate a new one.",
    ]);
    expect(streamMiddayAssistantMock).not.toHaveBeenCalled();
  });
});
