import { beforeAll, beforeEach, describe, expect, it } from "bun:test";
import crypto from "node:crypto";
import { decrypt, encrypt } from "./index";

describe("Encryption/Decryption", () => {
  const plaintext = "This is a secret message.";
  const emptyPlaintext = "";
  let validKey: string;

  beforeAll(() => {
    // Generate a valid 32-byte key for testing
    validKey = crypto.randomBytes(32).toString("hex");
  });

  beforeEach(() => {
    // Set the environment variable before each test
    process.env.MIDDAY_ENCRYPTION_KEY = validKey;
  });

  it("should encrypt and decrypt a string successfully", () => {
    const encrypted = encrypt(plaintext);
    expect(typeof encrypted).toBe("string");
    // Basic check for base64 format
    expect(Buffer.from(encrypted, "base64").toString("base64")).toBe(encrypted);

    const decrypted = decrypt(encrypted);
    expect(decrypted).toBe(plaintext);
  });

  it("should encrypt and decrypt an empty string successfully", () => {
    const encrypted = encrypt(emptyPlaintext);
    expect(typeof encrypted).toBe("string");
    expect(Buffer.from(encrypted, "base64").toString("base64")).toBe(encrypted);

    const decrypted = decrypt(encrypted);
    expect(decrypted).toBe(emptyPlaintext);
  });
});
