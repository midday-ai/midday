import { createHmac } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";
import { type APIRequestContext, expect, type Page } from "@playwright/test";
import { apiUrl, dashboardUrl, serverLogs } from "./environment";

export async function waitForHydratedInput(page: Page, selector: string) {
  await expect(page.locator(selector)).toBeAttached();
  await page.waitForFunction((css) => {
    const input = document.querySelector(css);
    if (!input) return false;
    return Object.entries(input).some(
      ([key, props]) =>
        key.startsWith("__reactProps$") &&
        typeof props?.onChange === "function",
    );
  }, selector);
}

export async function emailSignIn(page: Page, email: string) {
  await page.goto("/login");
  const emailInput = page.getByPlaceholder("Enter email address");
  await expect(emailInput).toBeVisible();
  await waitForHydratedInput(page, 'input[placeholder="Enter email address"]');
  const log = resolve(serverLogs, "dashboard.log");
  const offset = (await stat(log)).size;
  await emailInput.fill(email);
  // Exercise the real rate limiter: repeated MFA logins may exhaust the
  // three-per-minute OTP allowance. Respect Retry-After rather than disabling it.
  for (let attempt = 0; attempt < 3; attempt++) {
    const sent = page.waitForResponse(
      (response) => response.url().includes("/email-otp/send-verification-otp"),
      { timeout: 60_000 },
    );
    await page.getByRole("button", { name: "Continue", exact: true }).click();
    const response = await sent;
    if (response.status() !== 429) {
      expect(response.ok()).toBeTruthy();
      break;
    }
    const retryAfter = Number(response.headers()["retry-after"] ?? 60);
    await page.waitForTimeout(
      (Number.isFinite(retryAfter)
        ? Math.min(65, Math.max(1, retryAfter))
        : 60) *
        1000 +
        1000,
    );
  }
  await expect(
    page.locator('input[autocomplete="one-time-code"]'),
  ).toBeVisible();
  let otp = "";
  await expect
    .poll(
      async () => {
        const bytes = await readFile(log);
        // Next may add terminal color sequences around a development log line.
        const text = bytes
          .subarray(offset)
          .toString()
          // biome-ignore lint/suspicious/noControlCharactersInRegex: Strip terminal ANSI colors from development logs.
          .replace(/\x1b\[[0-9;]*m/g, "");
        const prefix = `[auth] OTP for ${email} `;
        const line = text.split("\n").find((value) => value.includes(prefix));
        otp =
          line
            ?.slice(line.indexOf(prefix) + prefix.length)
            .match(/^\d{6}/)?.[0] ?? "";
        return otp;
      },
      {
        timeout: 90_000,
        message: "Waiting for this sign-in's development OTP in dashboard.log",
      },
    )
    .toMatch(/^\d{6}$/);
  await page.locator('input[autocomplete="one-time-code"]').fill(otp);
  await expect(page).not.toHaveURL(/\/login(?:\?|$)/);
}

async function selectChoice(page: Page, _label: string, option: string) {
  const control = page
    .locator("select")
    .filter({ has: page.locator("option", { hasText: option }) });
  await control.selectOption({ label: option });
}

export async function completeOnboarding(page: Page, company: string) {
  await expect(page.getByPlaceholder("John Doe")).toBeVisible();
  await page.getByPlaceholder("John Doe").fill("E2E Test User");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(page.getByLabel("Company name", { exact: true })).toBeVisible();
  await page.getByLabel("Company name", { exact: true }).fill(company);
  await selectChoice(page, "What best describes you?", "Just exploring");
  await selectChoice(page, "How did you hear about us?", "GitHub");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(page).toHaveURL(/s=connect-bank/);
  // Bank and inbox are optional and must not contact external providers.
  await page.getByRole("button", { name: "Skip for now", exact: true }).click();
  await expect(page).toHaveURL(/s=connect-inbox/);
  await page.getByRole("button", { name: "Skip for now", exact: true }).click();
  await expect(page).toHaveURL(/s=reconciliation/);
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await expect(page).toHaveURL(/s=connect-mcp/);
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await expect(page).toHaveURL(/s=connect-chat/);
  await page.getByRole("button", { name: "Finish", exact: true }).click();
  await expect(page).toHaveURL(
    (url) => url.origin === dashboardUrl && url.pathname === "/",
  );
}

export async function signOut(page: Page) {
  const menu = page.locator('[aria-haspopup="menu"].w-8');
  await expect(menu).toBeVisible();
  await menu.click();
  await page.getByRole("menuitem", { name: "Sign out", exact: true }).click();
  await expect(page).toHaveURL(/\/login(?:\?|$)/);
  const session = await page.request.get(
    `${dashboardUrl}/api/auth/get-session`,
  );
  expect(await session.json()).toBeNull();
}

export async function sessionJwt(page: Page): Promise<string> {
  const response = await page.request.get(`${dashboardUrl}/api/auth/token`);
  expect(response.ok()).toBeTruthy();
  const body = await response.json();
  expect(body.token).toEqual(expect.any(String));
  return body.token;
}

export async function trpc(
  request: APIRequestContext,
  token: string,
  procedure: string,
  input?: unknown,
  mutation = false,
) {
  const headers = {
    Authorization: `Bearer ${token}`,
    "x-force-primary": "true",
  };
  const url = `${apiUrl}/trpc/${procedure}`;
  return mutation
    ? request.post(url, { headers, data: { json: input } })
    : request.get(
        input === undefined
          ? url
          : `${url}?input=${encodeURIComponent(JSON.stringify({ json: input }))}`,
        { headers },
      );
}

export async function trpcData<T>(
  response: Awaited<ReturnType<typeof trpc>>,
): Promise<T> {
  expect(response.ok(), await response.text()).toBeTruthy();
  const body = await response.json();
  return (body.result?.data?.json ?? body.result?.data) as T;
}

/** RFC6238 SHA1, six digits, 30-second step; no external authenticator service. */
export function totp(secret: string, timestamp = Date.now()): string {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = "";
  for (const char of secret.toUpperCase().replace(/=+$/, "")) {
    const value = alphabet.indexOf(char);
    if (value < 0) throw new Error("Invalid authenticator setup key");
    bits += value.toString(2).padStart(5, "0");
  }
  const key = Buffer.from(
    Array.from({ length: Math.floor(bits.length / 8) }, (_, index) =>
      Number.parseInt(bits.slice(index * 8, index * 8 + 8), 2),
    ),
  );
  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(Math.floor(timestamp / 30_000)));
  const digest = createHmac("sha1", key).update(counter).digest();
  const offset = digest[digest.length - 1]! & 15;
  return ((digest.readUInt32BE(offset) & 0x7fffffff) % 1_000_000)
    .toString()
    .padStart(6, "0");
}
