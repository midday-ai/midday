import "server-only";
import { primaryDb } from "@midday/db/client";
import * as s from "@midday/db/schema";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { emailOTP, jwt, twoFactor } from "better-auth/plugins";
import { onUserCreated } from "./hooks";
import { mfaEnforcement } from "./mfa";
import { socialProvidersConfig } from "./providers";
import { sendSignInOtp } from "./send-otp";

const baseURL = process.env.BETTER_AUTH_URL ?? "http://localhost:3001";
export const auth = betterAuth({
  appName: "Midday",
  baseURL,
  secret: process.env.BETTER_AUTH_SECRET,
  database: drizzleAdapter(primaryDb, {
    provider: "pg",
    schema: {
      user: s.authUsers,
      session: s.authSessions,
      account: s.authAccounts,
      verification: s.authVerifications,
      jwks: s.authJwks,
      rateLimit: s.authRateLimits,
      twoFactor: s.authTwoFactors,
    },
  }),
  advanced: { database: { generateId: "uuid" }, cookiePrefix: "midday" },
  session: {
    expiresIn: 60 * 60 * 24 * 30,
    updateAge: 60 * 60 * 24,
    cookieCache: { enabled: true, maxAge: 300 },
    additionalFields: {
      aal: { type: "string", defaultValue: "aal1", input: false },
    },
  },
  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ["google", "github", "apple", "microsoft"],
    },
  },
  trustedOrigins: [baseURL, "https://appleid.apple.com"],
  rateLimit: { enabled: true, storage: "database", modelName: "rateLimit" },
  socialProviders: socialProvidersConfig(),
  databaseHooks: { user: { create: { after: onUserCreated } } },
  plugins: [
    emailOTP({
      otpLength: 6,
      expiresIn: 600,
      allowedAttempts: 3,
      disableSignUp: false,
      sendVerificationOTP: sendSignInOtp,
    }),
    jwt({
      jwks: { keyPairConfig: { alg: "EdDSA", crv: "Ed25519" } },
      jwt: {
        issuer: baseURL,
        audience: process.env.AUTH_JWT_AUDIENCE ?? "midday-api",
        expirationTime: "15m",
        definePayload: ({ user, session }) => ({
          email: user.email,
          name: user.name,
          aal: (session as { aal?: string }).aal ?? "aal1",
        }),
      },
    }),
    twoFactor({
      issuer: process.env.AUTH_TOTP_ISSUER ?? "Midday",
      allowPasswordless: true,
      skipVerificationOnEnable: false,
    }),
    mfaEnforcement(primaryDb),
    nextCookies(),
  ],
});
export type Auth = typeof auth;
