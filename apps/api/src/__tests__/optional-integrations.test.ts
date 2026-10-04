import { afterAll, beforeEach, describe, expect, test } from "bun:test";
import { env } from "../../../../packages/banking/src/env";
import { resend as jobsResend } from "../../../../packages/jobs/src/utils/resend";
import { resend } from "../services/resend";

const names = [
  ...Object.keys(env),
  "REDIS_URL",
  "RESEND_API_KEY",
  "COMPOSIO_API_KEY",
  "WHATSAPP_ACCESS_TOKEN",
  "WHATSAPP_APP_SECRET",
  "WHATSAPP_PHONE_NUMBER_ID",
  "WHATSAPP_VERIFY_TOKEN",
  "TELEGRAM_BOT_TOKEN",
  "SLACK_SIGNING_SECRET",
  "SENDBLUE_API_KEY",
  "SENDBLUE_API_SECRET",
  "SENDBLUE_FROM_NUMBER",
];
const originals = new Map(names.map((name) => [name, process.env[name]]));
beforeEach(() => {
  for (const name of names) delete process.env[name];
  process.env.REDIS_URL = "redis://localhost:6379";
});
afterAll(() => {
  for (const [name, value] of originals) {
    if (value === undefined) delete process.env[name];
    else process.env[name] = value;
  }
});

describe("optional local integrations", () => {
  test("banking config imports with no credentials and validates only selected values", () => {
    expect(env.PLAID_ENVIRONMENT).toBe("production");
    expect(() => env.PLAID_CLIENT_ID).toThrow();
    process.env.PLAID_CLIENT_ID = "local-test-client";
    process.env.PLAID_SECRET = "local-test-secret";
    expect(env.PLAID_CLIENT_ID).toBe("local-test-client");
    expect(env.PLAID_SECRET).toBe("local-test-secret");
    expect(() => env.GOCARDLESS_SECRET_KEY).toThrow();
    process.env.R2_ENDPOINT = "invalid-url";
    expect(() => env.R2_ENDPOINT).toThrow();
  });
  test("Resend imports safely and fails clearly only when delivery is requested", () => {
    expect(() => resend.emails).toThrow("RESEND_API_KEY");
    expect(() => jobsResend.batch).toThrow("RESEND_API_KEY");
    process.env.RESEND_API_KEY = "re_local_construction_test";
    expect(typeof resend.emails.send).toBe("function");
    expect(typeof resend.contacts.remove).toBe("function");
    expect(typeof jobsResend.batch.send).toBe("function");
  });
  test("bot registers no absent integrations and supports one configured provider", async () => {
    const { createMiddayBot } = await import(
      "../../../../packages/bot/src/instance"
    );
    const empty = createMiddayBot();
    expect(Object.keys(empty.webhooks)).toEqual([]);
    process.env.TELEGRAM_BOT_TOKEN = "123456:local-construction-test";
    const telegram = createMiddayBot();
    expect(Object.keys(telegram.webhooks)).toEqual(["telegram"]);
    expect(telegram.getAdapter("telegram")).toBeDefined();
  });
  test("Composio imports without credentials and optional tools stay empty", async () => {
    const { getComposio, composioFetch, getComposioTools, getUserToolkits } =
      await import("../composio/client");
    expect(() => getComposio()).toThrow("COMPOSIO_API_KEY");
    await expect(composioFetch("/toolkits")).rejects.toThrow(
      "COMPOSIO_API_KEY",
    );
    expect(await getComposioTools("local-test-user")).toEqual({});
    expect(await getUserToolkits("local-test-user")).toEqual([]);
  });
});
