# API Deployment Configuration

This document describes the Fly.dev API deployment setup and Supabase database connection configuration for Abacus.

---

## Architecture Overview

| Component | Platform | URL |
|-----------|----------|-----|
| **API** | Fly.dev | `abacus-api.fly.dev` |
| **Dashboard** | Vercel | `app.abacuslabs.co` |
| **Database** | Supabase | PostgreSQL (Session Pooler) |

The API is a standalone Hono server deployed to Fly.dev. It connects to Supabase PostgreSQL using the **session pooler** for connection management.

---

## Required Fly.dev Secrets

All secrets must be set in Fly.dev for the API to function correctly.

### Database Connection
| Secret | Description |
|--------|-------------|
| `DATABASE_SESSION_POOLER` | Primary connection URL (uses Supabase session pooler) |
| `DATABASE_PRIMARY_URL` | Fallback/direct connection URL |
| `DATABASE_FRA_URL` | Replica URL (can point to session pooler) |
| `DATABASE_IAD_URL` | Replica URL (can point to session pooler) |
| `DATABASE_SJC_URL` | Replica URL (can point to session pooler) |

### Supabase
| Secret | Description |
|--------|-------------|
| `SUPABASE_URL` | Supabase project URL (e.g., `https://[PROJECT_ID].supabase.co`) |
| `SUPABASE_SERVICE_KEY` | Service role key for admin access |

### Application
| Secret | Description |
|--------|-------------|
| `FILE_KEY_SECRET` | Encryption key for file storage operations |
| `ALLOWED_API_ORIGINS` | CORS origins (e.g., `https://app.abacuslabs.co`) |

### External Services
| Secret | Description |
|--------|-------------|
| `REDIS_URL` | Redis cache connection URL |
| `RESEND_API_KEY` | Resend email service API key |
| `STRIPE_SECRET_KEY` | Stripe payments secret key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |

---

## Supabase Connection String Format

### Session Pooler URL (Recommended)

```
postgresql://postgres%2E[PROJECT_ID]:[PASSWORD]@aws-1-us-east-1.pooler.supabase.com:5432/postgres
```

### Critical Configuration Notes

1. **URL-encode the username**
   - The username contains a `.` (dot) which MUST be URL-encoded as `%2E`
   - Example: `postgres.ubbkuicqxbpagwfyidke` becomes `postgres%2Eubbkuicqxbpagwfyidke`

2. **Use Session Pooler (port 5432)**
   - Session pooler: port `5432` (use this for serverless/Fly.dev)
   - Transaction pooler: port `6543` (NOT recommended for this use case)
   - Direct connection: port `5432` on direct host (requires SSL)

3. **Password Requirements**
   - Avoid special characters in passwords, OR
   - URL-encode all special characters in the connection string
   - Characters like `@`, `:`, `/`, `?`, `#` must be encoded

### Connection String Components

```
postgresql://[USERNAME]:[PASSWORD]@[HOST]:[PORT]/[DATABASE]
     │           │          │         │      │       │
     │           │          │         │      │       └── postgres (database name)
     │           │          │         │      └── 5432 (session pooler port)
     │           │          │         └── aws-1-us-east-1.pooler.supabase.com
     │           │          └── Your database password (URL-encoded if needed)
     │           └── postgres%2E[PROJECT_ID]
     └── postgresql:// protocol
```

---

## Common Issues & Fixes

### SASL Authentication Failed

**Symptom:**
```
SASL authentication failed
```

**Causes & Fixes:**
1. **Wrong password** - Verify the password matches Supabase dashboard
2. **Username not URL-encoded** - Ensure `.` is encoded as `%2E`
3. **Special characters in password** - URL-encode or reset to alphanumeric password

### Connection Refused

**Symptom:**
```
Connection refused to host:port
```

**Causes & Fixes:**
1. **Wrong host** - Use `aws-1-us-east-1.pooler.supabase.com` for session pooler
2. **Wrong port** - Session pooler uses `5432`, not `6543`
3. **Network/firewall issue** - Check Fly.dev region and Supabase allowed IPs

### FILE_KEY_SECRET Not Set

**Symptom:**
```
Error: FILE_KEY_SECRET environment variable is not set
```

**Fix:**
```bash
flyctl secrets set FILE_KEY_SECRET="your-32-character-secret-key" --app abacus-api
```

### Environment Variable Missing

**Symptom:**
```
Missing required environment variable: [VAR_NAME]
```

**Fix:**
```bash
flyctl secrets set VAR_NAME="value" --app abacus-api
```

---

## Deployment Commands

### Deploy to Fly.dev

```bash
# Standard deployment (builds remotely)
flyctl deploy --app abacus-api --remote-only

# Deploy with specific config file
flyctl deploy --app abacus-api --config apps/api/fly.toml --remote-only
```

### Manage Secrets

```bash
# Set a single secret
flyctl secrets set KEY=value --app abacus-api

# Set multiple secrets
flyctl secrets set KEY1=value1 KEY2=value2 --app abacus-api

# List all secrets (names only, not values)
flyctl secrets list --app abacus-api

# Remove a secret
flyctl secrets unset KEY --app abacus-api
```

### View Logs

```bash
# Stream live logs
flyctl logs --app abacus-api

# View recent logs (no streaming)
flyctl logs --app abacus-api --no-tail

# Filter by region
flyctl logs --app abacus-api --region iad
```

### App Management

```bash
# Restart the app
flyctl apps restart abacus-api

# Check app status
flyctl status --app abacus-api

# SSH into the running machine
flyctl ssh console --app abacus-api

# Scale the app
flyctl scale count 2 --app abacus-api
```

---

## Verification Checklist

When deploying or debugging, verify:

- [ ] All required secrets are set (`flyctl secrets list --app abacus-api`)
- [ ] Database connection string has URL-encoded username
- [ ] Session pooler URL uses port 5432
- [ ] Password has no unencoded special characters
- [ ] `FILE_KEY_SECRET` is set
- [ ] `ALLOWED_API_ORIGINS` includes the dashboard URL
- [ ] Logs show successful startup (`flyctl logs --app abacus-api --no-tail`)

---

## Related Files

| File | Purpose |
|------|---------|
| `apps/api/fly.toml` | Fly.dev configuration |
| `apps/api/Dockerfile` | Container build configuration |
| `packages/db/src/client.ts` | Database client configuration |
| `apps/api/src/index.ts` | API entry point |

---

*Last updated: January 2025*
