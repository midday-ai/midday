import { TRPCError } from "@trpc/server";
import { jwtVerify, SignJWT } from "jose";
import { z } from "zod";
import type { UploadBucket, UploadContext } from "./upload-policy";

const issuer = "midday:storage:upload";
const audience = "midday:storage:complete";
const lifetimeSeconds = 600;
const receiptSchema = z.object({
  bucket: z.enum(["vault", "avatars", "apps"]),
  key: z.string().min(1),
  teamId: z.string().nullable(),
  size: z.number().int().positive(),
  contentType: z.string().min(1),
});
export type UploadReceiptClaims = z.infer<typeof receiptSchema>;

function signingKey(): Uint8Array {
  const secret = process.env.FILE_KEY_SECRET;
  if (!secret)
    throw new Error("FILE_KEY_SECRET is required for upload receipts");
  return new TextEncoder().encode(secret);
}

/** Issued only after policy and transaction ownership checks have succeeded. */
export async function createUploadReceipt(
  claims: UploadReceiptClaims,
  userId: string,
  now = new Date(),
): Promise<string> {
  const issuedAt = Math.floor(now.getTime() / 1000);
  return new SignJWT(receiptSchema.parse(claims))
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuer(issuer)
    .setAudience(audience)
    .setSubject(userId)
    .setJti(crypto.randomUUID())
    .setIssuedAt(issuedAt)
    .setExpirationTime(issuedAt + lifetimeSeconds)
    .sign(signingKey());
}

/** Verify before any HEAD, remove or DB write. Scope is distinct from file-download tokens. */
export async function verifyUploadReceipt(
  receipt: string,
  expected: UploadContext & { bucket: UploadBucket; key: string },
  now = new Date(),
): Promise<UploadReceiptClaims> {
  const secret = signingKey();
  try {
    const { payload } = await jwtVerify(receipt, secret, {
      algorithms: ["HS256"],
      issuer,
      audience,
      subject: expected.userId,
      currentDate: now,
      maxTokenAge: lifetimeSeconds,
      requiredClaims: ["exp", "iat", "jti"],
    });
    const claims = receiptSchema.parse(payload);
    if (
      claims.bucket !== expected.bucket ||
      claims.key !== expected.key ||
      claims.teamId !== expected.teamId
    )
      throw new Error("Upload receipt scope mismatch");
    return claims;
  } catch {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Invalid or expired upload receipt",
    });
  }
}
