import { describe, expect, test } from "bun:test";
import { extractConnectionToken } from "../../bot/linking";

describe("bot link code extraction", () => {
  test("extracts telegram start payloads", () => {
    expect(extractConnectionToken("telegram", "/start mb_abc123456789")).toBe(
      "mb_abc123456789",
    );
    expect(
      extractConnectionToken("telegram", "/start@midday_bot mb_abc123456789"),
    ).toBe("mb_abc123456789");
  });

  test("extracts whatsapp and slack link messages", () => {
    expect(
      extractConnectionToken("whatsapp", "Connect to Midday: mb_abc123456789"),
    ).toBe("mb_abc123456789");
    expect(
      extractConnectionToken("slack", "Connect to Midday: mb_abc123456789"),
    ).toBe("mb_abc123456789");
  });

  test("ignores non-link messages", () => {
    expect(extractConnectionToken("telegram", "/start team_inbox_id")).toBeNull();
    expect(extractConnectionToken("slack", "Summarize my cash flow")).toBeNull();
    expect(extractConnectionToken("whatsapp", "hello there")).toBeNull();
  });
});
