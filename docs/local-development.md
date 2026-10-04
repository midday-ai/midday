# Local development

Midday supports two backend profiles. **Supabase is the default**, preserving hosted Auth, Storage, Realtime, and the existing database schema. Set `NEXT_PUBLIC_BACKEND_PROVIDER=local` to use a separate Postgres database, better-auth, S3-compatible storage, and server-sent events.

Use the same provider value in the dashboard, API, worker, and jobs. The dashboard embeds it at build time: restart development servers or rebuild after changing profiles. Each profile must use its own database and storage.

## Prerequisites and environment files

Install **Bun 1.3.11** and Docker with Compose v2. From a fresh checkout's repository root:

```sh
bun install --frozen-lockfile
cp apps/dashboard/.env-example apps/dashboard/.env
cp apps/api/.env-template apps/api/.env
cp apps/worker/.env-template apps/worker/.env
cp packages/jobs/.env-template packages/jobs/.env
```

Keep credentials in these ignored files. Optional banking, email delivery, AI, messaging, and connector credentials can remain empty for local sign-in, teams, storage, and realtime. External operations for those integrations require their credentials.

## Supabase profile (default)

Leave `NEXT_PUBLIC_BACKEND_PROVIDER=supabase`, or leave it unset. Populate the templates with values from a **dedicated development project**:

| Application | Configuration |
| --- | --- |
| Dashboard | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_SUPABASE_ID`, `SUPABASE_SECRET_KEY` |
| API, worker, jobs | `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, and database URLs for the same project |
| API token verification | Project JWT/JWKS settings from the API template |
| All services | Redis URLs and their public dashboard/API URLs |

Keep the project's existing auth providers and callback allowlist, storage buckets/policies, realtime configuration, schema, RLS, and storage registration triggers. Supabase mode uses Supabase sessions/MFA, TUS uploads, and realtime channels. It does not require better-auth or local S3 credentials.

**Do not run `db:migrate` against Supabase.** The local baseline belongs to the separate local database. The migrator requires explicit local selection and rejects databases containing `auth.users` or `storage.objects` before migration writes.

Start local Redis with `docker compose up -d --wait redis`, if needed, then use the application startup commands below. Hosted Supabase end-to-end testing requires a configured test project; mocked contracts do not establish hosted end-to-end behavior.

## Local profile

Set `NEXT_PUBLIC_BACKEND_PROVIDER=local` in **each** dashboard/API/worker/jobs `.env`. Set database and Redis variables to the local values:

```dotenv
DATABASE_PRIMARY_URL=postgresql://postgres:postgres@localhost:5432/midday
DATABASE_PRIMARY_POOLER_URL=postgresql://postgres:postgres@localhost:5432/midday
DATABASE_SSL=disable
REDIS_URL=redis://localhost:6379
REDIS_QUEUE_URL=redis://localhost:6379
```

Generate separate local values with `openssl rand -hex 32` for `MIDDAY_ENCRYPTION_KEY`, `INVOICE_JWT_SECRET`, and `FILE_KEY_SECRET`. Set them in the services that use those variables; matching variables must have the same value across services. Keep them stable between restarts.

Leave regional replica URLs empty locally. Start the infrastructure and migrate from the repository root:

```sh
bun run infra:up
NEXT_PUBLIC_BACKEND_PROVIDER=local \
  DATABASE_MIGRATION_URL=postgresql://postgres:postgres@localhost:5432/midday \
  DATABASE_SSL=disable bun run db:migrate
```

The migration settings are explicit because copying app-local `.env` files does not configure the database workspace. Re-running the migrator skips already applied migrations.

Compose runs Postgres 17 with pgvector, Redis 7 with BullMQ's required `noeviction` policy, and the pinned community MinIO build. Startup waits for all three services, then initializes the buckets; initialization errors fail `infra:up`.

| Service | Default local address | Credentials |
| --- | --- | --- |
| Postgres | `localhost:5432` | `postgres` / `postgres` |
| Redis | `localhost:6379` | None |
| S3 API | `http://localhost:9000` | `midday` / `midday-secret` |
| MinIO console | `http://localhost:9001` | `midday` / `midday-secret` |

### Authentication

Generate a stable secret with `openssl rand -hex 32` and set its output as `BETTER_AUTH_SECRET` in `apps/dashboard/.env`. Configure the dashboard:

```dotenv
BETTER_AUTH_URL=http://localhost:3001
AUTH_JWT_AUDIENCE=midday-api
AUTH_TOTP_ISSUER=Midday
NEXT_PUBLIC_URL=http://localhost:3001
NEXT_PUBLIC_API_URL=http://localhost:3003
```

Configure matching API values:

```dotenv
AUTH_JWKS_URL=http://localhost:3001/api/auth/jwks
AUTH_JWT_ISSUER=http://localhost:3001
AUTH_JWT_AUDIENCE=midday-api
ALLOWED_API_ORIGINS=http://localhost:3001
MIDDAY_DASHBOARD_URL=http://localhost:3001
MIDDAY_API_URL=http://localhost:3003
```

Leave `RESEND_API_KEY` empty in local development. Open `/login`, enter an email address, read the OTP in the dashboard terminal, and complete team onboarding. Production email sign-in requires Resend. Leave `NEW_USER_CUTOFF` unset to allow local sign-ups.

TOTP enrollment and backup codes are available in account settings. Enrolled accounts must complete the TOTP step after email/OAuth sign-in before reaching protected pages.

Optional OAuth providers use paired `AUTH_<PROVIDER>_CLIENT_ID` and `AUTH_<PROVIDER>_CLIENT_SECRET` values. Register `http://localhost:3001/api/auth/callback/<provider>` for `google`, `github`, `apple`, or `microsoft`, subject to each provider's console requirements. Local desktop OAuth is deferred; use the browser or email OTP.

### Storage

Use the local storage blocks in the API, worker, and jobs templates:

```dotenv
STORAGE_ENDPOINT=http://localhost:9000
STORAGE_PUBLIC_ENDPOINT=http://localhost:9000
STORAGE_REGION=us-east-1
STORAGE_ACCESS_KEY_ID=midday
STORAGE_SECRET_ACCESS_KEY=midday-secret
STORAGE_FORCE_PATH_STYLE=true
STORAGE_BUCKET_VAULT=vault
STORAGE_BUCKET_AVATARS=avatars
STORAGE_BUCKET_APPS=apps
STORAGE_PUBLIC_URL_AVATARS=http://localhost:9000/avatars
STORAGE_PUBLIC_URL_APPS=http://localhost:9000/apps
```

Set `NEXT_PUBLIC_STORAGE_PUBLIC_HOSTS=localhost:9000` in the dashboard. The vault bucket is private; avatar, app, and banking institution-logo buckets are public. Browser uploads use signed PUT URLs followed by `storage.completeUploads`; server uploads use `uploadVaultObject`. Both explicitly register local vault documents through `upsertDocumentForObject`.

MinIO allows browser requests from `http://localhost:3001`. Update `MINIO_API_CORS_ALLOW_ORIGIN` in Compose if you change that origin. `STORAGE_PUBLIC_ENDPOINT` must be browser-reachable. Cloudflare R2 uses the same adapter with its endpoint, credentials, region `auto`, and public bucket URLs.

### Realtime

Local realtime uses an authenticated API SSE stream and a dedicated Postgres LISTEN connection. Set `DATABASE_LISTEN_URL=postgresql://postgres:postgres@localhost:5432/midday` in the API and `NEXT_PUBLIC_REALTIME_ENABLED=true` in the dashboard. LISTEN must use a direct Postgres connection, not a transaction pooler. The server filters events by the verified user's team/user ID.

## Application startup

After a fresh install, build the worker dashboard's generated assets:

```sh
bun run --cwd packages/workbench build:ui
bun run --cwd packages/workbench build:lib
```

Run these from the repository root in separate terminals:

```sh
bun run dev:api
bun run dev:dashboard
bun run --cwd apps/worker dev
```

Open `http://localhost:3001`; the API listens on port 3003 and the worker on 8080. For local mode, sign in with the terminal OTP, create a team, and upload a vault file. Storage works without AI credentials; AI processing requires its configured provider. `bun dev` starts all workspace development tasks, including optional apps; the three commands above cover the dashboard, API, and worker.

## Verification and CI

The `Backend compatibility` GitHub Actions workflow runs on pull requests and manual dispatch. It uses Ubuntu 24.04, Node 22.23.3, Bun 1.3.11, the frozen lockfile, and local Compose services. Lint and typechecks run without cached results, one task at a time. Database, MFA, storage, API/realtime, jobs, and dashboard suites run serially, followed by a dashboard production build and browser tests. It uses generated local secrets, requires no hosted provider credentials, and does not deploy.

To run the database-backed suites locally, start the infrastructure and migrate the separate `midday_test` database:

```sh
bun run infra:up
export DATABASE_SSL=disable
export TEST_DATABASE_URL=postgres://postgres:postgres@localhost:5432/midday_test
NEXT_PUBLIC_BACKEND_PROVIDER=local DATABASE_MIGRATION_URL="$TEST_DATABASE_URL" bun run db:migrate
export MFA_TEST_DATABASE_URL="$TEST_DATABASE_URL"
export REALTIME_TEST_DATABASE_URL="$TEST_DATABASE_URL"
export STORAGE_ENDPOINT=http://localhost:9000
export STORAGE_PUBLIC_ENDPOINT=http://localhost:9000
export STORAGE_REGION=us-east-1
export STORAGE_ACCESS_KEY_ID=midday
export STORAGE_SECRET_ACCESS_KEY=midday-secret
export STORAGE_FORCE_PATH_STYLE=true
unset NEXT_PUBLIC_BACKEND_PROVIDER
bun run --cwd packages/db test
bun run --cwd packages/auth test
NEXT_PUBLIC_BACKEND_PROVIDER=local bun run --cwd packages/storage test
bun run --cwd apps/api test
bun run --cwd packages/jobs test
bun test --exit --timeout 30000 apps/dashboard/src apps/dashboard/image-loader.test.ts
```

These suites write test fixtures and some database suites truncate test tables. Use the separate `midday_test` database, never a development database with data you want to retain. `MFA_TEST_DATABASE_URL` and `REALTIME_TEST_DATABASE_URL` explicitly enable the auth and realtime integration suites; leaving them unset skips those integrations.

For machines with limited RAM, run Turbo checks with `--concurrency=1` and `NODE_OPTIONS=--max-old-space-size=4096`. Set `NEXT_BUILD_WORKERS=1` and `RAYON_NUM_THREADS=2` for the dashboard build. Do not run a build and browser test servers concurrently.

For the browser smoke suite, build workbench as shown above, stop manually started API/dashboard servers, and run:

```sh
bunx playwright install --with-deps chromium
bun run test:e2e:local
```

The harness prepares and migrates the separate local `midday_e2e` database, starts the API and dashboard, and runs a single browser worker. Its database override is `E2E_DATABASE_URL`, restricted to a loopback host and the `midday_e2e` database name. Other local service overrides are `E2E_DASHBOARD_URL`, `E2E_API_URL`, `E2E_REDIS_URL`, and `E2E_STORAGE_ENDPOINT`.

Failure diagnostics are saved under `test-results/e2e/`, `test-results/e2e-servers/`, and `playwright-report/`. CI also uploads service logs and check output as a seven-day artifact. This proves the local stack and mocked Supabase compatibility contracts; it does not establish hosted Supabase end-to-end behavior. A dedicated Supabase test project is required for that separate acceptance check.

## Troubleshooting

- **Port conflict:** `POSTGRES_PORT=5434 bun run infra:up` changes the exposed database port. Update all database URLs. Other overrides are `REDIS_PORT`, `MINIO_PORT`, and `MINIO_CONSOLE_PORT`; use the same values for later Compose commands.
- **TLS error:** use `DATABASE_SSL=disable` locally. `require` verifies the server certificate; `no-verify` enables TLS without verification. See [connection pooling](database-connection-pooling.md).
- **Migration guard failure:** select local explicitly and use a separate local database. Do not bypass the guard for a hosted schema.
- **401 responses:** ensure all services select the same provider and their issuer/audience/API URLs agree. Sign out and back in after switching profiles.
- **Missing terminal OTP:** local development requires an empty Resend key and development mode. Supabase profile delivery follows the project's auth settings.
- **Missing workbench module:** run both workbench build commands above.
- **Object exists without a document row:** finish the local upload completion request; Supabase depends on its existing storage registration trigger.
- **No realtime updates:** local SSE requires the API, a valid token, and a direct LISTEN URL. Supabase requires its project realtime configuration.

```sh
bun run infra:logs   # Follow service logs
bun run infra:down   # Stop services, retaining data
bun run infra:reset  # Delete local volumes and recreate the services
```

`infra:reset` deletes local database, Redis, and object data. Postgres init scripts run only when its volume is empty.
