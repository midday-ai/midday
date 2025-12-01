## API

### Environment Variables

The API requires the following environment variables:

#### Redis Configuration
```bash
# Local development (Docker):
REDIS_URL=redis://localhost:6379

# Production (Upstash Redis via Fly.io):
# REDIS_URL=rediss://:password@fly-midday-redis.upstash.io:6379
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
DATABASE_URL=postgresql://...
DATABASE_READ_URL=postgresql://... # Optional: read replica URL
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

**Production (Fly.io):**
- Handles IPv6 connections
- Longer connection timeouts (10s)
- Higher retry attempts (10)
- TLS support for Upstash Redis

**Development (Local):**
- IPv4 connections
- Shorter timeouts (5s)
- Fewer retries (3)
- No idle timeout

This ensures cache consistency across multiple stateful servers and eliminates the "No procedure found" TRPC errors caused by cache misses.
