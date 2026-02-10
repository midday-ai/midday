## API

### Environment Variables

The API requires the following environment variables:

#### Redis Configuration
```bash
# Local development (Docker):
REDIS_URL=redis://localhost:6379
REDIS_QUEUE_URL=redis://localhost:6379

# Production:
# REDIS_URL=rediss://:password@...upstash.io:6379 (Upstash - multi-region cache)
# REDIS_QUEUE_URL=redis://...railway.internal:6379 (Railway Redis - queue)
```

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

The API uses Redis for distributed caching across multiple server instances:

- **apiKeyCache**: Caches API key lookups (30 min TTL)
- **userCache**: Caches user data (30 min TTL)
- **teamCache**: Caches team access permissions (30 min TTL)
- **teamPermissionsCache**: Caches team permission lookups (30 min TTL)
- **replicationCache**: Tracks recent mutations for read-after-write consistency (10 sec TTL)

#### Environment-Specific Configuration

The Redis client automatically configures itself based on the environment:

**Production (Railway):**
- Standard IPv4 connections
- Longer connection timeouts (10s)
- TLS support for Upstash Redis (cache)
- Railway internal networking for queue Redis

**Development (Local):**
- IPv4 connections
- Shorter timeouts (5s)
- No TLS

This ensures cache consistency across multiple stateful servers and eliminates the "No procedure found" TRPC errors caused by cache misses.