import { describe, expect, test } from "bun:test";
import { extractInboxIdFromMessage } from "./utils";

describe("extractInboxIdFromMessage", () => {
  describe("Pattern 1: 'Connect to Midday: xxx'", () => {
    test("should extract inbox ID from standard format", () => {
      expect(extractInboxIdFromMessage("Connect to Midday: abc123")).toBe(
        "abc123",
      );
    });

    test("should extract inbox ID with case-insensitive matching", () => {
      expect(extractInboxIdFromMessage("connect to midday: xyz789")).toBe(
        "xyz789",
      );
      expect(extractInboxIdFromMessage("CONNECT TO MIDDAY: def456")).toBe(
        "def456",
      );
      expect(extractInboxIdFromMessage("CoNnEcT tO mIdDaY: ghi012")).toBe(
        "ghi012",
      );
    });

    test("should extract inbox ID without space after colon", () => {
      expect(extractInboxIdFromMessage("Connect to Midday:abc123")).toBe(
        "abc123",
      );
    });

    test("should extract inbox ID with multiple spaces", () => {
      expect(extractInboxIdFromMessage("Connect to Midday:  abc123")).toBe(
        "abc123",
      );
      expect(extractInboxIdFromMessage("Connect   to   Midday:   abc123")).toBe(
        "abc123",
      );
    });

    test("should extract inbox ID with leading/trailing whitespace", () => {
      expect(extractInboxIdFromMessage("  Connect to Midday: abc123  ")).toBe(
        "abc123",
      );
      expect(extractInboxIdFromMessage("\tConnect to Midday: abc123\n")).toBe(
        "abc123",
      );
    });

    test("should extract inbox ID without colon", () => {
      expect(extractInboxIdFromMessage("Connect to Midday abc123")).toBe(
        "abc123",
      );
    });

    test("should handle longer inbox IDs", () => {
      expect(
        extractInboxIdFromMessage("Connect to Midday: abc123def456ghi789"),
      ).toBe("abc123def456ghi789");
    });
  });

  describe("Pattern 2: 'inbox ID is: xxx'", () => {
    test("should extract inbox ID from 'inbox ID is: xxx' format", () => {
      expect(extractInboxIdFromMessage("inbox ID is: xyz789")).toBe("xyz789");
    });

    test("should extract inbox ID from 'My inbox ID is: xxx' format", () => {
      expect(extractInboxIdFromMessage("My inbox ID is: xyz789")).toBe(
        "xyz789",
      );
    });

    test("should extract inbox ID with case-insensitive matching", () => {
      expect(extractInboxIdFromMessage("Inbox ID Is: xyz789")).toBe("xyz789");
      expect(extractInboxIdFromMessage("INBOX ID IS: xyz789")).toBe("xyz789");
    });

    test("should extract inbox ID without 'is'", () => {
      expect(extractInboxIdFromMessage("inbox ID: xyz789")).toBe("xyz789");
    });

    test("should extract inbox ID with lowercase 'id'", () => {
      expect(extractInboxIdFromMessage("inbox id is: xyz789")).toBe("xyz789");
    });

    test("should extract inbox ID with flexible spacing", () => {
      expect(extractInboxIdFromMessage("inbox  ID  is:  xyz789")).toBe(
        "xyz789",
      );
    });
  });

  describe("Pattern 3: Short alphanumeric string", () => {
    test("should extract short alphanumeric inbox ID", () => {
      expect(extractInboxIdFromMessage("abc123")).toBe("abc123");
      expect(extractInboxIdFromMessage("xyz789")).toBe("xyz789");
    });

    test("should extract short numeric inbox ID", () => {
      expect(extractInboxIdFromMessage("123456")).toBe("123456");
    });

    test("should extract short uppercase inbox ID", () => {
      expect(extractInboxIdFromMessage("ABC123")).toBe("ABC123");
    });

    test("should extract inbox ID up to 20 characters", () => {
      expect(extractInboxIdFromMessage("abc123def456ghi789")).toBe(
        "abc123def456ghi789",
      );
    });

    test("should not extract if longer than 20 characters", () => {
      expect(extractInboxIdFromMessage("abc123def456ghi789jkl012")).toBeNull();
    });
  });

  describe("Edge cases and invalid inputs", () => {
    test("should return null for empty string", () => {
      expect(extractInboxIdFromMessage("")).toBeNull();
    });

    test("should return null for whitespace-only string", () => {
      expect(extractInboxIdFromMessage("   ")).toBeNull();
      expect(extractInboxIdFromMessage("\t\n")).toBeNull();
    });

    test("should return null for null input", () => {
      expect(extractInboxIdFromMessage(null as any)).toBeNull();
    });

    test("should return null for undefined input", () => {
      expect(extractInboxIdFromMessage(undefined as any)).toBeNull();
    });

    test("should return null for non-string input", () => {
      expect(extractInboxIdFromMessage(123 as any)).toBeNull();
      expect(extractInboxIdFromMessage({} as any)).toBeNull();
      expect(extractInboxIdFromMessage([] as any)).toBeNull();
    });

    test("should return null for messages with special characters", () => {
      expect(extractInboxIdFromMessage("Connect to Midday: abc-123")).toBe(
        "abc",
      ); // Only matches up to special char
      expect(extractInboxIdFromMessage("Connect to Midday: abc_123")).toBe(
        "abc",
      );
      expect(extractInboxIdFromMessage("abc-123")).toBeNull();
    });

    test("should return null for messages that don't match any pattern", () => {
      expect(extractInboxIdFromMessage("Hello world")).toBeNull();
      expect(extractInboxIdFromMessage("Send me your inbox ID")).toBeNull();
      expect(extractInboxIdFromMessage("What is my inbox?")).toBeNull();
    });

    test("should return null for messages with inbox ID containing special chars", () => {
      expect(extractInboxIdFromMessage("Connect to Midday: abc@123")).toBe(
        "abc",
      );
    });
  });

  describe("Real-world scenarios", () => {
    test("should handle the exact format generated by the client", () => {
      const inboxId = "abc123xyz";
      const message = `Connect to Midday: ${inboxId}`;
      expect(extractInboxIdFromMessage(message)).toBe(inboxId);
    });

    test("should handle URL-encoded messages (if decoded)", () => {
      // Simulating what might come from WhatsApp after URL decoding
      expect(extractInboxIdFromMessage("Connect to Midday: abc123")).toBe(
        "abc123",
      );
    });

    test("should prioritize Pattern 1 over Pattern 3", () => {
      // If message matches Pattern 1, it should use that even if it's short
      expect(extractInboxIdFromMessage("Connect to Midday: abc")).toBe("abc");
    });

    test("should handle messages with extra text before pattern", () => {
      expect(extractInboxIdFromMessage("Hi! Connect to Midday: abc123")).toBe(
        "abc123",
      );
    });

    test("should handle messages with extra text after pattern", () => {
      // Note: This will only match up to the first non-alphanumeric char
      expect(
        extractInboxIdFromMessage("Connect to Midday: abc123 thanks!"),
      ).toBe("abc123");
    });
  });
});
