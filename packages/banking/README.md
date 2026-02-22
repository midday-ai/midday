# Banking Provider Implementation

Technical documentation for Midday's multi-provider banking integration.

## Architecture Overview

```
Dashboard (React)
    │
    ▼
tRPC Router (apps/api/src/trpc/routers/banking.ts)
    │
    ▼
Provider Facade (packages/banking/src/index.ts)
    │
    ├── GoCardLessProvider  (EU/UK — xior HTTP client, OAuth2 tokens)
    ├── PlaidProvider        (US/CA — official Plaid SDK)
    ├── TellerProvider       (US — native fetch with mTLS)
    └── EnableBankingProvider (EU — xior HTTP client, RSA-signed JWT)
    │
    ▼
Redis Cache (packages/cache/src/banking-cache.ts)
    │
    ▼
Trigger.dev Jobs (packages/jobs/src/tasks/bank/)
```

### Provider Facade (Strategy Pattern)

The `Provider` class in `index.ts` dispatches to the correct provider based on a
`provider` string param (`"gocardless" | "plaid" | "teller" | "enablebanking"`).
All four providers implement a common interface:

- `getAccounts()` — list accounts with balances for the account selection screen
- `getAccountBalance()` — fetch current balance for a single account
- `getTransactions()` — fetch transactions (full history or latest 5 days)
- `getConnectionStatus()` — check if the bank connection is still valid
- `getInstitutions()` — list supported banks/institutions
- `deleteAccounts()` / `deleteConnection()` — disconnect from provider
- `getHealthCheck()` — provider availability check

---

## Providers

### GoCardless (EU/UK)

- **Auth**: OAuth2 — secret_id/secret_key → access_token + refresh_token, both cached in Redis
- **HTTP client**: xior (axios-like), instance cached per token
- **Coverage**: All EEA countries under PSD2 regulation
- **Rate limits**: Bank-imposed, as low as **4 API calls per day per account**. Each endpoint
  (details, balances, transactions) counts separately. Provides rate limit headers:
  - `HTTP_X_RATELIMIT_REMAINING` — remaining requests in window
  - `HTTP_X_RATELIMIT_ACCOUNT_SUCCESS_RESET` — seconds until reset
- **Connection identifier**: Requisition ID (`reference_id`)
- **Account identifier**: GoCardless account UUID
- **Transaction history**: Institution-dependent, reported via `transaction_total_days` field
  in the institutions list (e.g., 540 days for ABN AMRO, 730 for Revolut)
- **Access duration**: `createEndUserAgreement()` tries 180 days first (EEA standard
  under Article 10a RTS). If the bank rejects it, automatically falls back to 90 days.
  UK banks are limited to 90 days by FCA regulation. The actual `access_valid_for_days`
  accepted by the bank is read from the agreement response and used for `expires_at`.

**Transaction history strategy:**

The maximum history is determined per-institution via the end user agreement:

1. The `/institutions/` endpoint returns `transaction_total_days` for each bank
2. `createEndUserAgreement()` requests `max_historical_days` set to that value
3. Some banks only provide extended history once and require separate consent for
   continuous access. `getMaxHistoricalDays()` checks the GoCardless
   `separate_continuous_history_consent` flag and a hardcoded fallback list, capping to 90 days.
4. Initial sync fetches ALL available transactions (no `date_from` filter)
5. Daily sync fetches last 5 days only (`date_from` = 5 days ago)
6. No fallback strategy is needed — the bank controls what it returns based on the
   agreed `max_historical_days`. If the call fails, it's an auth/rate issue, not a
   data volume issue. `withRateLimitRetry` handles rate limits.

**Key implementation details:**

- `getAccounts()` pre-resolves the access token once and passes it to all sub-methods
  to avoid repeated Redis lookups (~8 → 1 per call)
- Institution is fetched once per requisition (all accounts share the same institution)
- Account details, balances, requisitions, and institutions are cached in Redis
  to bridge the gap between account selection and initial sync

### Plaid (US/CA)

- **Auth**: Official Plaid SDK with `PLAID-CLIENT-ID` + `PLAID-SECRET` headers.
  Per-Item access tokens from the Link flow.
- **HTTP client**: Official Plaid SDK (wraps axios)
- **Rate limits**: Per-endpoint, per-Item and per-client:
  - `/accounts/get`: 15/min per Item, 15,000/min per client
  - `/transactions/get`: 30/min per Item, 20,000/min per client
  - `/transactions/sync`: 50/min per Item, 2,500/min per client
  - `/institutions/get`: 50/min per client
  - `/institutions/get_by_id`: 400/min per client
  - Returns `error_type: "RATE_LIMIT_EXCEEDED"` with endpoint-specific error codes
- **Connection identifier**: Access token (per-Item)
- **Account identifier**: Plaid account ID (stable within an Item)
- **Transaction history**: Up to 2 years (requested via `days_requested: 730`)

**Key implementation details:**

- Initial sync uses `/transactions/sync` with no cursor (returns all history)
- Daily sync uses `/transactions/get` with a 5-day window
- Institution data is cached for 24 hours (static data)
- Plaid preserves account IDs across reconnects (update mode)

### Teller (US)

- **Auth**: mTLS (client certificate) + Basic Auth with access token
- **HTTP client**: Native Bun `fetch` (required for mTLS `tls: { cert, key }` support)
- **Rate limits**: HTTP 429, thresholds not publicly documented. Free tier has stricter limits.
- **Connection identifier**: Access token
- **Account identifier**: Teller account ID
- **Balance strategy**: Derived from `running_balance` in recent transactions (free).
  Avoids the paid `/balances` endpoint.

**Key implementation details:**

- `getConnectionStatus()` simplified to a single `/accounts` call (was N+1 calls)
- Institution list cached for 24 hours
- mTLS cert/key are base64-encoded in environment variables

### Enable Banking (EU)

- **Auth**: RSA-signed JWT (RS256, PKCS8 private key). Max TTL: 24 hours.
- **HTTP client**: xior (axios-like), instance cached alongside JWT
- **Coverage**: 4,700+ ASPSPs across EEA
- **Rate limits**: HTTP 429 on all endpoints, exact thresholds not documented
- **Connection identifier**: Session ID
- **Account identifier**: Enable Banking account UUID
- **Transaction strategy**: Hybrid approach — "longest" strategy for history,
  "default" strategy for recent data, with fallback to 1-year default range

**Key implementation details:**

- JWT is cached in memory (~20 hours) to avoid RSA signing on every request
- xior client instance is reused as long as JWT hasn't changed
- Session, account details, and institution list are cached in Redis
- Requires `Psu-Ip-Address` and `Psu-User-Agent` headers on GET requests
- Transaction deduplication is handled at the database layer (upsert with `internal_id`)

---

## Caching Strategy

All caching uses `bankingCache` from `@midday/cache/banking-cache`, backed by
Redis (Upstash) with the `"banking"` key prefix.

### Cache TTLs

| Data | TTL | Rationale |
|------|-----|-----------|
| GoCardless access token | Dynamic (expires - 1h) | OAuth token lifecycle |
| GoCardless refresh token | Dynamic (expires - 1h) | OAuth token lifecycle |
| Requisition / Session | 15 minutes | Bridges account selection → sync |
| Account details | 30 minutes | Static within a flow, rarely changes |
| Account balance | 30 minutes | DB is source of truth; prevents redundant API calls |
| Individual institution | 24 hours | Institution data is static |
| Institution lists | 24 hours | Lists change very rarely |
| EnableBanking JWT | ~20 hours (in-memory) | Avoids RSA signing per request |

### `getOrSet` Pattern

The `bankingCache.getOrSet(key, ttl, fn)` helper eliminates cache boilerplate:

```typescript
// Instead of:
const cached = await bankingCache.get(key);
if (cached) return cached as T;
const result = await fetchFromApi();
bankingCache.set(key, result, ttl);
return result;

// Write:
return bankingCache.getOrSet(key, CacheTTL.THIRTY_MINUTES, () => fetchFromApi());
```

### What is NOT cached

- **Transactions**: Must be fresh every sync (the whole point of syncing)
- **Mutations**: Link creation, token exchange, agreements — one-time operations
- **Delete operations**: Side effects, cannot be cached
- **Teller balance**: Derived from transaction data, not a standalone API call

---

## Sync Flows

### Initial Connection Flow

```
1. User selects provider + bank in dashboard
2. OAuth/Link flow with provider (provider-specific)
3. Dashboard calls getProviderAccounts → populates cache
4. User selects which accounts to enable
5. API creates bank_connection + bank_accounts in DB
6. Triggers "initial-bank-setup" job:
   a. Creates daily cron schedule for the team (randomized time)
   b. Runs syncConnection (manualSync: true) — waits for completion
   c. Triggers second syncConnection after 5 minutes (catches delayed data)
```

### Daily Background Sync

```
1. Cron triggers bankSyncScheduler for the team
2. Batch-triggers syncConnection for each bank_connection
3. syncConnection:
   a. Checks connection status via provider API
   b. If connected: syncs each enabled account sequentially (60s delay between accounts)
   c. If disconnected: updates status in DB
4. syncAccount (per account):
   a. Fetches balance → updates DB
   b. Fetches transactions (latest 5 days) → upserts in batches of 500
5. Transaction notifications triggered after 5 minutes (background only)
```

### Reconnect Flow

```
1. User re-authenticates with provider
2. "reconnect-connection" job:
   a. Fetches fresh accounts from provider
   b. Matches old account IDs to new ones:
      - GoCardless/Teller/EnableBanking: uses account_reference matching
      - Plaid: IDs preserved via update mode (no remapping needed)
   c. Updates account_id mappings in DB
   d. Triggers syncConnection (manualSync: true)
```

### Error Handling

- Accounts track `error_retries` count in the DB
- Background syncs skip accounts with 3+ error retries
- Manual syncs allow all accounts (to clear errors after reconnect)
- If ALL accounts in a connection have 3+ retries, the connection is auto-disconnected
- Balance/transaction fetch errors increment `error_retries`; success resets them

---

## Rate Limit Handling

All providers are wrapped with `withRateLimitRetry` which:

1. Detects HTTP 429 responses (status code or Plaid's `RATE_LIMIT_EXCEEDED` error type)
2. Reads provider-specific headers for delay:
   - GoCardless: `HTTP_X_RATELIMIT_ACCOUNT_SUCCESS_RESET` (seconds until reset)
   - Standard: `Retry-After` header
3. Falls back to exponential backoff with jitter (1s, 2s, 4s, max 8s)
4. Retries up to 3 times before propagating the error

Additionally:
- Accounts are synced **sequentially** with delays (30s manual, 60s background) to avoid
  overwhelming provider rate limits
- GoCardless bank-level rate limits (4/day/account) are addressed by caching
  (details, balances, institution) so each piece of data is fetched at most once per flow

---

## Edge Cases

### GoCardless: Bank-imposed rate limits

Some banks limit to 4 API calls per day per account per endpoint. Our caching strategy
ensures account details, balances, and institution data are fetched once during account
selection and reused during the initial sync, staying within even the strictest limits.

### GoCardless: Requisition expiry and EUA fallback

Requisitions can have status `"EX"` (expired) or `"RJ"` (rejected). The connection status
check detects both and marks the connection as disconnected.

`createEndUserAgreement()` uses a **try-180, fall-back-to-90** strategy for
`access_valid_for_days`. Per the EC Article 10a RTS (effective July 2023), EEA banks
should accept 180 days, but compliance varies. If a bank rejects 180 days, the method
automatically retries with 90. The actual value the bank accepted is read from the
agreement response and threaded through to `transformAccount` for an accurate `expires_at`.
On reconnect, the value is passed via the redirect URL so `updateBankConnection` also
stores the correct expiry.

### GoCardless: Institution-specific history restrictions

Some banks only provide extended (>90 day) transaction history once and require separate
consent for continuous access. `getMaxHistoricalDays()` uses two signals to detect these:

1. **API flag**: GoCardless exposes `separate_continuous_history_consent` on the
   `/institutions/` endpoint. When `true`, history is capped to 90 days.
2. **Hardcoded fallback**: A small Set of known restricted institution IDs (BRED, Swedbank,
   BBVA, etc.) catches banks where the flag may not yet be populated.

When neither signal matches, the full `transaction_total_days` from the institution is used.

See: https://bankaccountdata.zendesk.com/hc/en-gb/articles/11529718632476

### GoCardless / EnableBanking: Primary balance selection for multi-currency accounts

PSD2 banks return an array of balances from the `/balances` endpoint, each with its own
`balanceType` and `currency`. For single-currency accounts this array typically has one or
two entries. For multi-currency accounts (common with Nordic/European banks), it can have
entries in multiple currencies — e.g., both DKK and EUR.

The `selectPrimaryBalance` utility (`gocardless/utils.ts`, `enablebanking/utils.ts`) picks
the balance to use as the account's displayed balance using a **booked-first** strategy
(settled amounts are more appropriate for accounting):

1. **Priority by balance type** (first match wins):
   1. `interimBooked` / `ITBD` — current intraday settled balance (best: current + settled)
   2. `closingBooked` / `CLBD` — end-of-day settled balance (settled but may be stale)
   3. `interimAvailable` / `ITAV` — current available (may include credit limits)
   4. `expected` / `XPCD`
   5. First balance in the array (fallback)
2. **Currency hint**: When the account-level currency is known (e.g., `account.currency`),
   balances matching that currency are tried first within each tier. This prevents multi-currency
   accounts from picking the wrong currency based on raw amount comparison alone. If the hint
   is `"XXX"` or no balances match, the hint is ignored and all balances are considered.
3. **Within each tier**, pick the entry with the highest absolute amount (fallback for when
   no currency hint is available or multiple balances share the same currency). Absolute value
   is used so credit accounts with negative balances are handled correctly.

The `available_balance` field is populated separately by scanning the full balances array
for an "available" type entry (`interimAvailable`, `ITAV`, `closingAvailable`, `CLAV`,
`OPAV`), regardless of which balance was selected as primary.

### GoCardless / EnableBanking: ISO 4217 "XXX" currency code

Some PSD2 banks return `"XXX"` (ISO 4217 for "no currency") as the account-level currency
in the account details endpoint, while individual transactions correctly report the real
currency (e.g., `EUR`). This affects both GoCardless and EnableBanking since they connect
to the same underlying European banks.

The system handles this at three levels:

1. **Transform layer** (`gocardless/transform.ts`, `enablebanking/transform.ts`): When
   `account.currency` is `"XXX"`, falls back to the balance currency, then to currencies
   from the balances array. If all sources are `"XXX"`, the raw value is preserved (no
   hardcoded fallback — these could be GBP, SEK, DKK, etc.).
2. **Sync self-heal** (`sync/account.ts`): During daily sync, if the stored currency is
   `"XXX"`, the job updates it from the balance response currency. If the balance is also
   `"XXX"`, it derives the currency from the first transaction with a valid currency code.
3. **Dashboard display** (`apps/dashboard/src/utils/format.ts`): `formatAmount` detects
   `"XXX"` and formats the value as a plain decimal number (e.g., `5,000.00`) without a
   currency symbol, avoiding misleading display.

### Plaid: Transactions during pagination

Plaid's `/transactions/sync` can return `TRANSACTIONS_SYNC_MUTATION_DURING_PAGINATION`
if data changes during pagination. The `withRateLimitRetry` wrapper handles retries.
Consider adding `count: 500` (max) to reduce the likelihood of this error.

### EnableBanking: Stale "longest" strategy data

Some ASPSPs (e.g., Wise) return stale/cached data with the "longest" transaction strategy.
The implementation uses a hybrid approach: fetches with "longest" first, checks if the most
recent transaction is within 7 days, and if stale, supplements with "default" strategy data.
Duplicates are handled by the database upsert layer.

### EnableBanking: JWT expiry mid-request

The JWT is cached with a 5-minute safety margin — if the JWT has less than 5 minutes of
validity left, a new one is generated. This prevents requests from failing due to token
expiry during execution.

### Teller: Balance from transactions

Balance is derived from `running_balance` in the first 50 transactions. If no transactions
have a `running_balance` (rare — new accounts or uncommon institutions), balance defaults
to 0. A fallback to the paid `/balances` endpoint could be added if needed.

### Reconnect: Account ID remapping

When a user reconnects a GoCardless, Teller, or EnableBanking connection, the provider
issues new account identifiers. The `reconnect-connection` job
(`packages/jobs/src/tasks/reconnect/connection.ts`) handles this by:

1. Fetching fresh accounts from the provider API
2. Matching them to existing DB accounts via `findMatchingAccount`
3. Updating `account_id`, `account_reference`, and `iban` on matched rows

The matching algorithm (`packages/supabase/src/utils/account-matching.ts`) uses a
**tiered strategy**:

1. **resource_id / account_reference** — the identifier we already track, most direct match
2. **IBAN** — stable bank-side identifier (fallback for old accounts missing `account_reference`)
3. **Fuzzy** — currency + type, preferring name match (catches accounts like PayPal
   that lack both resource_id and IBAN)

Each DB account can only be matched once to prevent duplicate assignments.

Plaid preserves account IDs across reconnects via "update mode", so no remapping is needed.

### Redis cache unavailability

If Redis is temporarily unavailable, all cache operations fail gracefully (RedisCache has
try/catch on get/set). Methods fall through to the fetch function as if the cache was empty.
This means the system degrades to making direct API calls — slower but functional.

---

## Future Improvements

### Plaid: Cursor persistence for incremental sync

**Impact**: High — reduces daily sync API calls and catches modified/removed transactions

Currently, daily syncs use `/transactions/get` with a 5-day window. Plaid recommends
persisting the `/transactions/sync` cursor between syncs for true incremental updates.

Requirements:
- Add `plaid_sync_cursor` column to `bank_connections` table (cursor is per-Item)
- Restructure sync to call `transactionsSync` at the connection level, then distribute
  transactions to individual accounts
- Handle `modified` and `removed` arrays from the sync response (currently ignored)
- Listen only for `SYNC_UPDATES_AVAILABLE` webhook (can drop `HISTORICAL_UPDATE`,
  `DEFAULT_UPDATE`, `INITIAL_UPDATE`)

### Plaid: transactionsSync count parameter

**Impact**: Low — prevents documented pagination error

Add `count: 500` to `transactionsSync` calls to reduce the likelihood of
`TRANSACTIONS_SYNC_MUTATION_DURING_PAGINATION` errors during initial sync pagination.

### GoCardless: Proactive rate limit checking

**Impact**: Medium — prevents hitting bank-imposed limits

Read `HTTP_X_RATELIMIT_REMAINING` from successful responses (not just 429 errors).
If remaining calls are low, proactively delay or skip non-essential requests.

### Connection-level xior instance reuse

**Impact**: Low — saves HTTP client allocations

GoCardless and EnableBanking both cache their xior instances already. A further optimization
would be to share instances across Provider class instantiations (currently each `new Provider()`
creates a new API class with its own cache). This would require a singleton or module-level
cache for HTTP clients.

---

## File Reference

### Banking Package (`packages/banking/src/`)

| File | Purpose |
|------|---------|
| `index.ts` | Provider facade class + exports |
| `interface.ts` | Common Provider interface |
| `types.ts` | Core request/response types |
| `providers/*/provider.ts` | Provider interface implementations |
| `providers/*/api.ts` | HTTP API clients with caching + rate limit retry |
| `providers/*/transform.ts` | Provider → common type transformers |
| `providers/*/types.ts` | Provider-specific types |
| `utils/retry.ts` | `withRetry` + `withRateLimitRetry` utilities |
| `utils/error.ts` | `ProviderError` class |

### Cache (`packages/cache/src/`)

| File | Purpose |
|------|---------|
| `banking-cache.ts` | `bankingCache` object, `getOrSet` helper, `CacheTTL` constants |
| `redis-client.ts` | `RedisCache` class (generic Redis wrapper) |

### Jobs (`packages/jobs/src/tasks/bank/`)

| File | Purpose |
|------|---------|
| `setup/initial.ts` | Initial bank setup (schedule + first sync) |
| `scheduler/bank-scheduler.ts` | Daily cron → fan-out to connections |
| `sync/connection.ts` | Connection status check + fan-out to accounts |
| `sync/account.ts` | Balance + transaction sync per account |
| `transactions/upsert.ts` | DB upsert + trigger embeddings |
| `notifications/transactions.ts` | New transaction notifications |

### Reconnect (`packages/jobs/src/tasks/reconnect/`)

| File | Purpose |
|------|---------|
| `connection.ts` | Account ID remapping after reconnect |
