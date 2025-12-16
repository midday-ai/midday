# Accounting Integration Architecture

Deep technical documentation of the accounting sync system architecture.

## System Components

### Provider Abstraction Layer

```mermaid
classDiagram
    class AccountingProvider {
        <<interface>>
        +getConsentUrl(state) string
        +exchangeCodeForTokens(code) TokenResponse
        +refreshTokens(refreshToken) TokenResponse
        +isTokenExpired(expiresAt) boolean
        +getAccounts(tenantId) AccountingAccount[]
        +syncTransactions(params) SyncResult
        +uploadAttachment(params) AttachmentResult
    }

    class XeroProvider {
        -client: XeroClient
        +getConsentUrl(state) string
        +exchangeCodeForTokens(code) TokenResponse
        +refreshTokens(refreshToken) TokenResponse
        +isTokenExpired(expiresAt) boolean
        +getAccounts(tenantId) AccountingAccount[]
        +syncTransactions(params) SyncResult
        +uploadAttachment(params) AttachmentResult
    }

    class QuickBooksProvider {
        <<planned>>
    }

    class FortnoxProvider {
        <<planned>>
    }

    AccountingProvider <|.. XeroProvider
    AccountingProvider <|.. QuickBooksProvider
    AccountingProvider <|.. FortnoxProvider
```

### Worker Pipeline

```mermaid
flowchart TB
    subgraph Redis["Redis Queue"]
        Q[accounting queue]
    end

    subgraph Registry["Processor Registry"]
        R[Route by job name]
    end

    subgraph Processors["Processors"]
        P1[SyncTransactionsProcessor]
        P2[SyncAttachmentsProcessor]
        P3[ExportTransactionsProcessor]
        P4[SyncSchedulerProcessor]
    end

    Q --> R
    R -->|sync-accounting-transactions| P1
    R -->|sync-accounting-attachments| P2
    R -->|export-to-accounting| P3
    R -->|accounting-sync-scheduler| P4

    P1 --> |triggers| P2
    P4 --> |triggers| P1
```

### Database Layer

```mermaid
erDiagram
    teams ||--o{ transactions : "owns"
    teams ||--o{ apps : "has"
    teams ||--o{ accounting_sync_records : "owns"
    
    transactions ||--o{ transaction_attachments : "has"
    transactions ||--o{ accounting_sync_records : "tracked by"

    transactions {
        uuid id PK
        uuid team_id FK
        date date
        numeric amount
        text name
        text description
        text status
        text category_slug
    }

    transaction_attachments {
        uuid id PK
        uuid transaction_id FK
        uuid team_id FK
        text name
        text_array path
        text type
        int size
    }

    apps {
        uuid id PK
        uuid team_id FK
        text app_id
        jsonb config
        jsonb settings
    }

    accounting_sync_records {
        uuid id PK
        uuid transaction_id FK
        uuid team_id FK
        text provider
        text provider_tenant_id
        text provider_transaction_id
        text_array synced_attachment_ids
        timestamp synced_at
        text sync_type
        text status
        text error_message
    }
```

---

## Sync Algorithm

### Phase 1: Transaction Selection

```mermaid
flowchart TD
    A[Start Sync Job] --> B[Get synced transaction IDs]
    B --> C[Query fulfilled transactions]
    C --> D{Has results?}
    D -->|No| E[Return empty result]
    D -->|Yes| F[Map to provider format]
    F --> G[Process in batches]

    subgraph Query["Fulfilled Query"]
        C1[team_id matches]
        C2[status NOT IN excluded, archived]
        C3[NOT already synced]
        C4[date within range]
        C5[has attachments OR status = completed]
        C1 --> C2 --> C3 --> C4 --> C5
    end
```

### Phase 2: Batch Processing

```mermaid
flowchart TD
    A[Batch of 50 transactions] --> B[Call provider.syncTransactions]
    B --> C{Success?}
    
    C -->|Yes| D[Record as synced]
    C -->|No| E[Record as failed]
    
    D --> F{Has attachments?}
    F -->|Yes| G[Trigger attachment job]
    F -->|No| H[Continue to next batch]
    
    E --> H
    G --> H
    
    H --> I{More batches?}
    I -->|Yes| A
    I -->|No| J[Check attachment updates]
```

### Phase 3: Attachment Detection

```mermaid
flowchart TD
    A[Query synced records] --> B[JOIN with current attachments]
    B --> C[Compare synced_attachment_ids vs current]
    
    C --> D{New attachments found?}
    D -->|No| E[Done]
    D -->|Yes| F[For each transaction with changes]
    
    F --> G[Trigger attachment sync job]
    G --> H{More transactions?}
    H -->|Yes| F
    H -->|No| E
```

---

## Token Lifecycle

### Refresh Flow

```mermaid
stateDiagram-v2
    [*] --> CheckExpiry: Job starts
    
    CheckExpiry --> Valid: Token not expired
    CheckExpiry --> Refresh: Token expired
    
    Refresh --> UpdateDB: Get new tokens
    UpdateDB --> Valid: Atomic update complete
    
    Valid --> [*]: Continue with API calls
    
    Refresh --> Error: Refresh failed
    Error --> [*]: Throw error, job retries
```

### Atomic Update

```mermaid
sequenceDiagram
    participant Job
    participant Provider
    participant Database

    Job->>Provider: refreshTokens(refreshToken)
    Provider-->>Job: New tokens
    
    Job->>Database: UPDATE apps SET config = config || new_tokens
    Note over Database: JSONB merge preserves other fields
    Database-->>Job: Success
    
    Job->>Job: Update local config reference
```

---

## Retry Mechanism

### BullMQ Configuration

```mermaid
flowchart LR
    subgraph Attempt1["Attempt 1"]
        A1[Execute]
    end
    
    subgraph Delay1["Delay"]
        D1[5 minutes]
    end
    
    subgraph Attempt2["Attempt 2"]
        A2[Execute]
    end
    
    subgraph Delay2["Delay"]
        D2[10 minutes]
    end
    
    subgraph Attempt3["Attempt 3"]
        A3[Execute]
    end
    
    subgraph Delay3["Delay"]
        D3[20 minutes]
    end
    
    subgraph Attempt4["Attempt 4"]
        A4[Execute]
    end
    
    subgraph Final["Final"]
        F[Permanent Failure]
    end

    A1 -->|fail| D1 --> A2
    A2 -->|fail| D2 --> A3
    A3 -->|fail| D3 --> A4
    A4 -->|fail| F
    
    A1 -->|success| S1[Done]
    A2 -->|success| S2[Done]
    A3 -->|success| S3[Done]
    A4 -->|success| S4[Done]
```

### Error Classification

```mermaid
flowchart TD
    E[Error Occurred] --> T{Error Type}
    
    T -->|Network Timeout| R1[Retry with backoff]
    T -->|Rate Limit 429| R2[Retry with backoff]
    T -->|Auth Error 401| R3[Refresh token, retry]
    T -->|Bad Request 400| F1[Mark failed, no retry]
    T -->|Not Found 404| F2[Mark failed, no retry]
    T -->|Server Error 5xx| R4[Retry with backoff]
    
    R1 --> Q[Back to queue]
    R2 --> Q
    R3 --> Q
    R4 --> Q
    
    F1 --> D[Record in database]
    F2 --> D
```

---

## Concurrency Model

### Queue Worker Settings

```typescript
const workerOptions: WorkerOptions = {
  concurrency: 10,              // Max 10 jobs in parallel
  lockDuration: 300000,         // 5 minute lock (API can be slow)
  stalledInterval: 5 * 60 * 1000,
  maxStalledCount: 1,
  limiter: {
    max: 20,                    // Max 20 jobs per second
    duration: 1000,
  },
};
```

### Job Isolation

```mermaid
flowchart TB
    subgraph Worker["Worker Process"]
        subgraph Job1["Job 1 (Team A)"]
            DB1[DB Connection]
            TOK1[Token State]
            PROC1[Processing]
        end
        
        subgraph Job2["Job 2 (Team B)"]
            DB2[DB Connection]
            TOK2[Token State]
            PROC2[Processing]
        end
        
        subgraph Job3["Job 3 (Team C)"]
            DB3[DB Connection]
            TOK3[Token State]
            PROC3[Processing]
        end
    end
    
    Redis[(Redis)] --> Worker
    Database[(PostgreSQL)] --> DB1
    Database --> DB2
    Database --> DB3
```

---

## Data Mapping

### Midday to Xero Transaction Mapping

```mermaid
flowchart LR
    subgraph Midday["Midday Transaction"]
        M1[id]
        M2[date]
        M3[amount]
        M4[currency]
        M5[name]
        M6[description]
        M7[categorySlug]
    end

    subgraph Xero["Xero BankTransaction"]
        X1[Reference]
        X2[Date]
        X3[LineItems.UnitAmount]
        X4[CurrencyCode]
        X5[Contact.Name]
        X6[LineItems.Description]
        X7[LineItems.AccountCode]
        X8[Type]
    end

    M1 -->|first 8 chars| X1
    M2 --> X2
    M3 -->|abs value| X3
    M3 -->|positive = RECEIVE| X8
    M3 -->|negative = SPEND| X8
    M4 --> X4
    M5 --> X5
    M5 --> X6
    M6 --> X6
    M7 -->|if mapped| X7
```

### Attachment Upload Flow

```mermaid
sequenceDiagram
    participant Processor
    participant Database
    participant Storage
    participant Provider

    Processor->>Database: Get attachment metadata
    Database-->>Processor: id, name, path, type, size
    
    Processor->>Storage: Download from vault
    Storage-->>Processor: File blob
    
    Processor->>Processor: Convert to Buffer
    
    Processor->>Provider: Upload attachment
    Note over Provider: POST /BankTransactions/{id}/Attachments
    Provider-->>Processor: Attachment ID
    
    Processor->>Database: Update synced_attachment_ids
```

---

## Performance Characteristics

### Query Complexity

| Query | Complexity | Index Used |
|-------|------------|------------|
| Get synced IDs | O(n) | idx_accounting_sync_team_provider |
| Get transactions for sync | O(n log n) | transactions PK + team_id |
| Detect attachment changes | O(n) | Single JOIN, grouped |
| Upsert sync record | O(1) | Unique constraint |

### Batch Sizes

| Operation | Batch Size | Rationale |
|-----------|------------|-----------|
| Transaction sync | 50 | Balance between API calls and memory |
| Attachment upload | 1 | Sequential for error isolation |
| Progress updates | Per batch | User feedback without overhead |

### Rate Limits

| Provider | Limit | Midday Handling |
|----------|-------|-----------------|
| Xero | 60 calls/minute | BullMQ limiter (20/sec max) |
| Xero | 5000 calls/day | Batch processing reduces calls |

---

## Security Model

### Data Access

```mermaid
flowchart TD
    subgraph RLS["Row Level Security"]
        P1[SELECT: team_id IN user_teams]
        P2[INSERT: team_id IN user_teams]
        P3[UPDATE: team_id IN user_teams]
    end

    subgraph Tables["Protected Tables"]
        T1[accounting_sync_records]
        T2[transactions]
        T3[apps]
    end

    subgraph Worker["Worker Access"]
        W[Service Role Key]
    end

    RLS --> T1
    RLS --> T2
    RLS --> T3
    
    W -->|Bypasses RLS| T1
    W -->|Bypasses RLS| T2
    W -->|Bypasses RLS| T3
```

### Secret Storage

| Secret Type | Storage | Access |
|-------------|---------|--------|
| OAuth Client ID/Secret | Environment vars | Worker process only |
| Access Token | apps.config (DB) | Encrypted at rest |
| Refresh Token | apps.config (DB) | Encrypted at rest |
| OAuth State | Encrypted string | HMAC with server secret |
