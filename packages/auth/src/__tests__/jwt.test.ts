import { describe, expect, test } from "bun:test";
import { betterAuth } from "better-auth";
import { memoryAdapter } from "better-auth/adapters/memory";
import { emailOTP, jwt } from "better-auth/plugins";
import { createLocalJWKSet, decodeJwt, jwtVerify } from "jose";

const issuer = "http://localhost:3001";
const audience = "midday-api";
const verification = { issuer, audience, algorithms: ["EdDSA"] };

describe("better-auth JWT contract", () => {
  test("OTP sessions mint EdDSA tokens with API claims; invalid JWTs fail", async () => {
    let otp = "";
    const auth = betterAuth({
      baseURL: issuer,
      secret: crypto.randomUUID(),
      database: memoryAdapter({
        user: [],
        session: [],
        account: [],
        verification: [],
        jwks: [],
      }),
      advanced: { database: { generateId: "uuid" } },
      session: {
        additionalFields: {
          aal: { type: "string", defaultValue: "aal1", input: false },
        },
      },
      plugins: [
        emailOTP({
          sendVerificationOTP: async (message) => {
            otp = message.otp;
          },
        }),
        jwt({
          jwks: { keyPairConfig: { alg: "EdDSA", crv: "Ed25519" } },
          jwt: {
            issuer,
            audience,
            expirationTime: "15m",
            definePayload: ({ user, session }) => ({
              email: user.email,
              name: user.name,
              aal: (session as { aal?: string }).aal ?? "aal1",
            }),
          },
        }),
      ],
    });
    await auth.api.sendVerificationOTP({
      body: { email: "jwt@example.test", type: "sign-in" },
    });
    const signedIn = await auth.api.signInEmailOTP({
      body: { email: "jwt@example.test", otp },
      asResponse: true,
    });
    const cookie = signedIn.headers
      .getSetCookie()
      .map((value) => value.split(";")[0])
      .join("; ");
    const { token } = await auth.api.getToken({
      headers: new Headers({ cookie }),
    });
    const keyset = createLocalJWKSet(await auth.api.getJwks());
    const result = await jwtVerify(token, keyset, verification);
    expect(result.protectedHeader.alg).toBe("EdDSA");
    expect(result.payload).toMatchObject({
      email: "jwt@example.test",
      name: "",
      aal: "aal1",
      iss: issuer,
      aud: audience,
    });
    expect(result.payload.sub).toMatch(/^[0-9a-f-]{36}$/);
    expect(result.payload.exp! - result.payload.iat!).toBe(900);
    const pieces = token.split(".");
    pieces[1] = Buffer.from(
      JSON.stringify({ ...decodeJwt(token), email: "attacker@example.test" }),
    ).toString("base64url");
    await expect(
      jwtVerify(pieces.join("."), keyset, verification),
    ).rejects.toThrow();
    await expect(
      jwtVerify(token, keyset, {
        ...verification,
        issuer: "http://localhost:9999",
      }),
    ).rejects.toThrow();
    await expect(
      jwtVerify(token, keyset, { ...verification, audience: "another-api" }),
    ).rejects.toThrow();
    await expect(
      jwtVerify(token, keyset, {
        ...verification,
        currentDate: new Date((result.payload.exp! + 1) * 1000),
      }),
    ).rejects.toThrow();
    await expect(
      auth.api.signInEmailOTP({ body: { email: "jwt@example.test", otp } }),
    ).rejects.toThrow();
  });

  test("three wrong OTP attempts exhaust the code even through direct server calls", async () => {
    let otp = "";
    const auth = betterAuth({
      baseURL: issuer,
      secret: crypto.randomUUID(),
      database: memoryAdapter({
        user: [],
        session: [],
        account: [],
        verification: [],
      }),
      plugins: [
        emailOTP({
          allowedAttempts: 3,
          sendVerificationOTP: async (message) => {
            otp = message.otp;
          },
        }),
      ],
    });
    await auth.api.sendVerificationOTP({
      body: { email: "attempts@example.test", type: "sign-in" },
    });
    const wrong = otp === "000000" ? "111111" : "000000";
    for (let i = 0; i < 3; i++)
      await expect(
        auth.api.signInEmailOTP({
          body: { email: "attempts@example.test", otp: wrong },
        }),
      ).rejects.toThrow();
    await expect(
      auth.api.signInEmailOTP({
        body: { email: "attempts@example.test", otp },
      }),
    ).rejects.toThrow();
  });
});
