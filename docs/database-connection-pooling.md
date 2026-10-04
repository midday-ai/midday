# Database connection pooling

Both backend profiles use Postgres through Drizzle. Supabase is the default. `NEXT_PUBLIC_BACKEND_PROVIDER=local` selects the separate local database, better-auth, S3, and SSE stack; the selector does not rewrite database URLs.

## Connection URLs

| Variable | Purpose |
| --- | --- |
| `DATABASE_PRIMARY_URL` | API/dashboard primary reads and writes. Ordinary queries may use a compatible pooler. |
| `DATABASE_PRIMARY_POOLER_URL` | Worker and Trigger.dev jobs. The worker falls back to the primary URL; configure this explicitly for jobs. |
| `DATABASE_FRA_URL`, `DATABASE_IAD_URL`, `DATABASE_SJC_URL` | Optional regional read replicas selected by `RAILWAY_REPLICA_REGION`. |
| `DATABASE_MIGRATION_URL` | Direct connection for local migrations and advisory locks; falls back to the primary URL. Never target the Supabase schema with the local baseline. |
| `DATABASE_LISTEN_URL` | Direct local Postgres connection for realtime LISTEN/NOTIFY. Transaction pooling cannot preserve this session. |
| `DATABASE_SSL` | `disable`, certificate-verified `require`, or `no-verify`. |

Local Compose uses `postgresql://postgres:postgres@localhost:5432/midday` for each database connection with `DATABASE_SSL=disable`. No pooler is needed locally. When SSL is unset, development disables TLS; other environments enable TLS without certificate verification. Set this explicitly for deployments.

## Supabase and optional poolers

Existing Supabase deployments retain their project connection URLs and schema. Supavisor transaction mode or PgBouncer can reduce server connection pressure for ordinary API/worker/job queries. Advisory migration locks and LISTEN need direct connections; Supabase realtime uses channels instead of local LISTEN.

The local baseline must never run against Supabase. The project's existing migrations, auth schema, RLS, and storage triggers remain authoritative.

## Regional reads

| `RAILWAY_REPLICA_REGION` | Read replica |
| --- | --- |
| `europe-west4-drams3a` | `DATABASE_FRA_URL` |
| `us-east4-eqdc4a` | `DATABASE_IAD_URL` |
| `us-west2` | `DATABASE_SJC_URL` |

An unset replica, unknown region, or replica URL equal to the primary reuses the primary pool. A distinct replica creates a second pool. Writes always use the primary.

## Pool sizes and budgeting

These values come from `packages/db/src/client.ts`, `worker-client.ts`, and `job-client.ts`.

| Client | Development maximum / minimum | Production maximum / minimum | Other environments |
| --- | --- | --- | --- |
| API/dashboard primary | 8 / 0 | 40 / 8 | 6 / 1 |
| API/dashboard distinct replica | 8 / 0 | 40 / 8 | 6 / 1 |
| Worker | 10 / default | 50 / default | 50 / default |
| Trigger.dev job | 1 / default | 1 / default | 1 / default |

API/dashboard production is detected by `RAILWAY_ENVIRONMENT_NAME=production`, and development by `NODE_ENV=development`. Each worker owns its pool. Each Trigger.dev job creates a single-connection pool and must disconnect it afterward.

Budget against Postgres `max_connections` across all application instances: primary and replica pools, workers, concurrent jobs, dedicated LISTEN connections, and room for administration/migrations. Local Compose allows 200 connections. A transaction pooler's server limits are separate from application client pool sizes; monitor both.
