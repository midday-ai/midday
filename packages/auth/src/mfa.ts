import type { primaryDb } from "@midday/db/client";
import * as schema from "@midday/db/schema";
import type { BetterAuthPlugin } from "better-auth";
import {
  APIError,
  createAuthMiddleware,
  getAuthoritativeSessionFromCtx,
} from "better-auth/api";
import { setSessionCookie } from "better-auth/cookies";
import { and, eq, gt, sql } from "drizzle-orm";

export async function consumeMfaAttempt(
  db: typeof primaryDb,
  sessionId: string,
) {
  await db.transaction(async (tx) => {
    const identifier = `mfa:${sessionId}`;
    await tx.execute(
      sql`select pg_advisory_xact_lock(hashtextextended(${identifier}, 0))`,
    );
    const now = new Date();
    const [attempt] = await tx
      .select()
      .from(schema.authVerifications)
      .where(eq(schema.authVerifications.identifier, identifier));
    if (attempt && attempt.expiresAt > now) {
      const count = Number(attempt.value);
      if (!Number.isSafeInteger(count) || count < 0 || count >= 5) {
        throw new APIError("TOO_MANY_REQUESTS", {
          message: "Too many attempts. Try again in five minutes.",
        });
      }
      await tx
        .update(schema.authVerifications)
        .set({ value: String(count + 1), updatedAt: now })
        .where(eq(schema.authVerifications.id, attempt.id));
      return;
    }
    await tx
      .delete(schema.authVerifications)
      .where(eq(schema.authVerifications.identifier, identifier));
    await tx.insert(schema.authVerifications).values({
      id: crypto.randomUUID(),
      identifier,
      value: "1",
      expiresAt: new Date(now.getTime() + 300000),
      createdAt: now,
      updatedAt: now,
    });
  });
}

const verificationPaths = new Set([
  "/two-factor/verify-totp",
  "/two-factor/verify-backup-code",
]);
const protectedPaths = new Set([
  "/two-factor/enable",
  "/two-factor/disable",
  "/two-factor/get-totp-uri",
  "/two-factor/generate-backup-codes",
]);

export function mfaEnforcement(db: typeof primaryDb): BetterAuthPlugin {
  return {
    id: "midday-mfa",
    hooks: {
      before: [
        {
          matcher: (ctx) =>
            verificationPaths.has(ctx.path ?? "") ||
            protectedPaths.has(ctx.path ?? ""),
          handler: createAuthMiddleware(async (ctx) => {
            const current = await getAuthoritativeSessionFromCtx(ctx);
            if (!current)
              throw new APIError("UNAUTHORIZED", {
                message: "Sign in to continue.",
              });
            if (
              protectedPaths.has(ctx.path ?? "") &&
              current.user.twoFactorEnabled &&
              current.session.aal !== "aal2"
            ) {
              throw new APIError("FORBIDDEN", {
                message: "Verify your authenticator before changing MFA.",
              });
            }
            if (verificationPaths.has(ctx.path ?? "")) {
              if (
                ctx.path === "/two-factor/verify-backup-code" &&
                !current.user.twoFactorEnabled
              ) {
                throw new APIError("FORBIDDEN", {
                  message: "Verify your authenticator to finish enrollment.",
                });
              }
              await consumeMfaAttempt(db, current.session.id);
            }
          }),
        },
      ],
      after: [
        {
          matcher: (ctx) => verificationPaths.has(ctx.path ?? ""),
          handler: createAuthMiddleware(async (ctx) => {
            if (
              ctx.context.returned instanceof APIError ||
              (ctx.context.returned instanceof Response &&
                !ctx.context.returned.ok)
            )
              return;
            // Enrollment rotates the session. Never elevate the deleted original.
            const current = ctx.context.newSession ?? ctx.context.session;
            if (!current?.user.twoFactorEnabled) return;
            const [session] = await db
              .update(schema.authSessions)
              .set({ aal: "aal2", updatedAt: new Date() })
              .where(
                and(
                  eq(schema.authSessions.id, current.session.id),
                  eq(schema.authSessions.userId, current.user.id),
                  gt(schema.authSessions.expiresAt, new Date()),
                ),
              )
              .returning();
            if (!session)
              throw new APIError("UNAUTHORIZED", {
                message: "Session expired. Sign in again.",
              });
            await setSessionCookie(ctx, { session, user: current.user });
          }),
        },
      ],
    },
  };
}
