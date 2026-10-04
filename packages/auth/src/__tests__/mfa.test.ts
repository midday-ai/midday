import { afterAll, describe, expect, test } from "bun:test";
import * as schema from "@midday/db/schema";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { emailOTP, twoFactor } from "better-auth/plugins";
import { eq, like } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { consumeMfaAttempt, mfaEnforcement } from "../mfa";

const testUrl = process.env.MFA_TEST_DATABASE_URL;
// Explicit opt-in: use a local database that has already run the real migrator.
if (
  testUrl &&
  !["localhost", "127.0.0.1", "[::1]"].includes(new URL(testUrl).hostname)
)
  throw new Error("MFA tests require a local database");
describe.skipIf(!testUrl)("MFA integration with migrated Postgres", () => {
  const pool = new Pool({ connectionString: testUrl, max: 20 });
  const db = drizzle(pool, { schema });
  let lastOtp = "";
  const emailPrefix = `mfa-${crypto.randomUUID()}-`;
  const limiterIdentifiers: string[] = [];
  const auth = betterAuth({
    database: drizzleAdapter(db, {
      provider: "pg",
      schema: {
        user: schema.authUsers,
        session: schema.authSessions,
        account: schema.authAccounts,
        verification: schema.authVerifications,
        twoFactor: schema.authTwoFactors,
      },
    }),
    secret: crypto.randomUUID(),
    baseURL: "http://localhost:3001",
    advanced: { database: { generateId: "uuid" } },
    session: {
      additionalFields: {
        aal: { type: "string", defaultValue: "aal1", input: false },
      },
      cookieCache: { enabled: true },
    },
    plugins: [
      emailOTP({
        sendVerificationOTP: async ({ otp }) => {
          lastOtp = otp;
        },
      }),
      twoFactor({ allowPasswordless: true }),
      mfaEnforcement(db),
    ],
  });
  function cookies(headers: Headers, previous = "") {
    const jar = new Map(
      previous
        .split("; ")
        .filter(Boolean)
        .map((p) => {
          const i = p.indexOf("=");
          return [p.slice(0, i), p.slice(i + 1)];
        }),
    );
    for (const raw of headers.getSetCookie()) {
      const p = raw.split(";")[0]!;
      const i = p.indexOf("=");
      jar.set(p.slice(0, i), p.slice(i + 1));
    }
    return [...jar].map(([k, v]) => `${k}=${v}`).join("; ");
  }
  function h(cookie: string) {
    return new Headers({ cookie, origin: "http://localhost:3001" });
  }
  async function signin(email: string) {
    if (!email.startsWith(emailPrefix)) email = emailPrefix + email;
    await auth.api.sendVerificationOTP({ body: { email, type: "sign-in" } });
    const res = await auth.api.signInEmailOTP({
      body: { email, otp: lastOtp },
      returnHeaders: true,
    });
    const cookie = cookies(res.headers);
    const session = await auth.api.getSession({
      headers: h(cookie),
      query: { disableCookieCache: true },
    });
    if (session) limiterIdentifiers.push(`mfa:${session.session.id}`);
    return { cookie, user: res.response.user };
  }
  async function code(totpURI: string) {
    const secret = new URL(totpURI).searchParams.get("secret")!;
    // The plugin's generate endpoint expects its underlying plain secret rather than URI base32.
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
    let bits = "";
    for (const c of secret)
      bits += alphabet.indexOf(c.toUpperCase()).toString(2).padStart(5, "0");
    const raw = String.fromCharCode(
      ...Array.from({ length: Math.floor(bits.length / 8) }, (_, i) =>
        Number.parseInt(bits.slice(i * 8, i * 8 + 8), 2),
      ),
    );
    return (await auth.api.generateTOTP({ body: { secret: raw } })).code;
  }
  async function enroll(email: string) {
    const initial = await signin(email);
    const enabled = await auth.api.enableTwoFactor({
      body: {},
      headers: h(initial.cookie),
    });
    if (enabled.method !== "totp") throw Error("Expected TOTP");
    const token = await code(enabled.totpURI);
    const verified = await auth.api.verifyTOTP({
      body: { code: token },
      headers: h(initial.cookie),
      returnHeaders: true,
    });
    return {
      ...initial,
      cookie: cookies(verified.headers, initial.cookie),
      totpURI: enabled.totpURI,
      backupCodes: enabled.backupCodes,
      oldCookie: initial.cookie,
    };
  }

  afterAll(async () => {
    await db
      .delete(schema.authUsers)
      .where(like(schema.authUsers.email, `${emailPrefix}%`));
    for (const identifier of limiterIdentifiers)
      await db
        .delete(schema.authVerifications)
        .where(eq(schema.authVerifications.identifier, identifier));
    await pool.end();
  });

  test("atomic limiter permits exactly five of twenty simultaneous attempts and persists refusal", async () => {
    const sid = crypto.randomUUID();
    limiterIdentifiers.push(`mfa:${sid}`);
    const attempts = await Promise.allSettled(
      Array.from({ length: 20 }, () => consumeMfaAttempt(db, sid)),
    );
    expect(attempts.filter((r) => r.status === "fulfilled")).toHaveLength(5);
    expect(attempts.filter((r) => r.status === "rejected")).toHaveLength(15);
    const rows = await db
      .select()
      .from(schema.authVerifications)
      .where(eq(schema.authVerifications.identifier, `mfa:${sid}`));
    expect(rows).toHaveLength(1);
    expect(rows[0]?.value).toBe("5");
    await expect(consumeMfaAttempt(db, sid)).rejects.toMatchObject({
      status: "TOO_MANY_REQUESTS",
    });
  });
  test("expired attempts reset window and malformed unexpired counts fail closed", async () => {
    const sid = crypto.randomUUID();
    limiterIdentifiers.push(`mfa:${sid}`);
    await consumeMfaAttempt(db, sid);
    await db
      .update(schema.authVerifications)
      .set({ expiresAt: new Date(Date.now() - 1), value: "5" })
      .where(eq(schema.authVerifications.identifier, `mfa:${sid}`));
    await consumeMfaAttempt(db, sid);
    const [row] = await db
      .select()
      .from(schema.authVerifications)
      .where(eq(schema.authVerifications.identifier, `mfa:${sid}`));
    expect(row?.value).toBe("1");
    await db
      .update(schema.authVerifications)
      .set({ value: "bad" })
      .where(eq(schema.authVerifications.identifier, `mfa:${sid}`));
    await expect(consumeMfaAttempt(db, sid)).rejects.toMatchObject({
      status: "TOO_MANY_REQUESTS",
    });
  });
  test("enrollment rotates session, elevates surviving session, and cache reports aal2", async () => {
    const enrolled = await enroll("enroll@example.test");
    const live = await auth.api.getSession({
      headers: h(enrolled.cookie),
      query: { disableCookieCache: true },
    });
    expect(live?.user.twoFactorEnabled).toBe(true);
    expect(live?.session.aal).toBe("aal2");
    expect(
      (await auth.api.getSession({ headers: h(enrolled.cookie) }))?.session.aal,
    ).toBe("aal2");
    expect(
      await auth.api.getSession({
        headers: h(enrolled.oldCookie),
        query: { disableCookieCache: true },
      }),
    ).toBeNull();
  });
  test("new OTP session aal1 cannot disable, replace, read secret, or generate recovery codes (direct and HTTP)", async () => {
    const enrolled = await enroll("guards@example.test");
    const low = await signin(enrolled.user.email);
    expect(
      (await auth.api.getSession({ headers: h(low.cookie) }))?.session.aal,
    ).toBe("aal1");
    for (const path of [
      "/two-factor/disable",
      "/two-factor/enable",
      "/two-factor/get-totp-uri",
      "/two-factor/generate-backup-codes",
    ]) {
      const r = await auth.handler(
        new Request(`http://localhost:3001/api/auth${path}`, {
          method: "POST",
          headers: {
            ...Object.fromEntries(h(low.cookie)),
            "content-type": "application/json",
          },
          body: "{}",
        }),
      );
      expect(r.status).toBe(403);
    }
    await expect(
      auth.api.disableTwoFactor({ body: {}, headers: h(low.cookie) }),
    ).rejects.toMatchObject({ status: "FORBIDDEN" });
    await expect(
      auth.api.enableTwoFactor({ body: {}, headers: h(low.cookie) }),
    ).rejects.toMatchObject({ status: "FORBIDDEN" });
    await expect(
      auth.api.getTOTPURI({ body: {}, headers: h(low.cookie) }),
    ).rejects.toMatchObject({ status: "FORBIDDEN" });
    await expect(
      auth.api.generateBackupCodes({ body: {}, headers: h(low.cookie) }),
    ).rejects.toMatchObject({ status: "FORBIDDEN" });
  });
  test("five wrong direct codes leave aal1; sixth correct HTTP code remains locked", async () => {
    const enrolled = await enroll("lockout@example.test");
    const low = await signin(enrolled.user.email);
    for (let i = 0; i < 5; i++)
      await expect(
        auth.api.verifyTOTP({
          headers: h(low.cookie),
          body: { code: "invalid" },
        }),
      ).rejects.toMatchObject({ status: "UNAUTHORIZED" });
    expect(
      (
        await auth.api.getSession({
          headers: h(low.cookie),
          query: { disableCookieCache: true },
        })
      )?.session.aal,
    ).toBe("aal1");
    const r = await auth.handler(
      new Request("http://localhost:3001/api/auth/two-factor/verify-totp", {
        method: "POST",
        headers: {
          ...Object.fromEntries(h(low.cookie)),
          "content-type": "application/json",
        },
        body: JSON.stringify({ code: await code(enrolled.totpURI) }),
      }),
    );
    expect(r.status).toBe(429);
  });
  test("backup verifies once, grants aal2, and permits remove", async () => {
    const enrolled = await enroll("backup@example.test");
    const low = await signin(enrolled.user.email);
    const verified = await auth.api.verifyBackupCode({
      headers: h(low.cookie),
      body: { code: enrolled.backupCodes[0]! },
      returnHeaders: true,
    });
    const high = cookies(verified.headers, low.cookie);
    expect(
      (
        await auth.api.getSession({
          headers: h(high),
          query: { disableCookieCache: true },
        })
      )?.session.aal,
    ).toBe("aal2");
    await expect(
      auth.api.verifyBackupCode({
        headers: h(high),
        body: { code: enrolled.backupCodes[0]! },
      }),
    ).rejects.toMatchObject({ status: "UNAUTHORIZED" });
    const disabled = await auth.api.disableTwoFactor({
      headers: h(high),
      body: {},
      returnHeaders: true,
    });
    expect(
      (
        await auth.api.getSession({
          headers: h(cookies(disabled.headers, high)),
          query: { disableCookieCache: true },
        })
      )?.user.twoFactorEnabled,
    ).toBe(false);
    expect(
      await db
        .select()
        .from(schema.authTwoFactors)
        .where(eq(schema.authTwoFactors.userId, enrolled.user.id)),
    ).toHaveLength(0);
  });
  test("pending enrollment recovery codes cannot skip authenticator verification", async () => {
    const initial = await signin("pending@example.test");
    const pending = await auth.api.enableTwoFactor({
      headers: h(initial.cookie),
      body: {},
    });
    if (pending.method !== "totp") throw Error("Expected TOTP");
    await expect(
      auth.api.verifyBackupCode({
        headers: h(initial.cookie),
        body: { code: pending.backupCodes[0]! },
      }),
    ).rejects.toMatchObject({ status: "FORBIDDEN" });
  });

  test("stale cached disabled flag cannot authorize MFA mutation after enrollment in another session", async () => {
    const first = await signin("stale@example.test");
    const stale = await signin(first.user.email);
    const cached = await auth.api.getSession({
      headers: h(stale.cookie),
      returnHeaders: true,
    });
    const staleCookie = cookies(cached.headers, stale.cookie);
    expect(cached.response?.user.twoFactorEnabled).toBe(false);
    const pending = await auth.api.enableTwoFactor({
      headers: h(first.cookie),
      body: {},
    });
    if (pending.method !== "totp") throw Error("Expected TOTP");
    await auth.api.verifyTOTP({
      headers: h(first.cookie),
      body: { code: await code(pending.totpURI) },
    });
    // Reading the signed cookie cache is intentionally stale, whereas the guard rereads DB.
    expect(
      (await auth.api.getSession({ headers: h(staleCookie) }))?.user
        .twoFactorEnabled,
    ).toBe(false);
    await expect(
      auth.api.disableTwoFactor({ headers: h(staleCookie), body: {} }),
    ).rejects.toMatchObject({ status: "FORBIDDEN" });
    await expect(
      auth.api.getTOTPURI({ headers: h(staleCookie), body: {} }),
    ).rejects.toMatchObject({ status: "FORBIDDEN" });
  });

  test("HTTP verification and direct verification share one five-attempt budget", async () => {
    const enrolled = await enroll("mixed@example.test");
    const low = await signin(enrolled.user.email);
    for (let i = 0; i < 3; i++) {
      const r = await auth.handler(
        new Request("http://localhost:3001/api/auth/two-factor/verify-totp", {
          method: "POST",
          headers: {
            ...Object.fromEntries(h(low.cookie)),
            "content-type": "application/json",
          },
          body: JSON.stringify({ code: "invalid" }),
        }),
      );
      expect(r.status).toBe(401);
    }
    for (let i = 0; i < 2; i++)
      await expect(
        auth.api.verifyTOTP({
          headers: h(low.cookie),
          body: { code: "invalid" },
        }),
      ).rejects.toMatchObject({ status: "UNAUTHORIZED" });
    await expect(
      auth.api.verifyTOTP({
        headers: h(low.cookie),
        body: { code: await code(enrolled.totpURI) },
      }),
    ).rejects.toMatchObject({ status: "TOO_MANY_REQUESTS" });
  });
});
