# Local browser end-to-end test

Use Node 22.23.3 (the CI version). Run from the repository root after `bun install --frozen-lockfile`, `bunx playwright install chromium`, and `bun run infra:up`:

```sh
bunx playwright test --config tests/e2e/playwright.config.ts
```

The harness starts its own API and Next development server, one browser worker, and no worker/AI/banking services. Stop existing listeners on ports 3001/3003 first. Its Node heap is capped at 3 GiB; do not run another build/typecheck/browser suite concurrently on a memory-constrained machine. No production build is necessary. Local Chrome can be selected with `E2E_BROWSER_CHANNEL=chrome`; CI uses installed Playwright Chromium by default.

The server wrapper creates `midday_e2e` if absent and applies the repository's real local migrations. It never drops databases, truncates tables, or resets Docker volumes. Accounts/teams have unique names; fixtures, user accounts and their local MinIO object prefixes are cleaned up after the test. Set `E2E_KEEP_FIXTURES=1` to preserve a failed run for inspection. Subsequent runs always use new IDs.

Configuration overrides: `E2E_DATABASE_URL` (must use loopback and database `midday_e2e` or `midday_e2e_<suffix>`), `E2E_DASHBOARD_URL`, `E2E_API_URL`, `E2E_REDIS_URL`, `E2E_STORAGE_ENDPOINT`, and local `E2E_STORAGE_ACCESS_KEY_ID`/`E2E_STORAGE_SECRET_ACCESS_KEY`. Defaults match Compose. Changing the dashboard origin also requires MinIO CORS configuration for that origin. Child apps explicitly select local mode and use the dedicated E2E database even if the shell points at another database.

One serial lifecycle test verifies email OTP signup, every onboarding step, vault upload/registration/download, avatar upload, live Postgres/SSE browser updates, global search, valid/forged JWTs, cross-team read/write rejection, MFA enrollment, a gated new login, incorrect/correct TOTP, single-use backup recovery, and session logout. Email codes are read from the real development console; tests never query OTP contents from the database. PostgreSQL inspection verifies ownership and rejected writes.

Artifacts are in `test-results/e2e`, `test-results/e2e-servers`, and `playwright-report`. The dashboard log contains development-only OTPs for disposable test accounts. Traces and screenshots are kept on failure, videos are disabled. Treat these artifacts as private test data. No app dependencies are mocked; external browser requests are blocked. The suite does not claim hosted Supabase or optional paid-provider coverage.

The disposable loopback-only test keys are stable per E2E database so encrypted signing keys remain readable on repeated runs. Never use these fixture keys for an application deployment.
