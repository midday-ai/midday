import { describe, expect, test } from "bun:test";
import {
  extractConnectionToken,
  isExplicitConnectionAttempt,
} from "../../bot/linking";

describe("bot link code extraction", () => {
  test("extracts telegram /start payloads", () => {
    expect(extractConnectionToken("telegram", "/start abc12345")).toBe(
      "abc12345",
    );
    expect(
      extractConnectionToken("telegram", "/start@midday_bot abc12345"),
    ).toBe("abc12345");
    expect(extractConnectionToken("telegram", "/start xyzABCDE")).toBe(
      "xyzABCDE",
    );
  });

  test("extracts prefixed 'Connect to Midday:' messages", () => {
    expect(
      extractConnectionToken("whatsapp", "Connect to Midday: abc12345"),
    ).toBe("abc12345");
    expect(extractConnectionToken("slack", "Connect to Midday: abc12345")).toBe(
      "abc12345",
    );
    expect(
      extractConnectionToken("sendblue", "Connect to Midday: abc12345"),
    ).toBe("abc12345");
    expect(extractConnectionToken("slack", "Connect to Midday: xyzABCDE")).toBe(
      "xyzABCDE",
    );
    expect(
      extractConnectionToken("whatsapp", "connect to midday:abc12345"),
    ).toBe("abc12345");
  });

  test("extracts bare code-only messages with mixed alphanumeric", () => {
    expect(extractConnectionToken("sendblue", "abc12345")).toBe("abc12345");
    expect(extractConnectionToken("whatsapp", "abc12345")).toBe("abc12345");
    expect(extractConnectionToken("whatsapp", "a1b2c3d4")).toBe("a1b2c3d4");
    expect(extractConnectionToken("sendblue", "Abc1defg")).toBe("Abc1defg");
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

  test("ignores bare 8-char English words (no digit)", () => {
    const words = [
      "password",
      "question",
      "business",
      "checkout",
      "download",
      "children",
      "absolute",
      "learning",
      "practice",
      "pictures",
    ];
    for (const word of words) {
      expect(extractConnectionToken("whatsapp", word)).toBeNull();
      expect(extractConnectionToken("sendblue", word)).toBeNull();
    }
  });

  test("ignores multi-word messages without the connect prefix", () => {
    expect(
      extractConnectionToken("whatsapp", "What about checkout"),
    ).toBeNull();
    expect(extractConnectionToken("slack", "Here is my abc12345")).toBeNull();
    expect(
      extractConnectionToken("sendblue", "please try a1b2c3d4"),
    ).toBeNull();
  });

  test("ignores bare pure-digit 8-char strings", () => {
    expect(extractConnectionToken("whatsapp", "12345678")).toBeNull();
    expect(extractConnectionToken("sendblue", "99887766")).toBeNull();
  });
});

describe("isExplicitConnectionAttempt", () => {
  test("returns true for telegram /start with payload", () => {
    expect(isExplicitConnectionAttempt("telegram", "/start abc12345")).toBe(
      true,
    );
    expect(
      isExplicitConnectionAttempt("telegram", "/start@midday_bot abc12345"),
    ).toBe(true);
  });

  test("returns true for 'Connect to Midday:' prefix", () => {
    expect(
      isExplicitConnectionAttempt("whatsapp", "Connect to Midday: abc12345"),
    ).toBe(true);
    expect(
      isExplicitConnectionAttempt("sendblue", "connect to midday:abc12345"),
    ).toBe(true);
    expect(
      isExplicitConnectionAttempt("slack", "Connect to Midday: xyzABCDE"),
    ).toBe(true);
  });

  test("returns false for bare alphanumeric strings", () => {
    expect(isExplicitConnectionAttempt("whatsapp", "abc12345")).toBe(false);
    expect(isExplicitConnectionAttempt("sendblue", "test1234")).toBe(false);
    expect(isExplicitConnectionAttempt("whatsapp", "a1b2c3d4")).toBe(false);
  });

  test("returns false for regular messages", () => {
    expect(isExplicitConnectionAttempt("whatsapp", "hello there")).toBe(false);
    expect(isExplicitConnectionAttempt("sendblue", undefined)).toBe(false);
    expect(isExplicitConnectionAttempt("telegram", "just chatting")).toBe(
      false,
    );
  });
});
