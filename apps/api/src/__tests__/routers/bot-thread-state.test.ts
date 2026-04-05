import { describe, expect, test } from "bun:test";
import { canReuseCachedThreadState } from "../../bot/thread-state";

describe("bot thread state reuse", () => {
  test("reuses cached state when the same telegram user continues", () => {
    expect(
      canReuseCachedThreadState(
        {
          teamId: "team_123",
          actingUserId: "user_123",
          platform: "telegram",
          externalUserId: "telegram_user_a",
        },
        {
          platform: "telegram",
          externalUserId: "telegram_user_a",
        },
      ),
    ).toBe(true);
  });

  test("does not reuse cached telegram state for a different sender", () => {
    expect(
      canReuseCachedThreadState(
        {
          teamId: "team_123",
          actingUserId: "user_123",
          platform: "telegram",
          externalUserId: "telegram_user_a",
        },
        {
          platform: "telegram",
          externalUserId: "telegram_user_b",
        },
      ),
    ).toBe(false);
  });

  test("does not reuse cached whatsapp state for a different sender", () => {
    expect(
      canReuseCachedThreadState(
        {
          teamId: "team_123",
          actingUserId: "user_123",
          platform: "whatsapp",
          externalUserId: "+15551234567",
        },
        {
          platform: "whatsapp",
          externalUserId: "+15557654321",
        },
      ),
    ).toBe(false);
  });

  test("does not reuse cached state when platform is missing", () => {
    expect(
      canReuseCachedThreadState(
        {
          teamId: "team_123",
          actingUserId: "user_123",
          externalUserId: "shared_user_id",
        },
        {
          platform: "telegram",
          externalUserId: "shared_user_id",
        },
      ),
    ).toBe(false);
  });

  test("does not reuse cached state without a sender id", () => {
    expect(
      canReuseCachedThreadState(
        {
          teamId: "team_123",
          actingUserId: "user_123",
          platform: "telegram",
          externalUserId: "telegram_user_a",
        },
        {
          platform: "telegram",
          externalUserId: "",
        },
      ),
    ).toBe(false);
  });
});
