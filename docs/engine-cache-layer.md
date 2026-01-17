# Engine Cache Layer

## Overview

The engine uses Cloudflare KV to cache bank provider API responses. This caching layer serves two critical purposes:

1. **Rate limit protection** - Especially for GoCardLess which has a strict limit of 12 API calls per day
2. **Performance** - Reduces latency by avoiding redundant API calls

## Architecture

All providers use a shared `withCache` utility located at `apps/engine/src/utils/cache.ts`:

```typescript
export async function withCache<T>(
  kv: KVNamespace,
  key: string,
  ttl: number,
  fetcher: () => Promise<T>,
  options?: { skipCache?: boolean },
): Promise<T>
```

### Cache TTLs

| Data Type | TTL | Rationale |
|-----------|-----|-----------|
| Accounts | 4 hours | Account structure rarely changes |
| Account details | 4 hours | IBAN, routing numbers don't change |
| Institutions | 4 hours | Institution metadata is static |
| Balances | 1 hour | Balances change more frequently |

## Cache Behavior

| Scenario | Cache Read | Cache Write | API Call |
|----------|------------|-------------|----------|
| Normal request | Yes | If miss | If miss |
| `skipCache: true` | No | Yes | Always |
| API error | - | Delete | - |

### Key Behaviors

1. **Cache on success only** - Only non-null/undefined results are cached
2. **Auto-invalidation on error** - If an API call fails, the cache entry is deleted to allow fresh retry
3. **Skip cache option** - The `skipCache` parameter bypasses cache read but still writes fresh results

## When skipCache is Used

- **User clicks "Refresh" button** - Frontend passes `skipCache: true` to get fresh data
- **After reconnect flow completes** - Ensures user sees updated account state

### Important: Nested Cache Behavior

When `skipCache: true` is passed to `getAccounts`, only the **outer accounts cache** is bypassed. Nested calls (details, balances, institution) still read from their individual caches:

```
getAccounts(skipCache: true)
  ├── getRequestion()        → cached (4 hours)
  ├── getInstitution()       → cached (4 hours)
  └── per account:
      ├── getAccountDetails()  → cached (4 hours)
      └── getAccountBalances() → cached (1 hour)
```

**Why this is intentional:**
- GoCardLess has a 12/day rate limit - a full refresh would consume 6+ calls
- Balances are at most 1 hour stale, which is acceptable for most use cases
- If a nested API call fails, its cache is auto-invalidated, so the next request fetches fresh

**Result:** A "refresh" gives you the latest account structure with balances that are at most 1 hour old.

## Provider-Specific Details

### GoCardLess (Most Critical)

Rate limit: **12 API calls per day**

Endpoints cached:
- `GET /api/v2/requisitions/{id}/` - Session/requisition data
- `GET /api/v2/institutions/{id}/` - Institution metadata
- `GET /api/v2/accounts/{id}/details/` - Account details (IBAN, owner name)
- `GET /api/v2/accounts/{id}/balances/` - Account balances

Without caching, a single account selection could consume all 12 daily calls. With caching:
- First load: ~6 API calls (1 requisition + 1 institution + 2 per account for details/balances)
- Subsequent loads: 0 API calls (served from cache)

### Plaid

Rate limit: ~100/minute (more generous)

Endpoints cached:
- `accountsGet` - All accounts for an access token
- `institutionsGetById` - Institution metadata

### Teller

Endpoints cached:
- `/accounts` - All accounts
- `/accounts/{id}/details` - Account details with routing numbers
- `/accounts/{id}/balances` - Full balance info

### EnableBanking

Similar to GoCardLess, endpoints cached:
- Session data
- `/accounts/{id}/details`
- `/accounts/{id}/balances`

## Cache Keys

Cache keys follow a consistent pattern:

```
{provider}_{resource}_{identifier}
```

For tokens, a hash is used to avoid storing sensitive data:

```typescript
// Example: plaid_accounts_a3f2b1c4
const tokenHash = await hashToken(accessToken);
const cacheKey = `plaid_accounts_${tokenHash}`;
```

## Rate Limit Protection Example

**Without cache:**
```
User loads accounts once → 6 GoCardLess API calls
User refreshes 10 times → 60 API calls → RATE LIMITED
```

**With cache (normal load):**
```
User loads accounts once → 6 API calls (cache miss)
User loads again within 4 hours → 0 API calls (cache hit)
```

**With cache + skipCache on refresh:**
```
User clicks refresh → 1 API call (outer cache skipped, nested caches hit)
User refreshes 10 times → 10 API calls → Safe (nested caches protect us)
```

The nested cache design means even aggressive refreshing stays within rate limits.

## Implementation Notes

1. All providers import from shared utils:
   ```typescript
   import { CACHE_TTL, hashToken, withCache } from "@engine/utils/cache";
   ```

2. The `skipCache` parameter flows through the entire stack:
   ```
   Dashboard → API (tRPC) → Engine (Hono) → Provider → withCache
   ```

3. Error handling relies on `withCache`'s automatic invalidation - no manual cache clearing needed on reconnect as long as the sync flow handles errors properly.
