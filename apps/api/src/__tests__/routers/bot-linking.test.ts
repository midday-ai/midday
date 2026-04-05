import { describe, expect, test } from "bun:test";
import { extractConnectionToken } from "../../bot/linking";

describe("bot link code extraction", () => {
  test("extracts telegram start payloads", () => {
    expect(extractConnectionToken("telegram", "/start abc12345")).toBe(
      "abc12345",
    );
    expect(
      extractConnectionToken("telegram", "/start@midday_bot abc12345"),
    ).toBe("abc12345");
  });

  test("extracts whatsapp and slack link messages", () => {
    expect(
      extractConnectionToken("whatsapp", "Connect to Midday: abc12345"),
    ).toBe("abc12345");
    expect(extractConnectionToken("slack", "Connect to Midday: abc12345")).toBe(
      "abc12345",
    );
  });

  test("extracts sendblue link messages", () => {
    expect(
      extractConnectionToken("sendblue", "Connect to Midday: abc12345"),
    ).toBe("abc12345");
  });

  test("extracts code-only messages", () => {
    expect(extractConnectionToken("sendblue", "abc12345")).toBe("abc12345");
    expect(extractConnectionToken("whatsapp", "abc12345")).toBe("abc12345");
  });

  test("ignores non-link messages", () => {
    expect(extractConnectionToken("sendblue", "hello there")).toBeNull();
    expect(
      extractConnectionToken("telegram", "/start team_inbox_id"),
    ).toBeNull();
    expect(
      extractConnectionToken("slack", "Summarize my cash flow"),
    ).toBeNull();
    expect(extractConnectionToken("whatsapp", "hello there")).toBeNull();
  });
});
