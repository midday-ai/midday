## API

### Environment Variables

The API requires the following environment variables:

#### Redis Configuration
```bash
# Local development (Docker):
REDIS_URL=redis://localhost:6379
REDIS_QUEUE_URL=redis://localhost:6379

# Production:
# REDIS_URL=rediss://:password@...upstash.io:6379 (Upstash multi-region)
# REDIS_QUEUE_URL=redis://...railway.internal:6379 (Railway Redis - BullMQ queue)
```

Two separate Redis instances are used:

- **`REDIS_URL`** — Upstash multi-region Redis for caching. Upstash automatically routes reads to the nearest replica and writes to the primary. A single URL works across all Railway regions.
- **`REDIS_QUEUE_URL`** — Railway internal Redis for BullMQ job queues. Kept on Railway because BullMQ requires persistent TCP connections with blocking operations that aren't compatible with Upstash.

#### Local Development Setup

1. **Start Redis with Docker:**
   ```bash
   docker run -d --name redis -p 6379:6379 redis:alpine
   ```

2. **Set environment variable:**
   ```bash
   export REDIS_URL=redis://localhost:6379
   ```

#### Database Configuration
```bash
DATABASE_PRIMARY_URL=postgresql://...
DATABASE_FRA_URL=postgresql://...  # EU replica
DATABASE_IAD_URL=postgresql://...  # US East replica
DATABASE_SJC_URL=postgresql://...  # US West replica
```

### Development

```bash
bun dev
```

### Production

```bash
bun start
```

### Cache Implementation

The API uses Upstash multi-region Redis for distributed caching across all server regions:

- **apiKeyCache**: Caches API key lookups (30 min TTL)
- **userCache**: Caches user data (30 min TTL)
- **teamCache**: Caches team access permissions (30 min TTL)
- **teamPermissionsCache**: Caches team permission lookups (30 min TTL)
- **replicationCache**: Tracks recent mutations for read-after-write consistency (10 sec TTL)

Cache invalidations propagate to all regions automatically via Upstash replication. The client gracefully degrades when Redis is unavailable — cache misses return `undefined` and operations no-op instead of throwing.
