import { describe, expect, test } from "bun:test";
import {
  getPlatformIdentityNotificationContext,
  requireResolvedConversationIdentity,
  withResolvedConversationIdentity,
} from "../../bot/conversation-identity";

describe("bot conversation identity hydration", () => {
  test("adds identity id and notification context for matching identity", () => {
    const resolved = withResolvedConversationIdentity(
      {
        connected: true,
        teamId: "team_123",
        actingUserId: "user_123",
      },
      {
        id: "identity_123",
        teamId: "team_123",
        userId: "user_123",
        metadata: {
          lastNotificationContext: {
            kind: "inbox_match",
          },
        },
      },
    );

    expect(resolved.identityId).toBe("identity_123");
    expect(resolved.notificationContext).toEqual({
      kind: "inbox_match",
    });
  });

  test("ignores identities that do not match the resolved user", () => {
    const resolved = withResolvedConversationIdentity(
      {
        connected: true,
        teamId: "team_123",
        actingUserId: "user_123",
      },
      {
        id: "identity_123",
        teamId: "team_123",
        userId: "user_456",
        metadata: {
          lastNotificationContext: {
            kind: "inbox_match",
          },
        },
      },
    );

    expect(resolved.identityId).toBeUndefined();
    expect(resolved.notificationContext).toBeUndefined();
  });

  test("strictly rejects missing identities", () => {
    expect(
      requireResolvedConversationIdentity(
        {
          connected: true,
          teamId: "team_123",
          actingUserId: "user_123",
        },
        null,
      ),
    ).toBeNull();
  });

  test("strictly rejects identities that do not match the resolved user", () => {
    expect(
      requireResolvedConversationIdentity(
        {
          connected: true,
          teamId: "team_123",
          actingUserId: "user_123",
        },
        {
          id: "identity_123",
          teamId: "team_123",
          userId: "user_456",
          metadata: null,
        },
      ),
    ).toBeNull();
  });

  test("returns null for missing or invalid notification context", () => {
    expect(getPlatformIdentityNotificationContext(null)).toBeNull();
    expect(
      getPlatformIdentityNotificationContext({
        lastNotificationContext: "not-an-object",
      }),
    ).toBeNull();
  });
});
