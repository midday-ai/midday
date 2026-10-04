import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { SignJWT } from "jose";
import { createUploadReceipt, verifyUploadReceipt } from "./upload-receipt";

const originalSecret = process.env.FILE_KEY_SECRET;
const now = new Date("2026-10-04T12:00:00Z");
const claims = {
  bucket: "apps" as const,
  key: "logos/generated.png",
  teamId: "team-a",
  size: 123,
  contentType: "image/png",
};
const expected = { ...claims, userId: "user-a" };
beforeAll(() => {
  process.env.FILE_KEY_SECRET = "scratch-test-only-secret";
});
afterAll(() => {
  if (originalSecret === undefined) delete process.env.FILE_KEY_SECRET;
  else process.env.FILE_KEY_SECRET = originalSecret;
});

describe("signed upload receipts", () => {
  test("returns exact signed metadata for authorized owner", async () => {
    const receipt = await createUploadReceipt(claims, "user-a", now);
    expect(await verifyUploadReceipt(receipt, expected, now)).toEqual(claims);
  });
  test("binds user, team, bucket and exact canonical raw key", async () => {
    const receipt = await createUploadReceipt(claims, "user-a", now);
    for (const change of [
      { userId: "user-b" },
      { teamId: "team-b" },
      { bucket: "avatars" as const },
      { key: "logos/someone-elses.png" },
      { key: "/logos/generated.png" },
    ]) {
      await expect(
        verifyUploadReceipt(receipt, { ...expected, ...change }, now),
      ).rejects.toThrow("Invalid or expired");
    }
  });
  test("supports own avatar before team creation", async () => {
    const avatar = {
      ...claims,
      bucket: "avatars" as const,
      key: "user-a/avatar.png",
      teamId: null,
    };
    const receipt = await createUploadReceipt(avatar, "user-a", now);
    expect(
      await verifyUploadReceipt(receipt, { ...avatar, userId: "user-a" }, now),
    ).toEqual(avatar);
  });
  test("tampering with declared size or MIME invalidates signature", async () => {
    const receipt = await createUploadReceipt(claims, "user-a", now);
    const [header, payload, signature] = receipt.split(".");
    const decoded = JSON.parse(Buffer.from(payload!, "base64url").toString());
    for (const change of [{ size: 999 }, { contentType: "application/pdf" }]) {
      const forgedPayload = Buffer.from(
        JSON.stringify({ ...decoded, ...change }),
      ).toString("base64url");
      await expect(
        verifyUploadReceipt(
          `${header}.${forgedPayload}.${signature}`,
          expected,
          now,
        ),
      ).rejects.toThrow();
    }
  });
  test("expires at ten minutes and rejects future-issued receipts", async () => {
    const receipt = await createUploadReceipt(claims, "user-a", now);
    expect(
      await verifyUploadReceipt(
        receipt,
        expected,
        new Date(now.getTime() + 599000),
      ),
    ).toEqual(claims);
    await expect(
      verifyUploadReceipt(receipt, expected, new Date(now.getTime() + 600000)),
    ).rejects.toThrow();
    await expect(
      verifyUploadReceipt(receipt, expected, new Date(now.getTime() - 1000)),
    ).rejects.toThrow();
  });
  test("rejects other token purposes and absent expiry, even with same signing key", async () => {
    const secret = new TextEncoder().encode(process.env.FILE_KEY_SECRET);
    const token = () =>
      new SignJWT(claims)
        .setProtectedHeader({ alg: "HS256" })
        .setSubject("user-a")
        .setIssuedAt(Math.floor(now.getTime() / 1000));
    const wrongPurpose = await token()
      .setIssuer("midday:download")
      .setAudience("file-key")
      .setExpirationTime(Math.floor(now.getTime() / 1000) + 600)
      .sign(secret);
    await expect(
      verifyUploadReceipt(wrongPurpose, expected, now),
    ).rejects.toThrow();
    const noExpiry = await token()
      .setIssuer("midday:storage:upload")
      .setAudience("midday:storage:complete")
      .setJti("test")
      .sign(secret);
    await expect(
      verifyUploadReceipt(noExpiry, expected, now),
    ).rejects.toThrow();
  });
});
