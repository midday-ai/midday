# Database Connection Pooling

Technical documentation for the database connection setup across Supabase and Railway.

## Overview

The application connects to Supabase Postgres through **Supavisor** (Supabase's shared connection pooler) in **transaction mode**. Each Railway region's API instance reads from the closest Supabase read replica and writes to the primary database in EU.

## Connection Modes

Supabase offers two pooling modes via `pooler.supabase.com`:

| Mode | Port | Behavior |
|------|------|----------|
| **Session mode** | `5432` | 1:1 client-to-backend mapping. No real pooling — each app connection holds a dedicated Postgres connection for its entire lifetime. |
| **Transaction mode** | `6543` | Real connection pooling. Backend connections are shared between clients and only held during a transaction, then returned to the pool. |

**We use transaction mode (port 6543).** This is critical — session mode on port 5432 provides zero pooling benefit despite routing through `pooler.supabase.com`.

### Connection String Format

```
postgresql://postgres.<project-ref>:<password>@aws-0-<region>.pooler.supabase.com:6543/postgres
```

## Dedicated Pooler (PgBouncer)

Supabase also offers a dedicated PgBouncer co-located on the database machine at `db.<ref>.supabase.co:6543`. This has lower latency (no network hop to a separate server) but requires IPv6 connectivity or the Supabase IPv4 add-on ($4/mo per database).

Railway does **not** support IPv6 to Supabase's direct endpoints, so the shared Supavisor pooler is the correct choice for our infrastructure.

## Multi-Region Replica Mapping

The API runs in 3 Railway regions. Each instance reads from the closest Supabase read replica via the `RAILWAY_REPLICA_REGION` environment variable:

| Railway Region | Env Var | Supabase Region | Role |
|----------------|---------|-----------------|------|
| `europe-west4-drams3a` | `DATABASE_FRA_URL` | `eu-central-1` | Primary (reads + writes) |
| `us-east4-eqdc4a` | `DATABASE_IAD_URL` | `us-east-1` | Read replica |
| `us-west2` | `DATABASE_SJC_URL` | `us-west-1` | Read replica |

- **Reads** are routed to the regional replica via `executeOnReplica` and the `withReplicas` wrapper in `packages/db/src/replicas.ts`.
- **Writes** always go to `DATABASE_PRIMARY_URL` (the primary in `eu-central-1`).

## Pool Configuration

Defined in `packages/db/src/client.ts`:

| Setting | Development | Production |
|---------|-------------|------------|
| `max` | 8 | 12 |
| `idleTimeoutMillis` | 5,000ms | 60,000ms |
| `connectionTimeoutMillis` | 5,000ms | 5,000ms |
| `maxUses` | 100 | 0 (unlimited) |
| `ssl` | disabled | enabled (rejectUnauthorized: false) |

Each API instance creates up to 2 pools (primary + 1 regional replica), so the maximum backend connections per instance is `12 × 2 = 24`. With Supavisor transaction mode, these are multiplexed into a much smaller number of actual Postgres backend connections.

## Prepared Statements

Transaction mode does **not** support named prepared statements. The `node-postgres` (`pg`) package with Drizzle ORM uses unnamed parameterized queries (extended query protocol without a `name` field), which are compatible with transaction mode. No special configuration is needed.

**Do not** add named queries like `pool.query({ name: 'my-query', text: '...' })` — these will fail through the pooler.

## Environment Variables

### API Service
- `DATABASE_PRIMARY_URL` — Primary database (EU, writes + reads)
- `DATABASE_FRA_URL` — EU read replica (same as primary)
- `DATABASE_IAD_URL` — US East read replica
- `DATABASE_SJC_URL` — US West read replica

### Worker Service
- `DATABASE_PRIMARY_POOLER_URL` — Primary database (EU)

### Dashboard Service
- No database variables — connects to the API via tRPC, not directly to Postgres.

## Railway Deploy Configuration

- **API**: 3 regions × 1 replica each (production), 3 regions × 1 replica each (staging)
- **Dashboard**: 3 regions × 2 replicas each (production), 3 regions × 1 replica each (staging, with serverless/sleep enabled)
- **Worker**: 1 region (EU) × 3 replicas (production)
