import { randomUUID } from "node:crypto";
import { expect, test } from "@playwright/test";
import { Client } from "pg";
import { cleanupFixtures } from "./cleanup";
import {
  apiUrl,
  dashboardUrl,
  databaseUrl,
  requireLoopback,
  storageEndpoint,
} from "./environment";
import {
  completeOnboarding,
  emailSignIn,
  sessionJwt,
  signOut,
  totp,
  trpc,
  trpcData,
  waitForHydratedInput,
} from "./helpers";

// A real PNG is small enough for low-memory CI and accepted by both upload flows.
const png = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jS1cAAAAASUVORK5CYII=",
  "base64",
);

test("local signup, uploads, tenant authorization, MFA and logout", async ({
  page,
  context,
}, testInfo) => {
  const runId = `${Date.now()}-${randomUUID().slice(0, 8)}`;
  const email = `e2e-${runId}@example.test`;
  const company = `E2E ${runId}`;
  const filename = `e2e-vault-${runId}.png`;
  const db = new Client({ connectionString: databaseUrl, ssl: false });
  const consoleLines: string[] = [];
  page.on("console", (message) =>
    consoleLines.push(`${message.type()}: ${message.text()}`),
  );
  page.on("pageerror", (error) =>
    consoleLines.push(`pageerror: ${error.message}`),
  );
  await context.route("**/*", async (route) => {
    const url = route.request().url();
    if (/^https?:/.test(url)) {
      try {
        requireLoopback(url, "Browser request");
      } catch {
        await route.abort();
        return;
      }
    }
    await route.continue();
  });
  await db.connect();
  let userId = "";
  let teamId = "";
  let vaultKey = "";
  let documentId = "";
  const foreignTeamIds: string[] = [];
  let secret = "";
  let backupCode = "";
  let cleanupError: unknown;

  try {
    await test.step("API readiness confirms database, Redis and storage", async () => {
      await expect
        .poll(async () =>
          (await page.request.get(`${apiUrl}/health/ready`)).status(),
        )
        .toBe(200);
    });
    await test.step("email OTP creates a user and full onboarding creates team membership", async () => {
      await emailSignIn(page, email);
      await completeOnboarding(page, company);
      const { rows } = await db.query(
        "SELECT id, team_id FROM public.users WHERE email = $1",
        [email],
      );
      expect(rows).toHaveLength(1);
      userId = rows[0].id;
      teamId = rows[0].team_id;
      expect(teamId).toEqual(expect.any(String));
      const membership = await db.query(
        "SELECT 1 FROM users_on_team WHERE user_id = $1 AND team_id = $2",
        [userId, teamId],
      );
      expect(membership.rowCount).toBe(1);
    });

    await test.step("hydrated vault upload completes storage registration and downloads original bytes", async () => {
      await page.goto("/vault");
      await waitForHydratedInput(page, "#upload-files");
      const completed = page.waitForResponse(
        (response) =>
          response.url().includes("storage.completeUploads") &&
          response.request().method() === "POST",
        { timeout: 60_000 },
      );
      await page
        .locator("#upload-files")
        .setInputFiles({ name: filename, mimeType: "image/png", buffer: png });
      expect((await completed).ok()).toBeTruthy();
      await expect
        .poll(
          async () => {
            const { rows } = await db.query(
              "SELECT id, path_tokens, owner_id FROM documents WHERE team_id = $1 AND name = $2",
              [teamId, `${teamId}/${filename}`],
            );
            if (rows[0]) {
              vaultKey = rows[0].path_tokens.join("/");
              documentId = rows[0].id;
            }
            return rows[0]?.owner_id;
          },
          {
            message:
              "Upload completion must register the owning user and document",
          },
        )
        .toBe(userId);
      const token = await sessionJwt(page);
      const signed = await trpcData<{ signedUrl: string }>(
        await trpc(
          page.request,
          token,
          "documents.signedUrl",
          { filePath: vaultKey, expireIn: 60 },
          true,
        ),
      );
      const file = await page.request.get(signed.signedUrl);
      expect(file.ok()).toBeTruthy();
      expect(await file.body()).toEqual(png);
    });

    await test.step("database notification updates the browser and the document is searchable", async () => {
      const connected = page.waitForResponse(
        (response) =>
          response.url().includes("/realtime/stream") &&
          response.status() === 200,
      );
      await page.goto("/vault?view=grid");
      await connected;
      await expect
        .poll(
          async () => {
            const result = await db.query(
              "SELECT count(*)::int AS count FROM pg_stat_activity WHERE application_name='midday-realtime' AND query ILIKE 'LISTEN%'",
            );
            return result.rows[0].count;
          },
          {
            message: "Postgres LISTEN must be ready before sending the update",
          },
        )
        .toBeGreaterThan(0);
      const marker = `Realtime${runId.replaceAll("-", "")}`;
      // No browser reload follows this database write: the rendered title must
      // change through the application's authenticated SSE subscription.
      await db.query(
        "UPDATE documents SET title=$1, processing_status='completed' WHERE id=$2 AND team_id=$3",
        [marker, documentId, teamId],
      );
      await expect(page.getByText(marker, { exact: true })).toBeVisible();
      const token = await sessionJwt(page);
      const results = await trpcData<
        { id: string; type: string; title: string }[]
      >(
        await trpc(page.request, token, "search.global", {
          searchTerm: marker,
          limit: 5,
          itemsPerTableLimit: 5,
        }),
      );
      expect(results).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: documentId,
            type: "vault",
            title: marker,
          }),
        ]),
      );
    });

    await test.step("avatar upload updates the user and serves a public image", async () => {
      await page.goto("/account");
      await expect(page.getByText("Avatar", { exact: true })).toBeVisible();
      await waitForHydratedInput(page, 'input[type="file"]');
      await page
        .locator('input[type="file"]')
        .first()
        .setInputFiles({
          name: `avatar-${runId}.png`,
          mimeType: "image/png",
          buffer: png,
        });
      let avatarUrl = "";
      await expect
        .poll(async () => {
          const { rows } = await db.query(
            "SELECT avatar_url FROM users WHERE id = $1",
            [userId],
          );
          avatarUrl = rows[0]?.avatar_url ?? "";
          return avatarUrl;
        })
        .toContain(`${storageEndpoint}/avatars/${userId}/`);
      expect((await page.request.get(avatarUrl)).ok()).toBeTruthy();
      await expect(
        page.locator(`img[src="${avatarUrl}"]`).first(),
      ).toBeVisible();
    });

    await test.step("real JWT authorizes own user and refuses forged token and foreign tenant writes", async () => {
      const token = await sessionJwt(page);
      const user = await trpcData<{ id: string }>(
        await trpc(page.request, token, "user.me"),
      );
      expect(user.id).toBe(userId);
      expect(
        (await trpc(page.request, "not.a.valid.jwt", "user.me")).status(),
      ).toBe(401);
      const foreignTeam = randomUUID();
      foreignTeamIds.push(foreignTeam);
      const foreignConnection = randomUUID();
      await db.query("INSERT INTO teams(id,name) VALUES($1,$2)", [
        foreignTeam,
        `Foreign ${runId}`,
      ]);
      await db.query(
        "INSERT INTO bank_connections(id,team_id,institution_id,name,provider,reference_id) VALUES($1,$2,$3,'E2E bank','gocardless','unchanged')",
        [foreignConnection, foreignTeam, runId],
      );
      const deniedRead = await trpc(
        page.request,
        token,
        "documents.signedUrl",
        { filePath: `${foreignTeam}/private.png`, expireIn: 60 },
        true,
      );
      expect(deniedRead.status()).toBe(403);
      const deniedWrite = await trpc(
        page.request,
        token,
        "bankConnections.updateReconnect",
        {
          id: foreignConnection,
          referenceId: "attacker-value",
          accessValidForDays: 90,
        },
        true,
      );
      expect(deniedWrite.status()).toBe(404);
      const { rows } = await db.query(
        "SELECT reference_id,expires_at FROM bank_connections WHERE id=$1",
        [foreignConnection],
      );
      expect(rows[0]).toEqual({ reference_id: "unchanged", expires_at: null });
    });

    await test.step("MFA enrolls through the UI and presents recovery codes", async () => {
      await page.goto("/account/security");
      await page
        .getByRole("button", { name: "Enable MFA", exact: true })
        .click();
      await page
        .getByRole("button", { name: "Generate QR", exact: true })
        .click();
      await page.getByRole("button", { name: "Use setup key" }).click();
      secret = (
        await page
          .locator('button[data-track="Copied to Clipboard"]')
          .innerText()
      ).trim();
      expect(secret).toMatch(/^[A-Z2-7]+=*$/i);
      await page
        .getByRole("textbox", { name: "Authenticator code" })
        .fill(totp(secret));
      await expect(
        page.getByText("Save your backup codes", { exact: true }),
      ).toBeVisible();
      backupCode = (
        await page.locator("div.grid.font-mono > span").first().innerText()
      ).trim();
      expect(backupCode.length).toBeGreaterThan(5);
      await page
        .getByRole("button", { name: "I saved my backup codes", exact: true })
        .click();
      await page.goto("/account/security");
      await expect(
        page.getByRole("button", {
          name: "Replace authenticator",
          exact: true,
        }),
      ).toBeVisible();
      await signOut(page);
    });

    await test.step("new OTP session is gated by MFA, rejects wrong TOTP, then accepts correct code", async () => {
      await emailSignIn(page, email);
      await expect(page).toHaveURL(/\/mfa\/verify/);
      await page.goto("/vault");
      await expect(page).toHaveURL(/\/mfa\/verify/);
      const validWindow = new Set(
        [-30_000, 0, 30_000].map((delta) => totp(secret, Date.now() + delta)),
      );
      let wrong = "000000";
      while (validWindow.has(wrong))
        wrong = (Number(wrong) + 1).toString().padStart(6, "0");
      await page
        .getByRole("textbox", { name: "Authenticator code" })
        .fill(wrong);
      await expect(page.locator('p[role="alert"]')).toContainText(
        /invalid.*code|code.*invalid/i,
      );
      await page
        .getByRole("textbox", { name: "Authenticator code" })
        .fill(totp(secret));
      await expect(page).not.toHaveURL(/\/mfa\/verify/);
      await page.goto("/account/security");
      await signOut(page);
    });

    await test.step("backup code signs in once, and final logout revokes the session", async () => {
      await emailSignIn(page, email);
      await expect(page).toHaveURL(/\/mfa\/verify/);
      await page
        .getByRole("button", { name: "Use a backup code", exact: true })
        .click();
      await page.getByRole("textbox", { name: "Backup code" }).fill(backupCode);
      await page
        .getByRole("button", { name: "Verify backup code", exact: true })
        .click();
      await expect(page).not.toHaveURL(/\/mfa\/verify/);
      await page.goto("/account/security");
      await signOut(page);
      await emailSignIn(page, email);
      await expect(page).toHaveURL(/\/mfa\/verify/);
      await page
        .getByRole("button", { name: "Use a backup code", exact: true })
        .click();
      await page.getByRole("textbox", { name: "Backup code" }).fill(backupCode);
      await page
        .getByRole("button", { name: "Verify backup code", exact: true })
        .click();
      await expect(page.locator('p[role="alert"]')).toContainText(
        /invalid.*code|code.*invalid/i,
      );
      await expect(page).toHaveURL(/\/mfa\/verify/);
      await page.getByRole("button", { name: "Sign out", exact: true }).click();
      await expect(page).toHaveURL(/\/login(?:\?|$)/);
      const session = await page.request.get(
        `${dashboardUrl}/api/auth/get-session`,
      );
      expect(await session.json()).toBeNull();
      await page.goto("/vault");
      await expect(page).toHaveURL(/\/login(?:\?|$)/);
    });
  } finally {
    try {
      await cleanupFixtures(db, email, foreignTeamIds);
    } catch (error) {
      cleanupError = error;
      consoleLines.push(`cleanup: ${String(error)}`);
    }
    await db.end();
    await testInfo.attach("browser-console", {
      body: consoleLines.join("\n"),
      contentType: "text/plain",
    });
    // Only identifiers are attached; do not persist TOTP secrets, JWTs or backup codes.
    await testInfo.attach("fixture-identifiers", {
      body: JSON.stringify(
        { email, userId, teamId, filename, vaultKey },
        null,
        2,
      ),
      contentType: "application/json",
    });
  }
  if (cleanupError) throw cleanupError;
});
