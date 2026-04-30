# Midday Computer

Midday Computer is an autonomous agent runtime that lets users create AI-powered workflows on top of their Midday data. Agents run inside secure V8 isolates with direct access to all 117+ MCP tools, AI reasoning, persistent memory, proactive notifications (in-app + email), human-in-the-loop approval mode for write operations, and external service integrations via Composio connectors.

## Architecture overview

```
CLI / Dashboard
      │
      ▼
  apps/api  ────────────  REST routes at /computer/*
      │                   Agent CRUD, catalog, NL generation,
      │                   run triggers, proposal review
      │
      │  enqueueRun() / enqueueReplay()
      │  (BullMQ via @midday/job-client)
      ▼
  REDIS_QUEUE_URL  ──────  Shared Redis (same as main worker)
      │                    Queue name: "compute"
      │                    Job types: execute-agent, replay-proposals
      ▼
  apps/compute  ─────────  Standalone Bun service
      │                    BullMQ worker + cron scheduler
      │
      ├── scheduler.ts     Polls DB every 60s for enabled agents
      │                    with cron schedules, registers croner jobs
      │
      ├── worker.ts        Processes BullMQ jobs: concurrency checks,
      │                    loads agent code, delegates to runtime
      │                    Dispatches execute-agent or replay-proposals
      │
      └── runtime.ts       Creates V8 isolate (Secure Exec),
                           wires bindings, executes agent code
                              │
                              ├── In-process MCP (callTool + parseMcp)
                              ├── OpenAI via AI SDK (generateText)
                              ├── Postgres via queries (readMemory/writeMemory)
                              ├── @midday/notifications (notify)
                              ├── Composio connectors (callConnector)
                              └── Approval mode (propose)
```

## Packages and services

| Component | Location | Role |
|-----------|----------|------|
| Compute service | `apps/compute/` | BullMQ worker + cron scheduler + health endpoint |
| API routes | `apps/api/src/rest/routers/computer.ts` | Agent CRUD, catalog, NL generation, run triggers |
| Catalog agents | `apps/api/src/rest/routers/computer/catalog.ts` | Pre-built agent templates |
| NL orchestrator | `apps/api/src/rest/routers/computer/orchestrator.ts` | GPT-4.1 agent code generator with type-check + repair loop |
| Type stubs | `apps/api/src/rest/routers/computer/stubs.ts` | Auto-generates TypeScript declarations from `listTools()` |
| Job client | `packages/job-client/src/compute.ts` | `enqueueRun()` and `enqueueReplay()` for the compute queue |
| Notifications | `packages/notifications/src/types/computer-agent-alert.ts` | `agent_alert` notification type (in-app + email) |
| DB queries | `packages/db/src/queries/computer.ts` | All `computer_*` table operations |
| DB schema | `packages/db/src/schema.ts` (bottom) | Tables, enums, relations, RLS policies |
| CLI commands | `packages/cli/src/commands/computer/index.ts` | `midday computer` subcommands |
| Migration | `packages/db/migrations/0039_add_computer_tables.sql` | DDL for all compute tables, enums, indexes, and RLS policies |

## Database tables

### `computer_agents`

One row per agent per team. Holds the agent's executable code.

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | PK |
| `team_id` | uuid | FK to `teams` |
| `name` | varchar(255) | Display name |
| `slug` | varchar(255) | URL-safe, unique per team |
| `description` | text | |
| `source` | enum(`catalog`, `generated`) | How it was created |
| `code` | text | Compiled JavaScript (from TypeScript source) executed in Secure Exec |
| `template_id` | varchar(255) | Catalog template ID (if source=catalog) |
| `schedule_cron` | varchar(255) | Cron expression for scheduled runs |
| `config` | jsonb | User-configurable settings |
| `enabled` | boolean | Whether the scheduler picks it up |
| `created_by` | uuid | FK to `users` |

### `computer_runs`

One row per execution of an agent.

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | PK |
| `agent_id` | uuid | FK to `computer_agents` |
| `team_id` | uuid | FK to `teams` |
| `status` | enum(`pending`, `running`, `completed`, `failed`, `waiting_approval`) | Lifecycle state |
| `proposed_actions` | jsonb | Array of `{ tool, args, description? }` when status is `waiting_approval` |
| `summary` | text | Agent-generated summary or notification |
| `error` | text | Error message if failed |
| `tool_call_count` | integer | Total MCP tool calls made |
| `llm_call_count` | integer | Total AI generation calls made |
| `started_at` / `completed_at` | timestamptz | Timing |

### `computer_run_steps`

Every operation performed during a run, for full observability.

| Column | Type | Notes |
|--------|------|-------|
| `type` | enum(`tool_call`, `ai_generation`, `memory_read`, `memory_write`, `notification`, `proposal`, `connector_call`, `context`) | |
| `name` | varchar(255) | Tool name or operation |
| `input` | jsonb | Arguments passed |
| `output` | jsonb | Result returned |
| `duration_ms` | integer | Wall-clock time |

### `computer_agent_memory`

Persistent key-value memory scoped to agent + team. Survives across runs.

| Column | Type | Notes |
|--------|------|-------|
| `agent_id` + `key` | unique constraint | One value per key per agent |
| `content` | text | Serialized data (typically JSON) |
| `type` | varchar(100) | Optional category (e.g. `learned`, `snapshot`) |
| `metadata` | jsonb | Arbitrary metadata |

## Execution flow

### 1. Agent creation

Three paths to create an agent:

**Catalog** — `POST /computer/agents` with `{ templateId }`. Copies template code, name, schedule from `CATALOG_AGENTS`.

**Natural language** — `POST /computer/generate` with `{ description }`. The orchestrator:
1. Creates an in-process MCP client and calls `listTools()` to get all tool definitions with their `inputSchema` and `outputSchema`
2. Auto-generates TypeScript declaration stubs (via `json-schema-to-typescript`) with typed `callTool` overloads for every tool
3. Sends the stubs + prompt to GPT-4.1, which generates TypeScript agent code
4. Type-checks the generated code against the stubs using `@secure-exec/typescript` (`typecheckSource`)
5. If type errors exist, feeds them back to the LLM for repair (up to 2 attempts)
6. Compiles the TypeScript to JavaScript via `compileSource`
7. Returns the compiled JS as `code` along with the agent definition (name, slug, schedule, plan, tools used)

User reviews, then `POST /computer/agents/confirm` to deploy.

**CLI shortcut** — `midday computer create "description"` combines generate + interactive confirm in one command.

### 2. Triggering a run

**Manual** — `POST /computer/agents/:id/run`. Creates a `computer_runs` row with status `pending`, then calls `enqueueRun()` which adds a BullMQ job to the `compute` queue.

**Scheduled** — The scheduler in `apps/compute/src/scheduler.ts` polls the DB every 60 seconds for enabled agents with cron expressions. Registers `croner` jobs that fire at the right time. On fire: creates a run row, enqueues it.

### 3. Job processing

`apps/compute/src/worker.ts` picks up the BullMQ job:

1. **Load agent** — Fetches the `computer_agents` row to get the code.

2. **Atomic claim** — `claimComputerRun` atomically transitions the run from `pending` to `running` only if no other run for the same agent is already `running`. Uses a single SQL `UPDATE ... WHERE NOT EXISTS` to avoid race conditions. If the claim fails, marks the run as `failed` with `skipped_concurrent`.

3. **Load context** — Fetches the creator's timezone from the `users` table.

4. **Execute** — Delegates to `runtime.ts` (see below).

5. **Record steps** — Bulk-inserts all step records into `computer_run_steps`.

6. **Mark complete** — Updates run status, summary, error, tool/LLM counts, and `completed_at`.

7. **Safety guards** — The entire `processJob` is wrapped in a top-level `try/catch` that guarantees a terminal status (`failed`) even on unexpected errors. Result serialization uses a `safeStringify` utility to guard against circular references. The compute entry point (`index.ts`) has a `shuttingDown` flag to handle duplicate SIGTERM/SIGINT signals gracefully.

### 4. Runtime (Secure Exec)

`apps/compute/src/runtime.ts` creates an isolated V8 environment:

1. **In-process MCP** — Creates an MCP server with the team's context (same as the API's MCP server), connects a client via `InMemoryTransport`. No HTTP, no auth overhead. The agent code calls tools through this bridge. The MCP context receives the agent creator's timezone (from the `users` table), so tools that interpret relative dates ("today", "this week") resolve correctly in the user's local time.

2. **Bindings** — Ten functions are injected into the sandbox:

   - `callTool(name, args)` — Proxies to the in-process MCP client. Returns `{ structuredContent?, content?, isError? }`. Counts toward the 50-call limit.
   - `parseMcp(result)` — Reliably extracts data from a `callTool` result: returns `structuredContent` if present, falls back to `JSON.parse(content[0].text)`, throws on `isError`. All catalog agents use this.
   - `generateText(prompt, opts?)` — Calls OpenAI via the AI SDK (default: `gpt-4.1-mini`). Counts toward the 10-call limit.
   - `readMemory(opts?)` — Reads from `computer_agent_memory` filtered by agent + team + optional key/type.
   - `writeMemory(key, content, type?, metadata?)` — Upserts into `computer_agent_memory`.
   - `notify(message, priority?)` — Writes the message to the run's `summary` field and sends a notification via `@midday/notifications` (in-app activity always, email when priority is `"urgent"`).
   - `getTrigger()` — Returns the trigger context (schedule, payload, etc.).
   - `callConnector(toolName, args)` — Calls an external service via Composio (Gmail, Slack, Google Sheets, Linear, etc.). Counts toward the 50-call limit. Requires the user to have connected the service.
   - `propose(actions)` — Submits an array of `{ tool, args, description? }` for human approval. Halts execution with `waiting_approval` status. Automatically sends an `agent_alert` notification so the user knows proposals are waiting. Approved actions are replayed via a separate BullMQ job.

   The `propose` binding is for human-in-the-loop workflows. When called, the agent run transitions to `waiting_approval` and stops. A notification is sent automatically (e.g. "Invoice Chaser has 5 proposed action(s) waiting for your approval."). The user reviews proposals via CLI (`midday computer proposals`) or API, then approves or rejects. Approved actions are executed via `executeProposedActions` in a replay job.

3. **Sandbox constraints**:
   - No filesystem access
   - No network access
   - 64 MB memory limit
   - 30 second CPU time limit
   - 50 max tool calls per run
   - 10 max LLM calls per run

4. **Step tracing** — Every binding call is wrapped in a step logger that records type, name, input, output, and duration. These become `computer_run_steps` rows.

## Agent code pattern

Agent code is authored as TypeScript, type-checked against auto-generated stubs, compiled to JavaScript, and executed inside the Secure Exec isolate. Bindings are available at `SecureExec.bindings`:

```typescript
const { callTool, parseMcp, generateText, readMemory, writeMemory, notify, callConnector, propose } = SecureExec.bindings;

// Fetch data via MCP tools — callTool returns { structuredContent?, content?, isError? }
const result = await callTool("transactions_list", {
  categories: ["uncategorized"],
  start: "2025-01-01",
  end: "2025-01-31",
  pageSize: 50,
});

// parseMcp extracts structuredContent (typed) or falls back to JSON text parsing
const data = parseMcp(result);
const transactions = data?.data ?? [];

// Use AI for reasoning
const analysis = await generateText(
  "Analyze these transactions: " + JSON.stringify(transactions),
  { system: "You are a financial analyst." }
);

// Persist state across runs
await writeMemory("last_analysis", analysis, "snapshot");

// Notify the team (in-app + email for urgent)
await notify("Found " + transactions.length + " items to review.", "normal");

// Send to Slack via Composio connector
await callConnector("SLACK_SEND_MESSAGE", {
  channel: "#finance",
  text: analysis,
});

// Return a result
module.exports = { summary: analysis, count: transactions.length };
```

### Approval mode example

```typescript
const { callTool, parseMcp, propose } = SecureExec.bindings;

// Find overdue invoices
const result = await callTool("invoices_list", { statuses: ["overdue"] });
const parsed = parseMcp(result)?.data ?? [];

if (parsed.length === 0) {
  module.exports = { summary: "No overdue invoices" };
  return;
}

// Propose sending reminders (human reviews before execution)
const actions = parsed.map((inv: any) => ({
  tool: "invoices_remind",
  args: { id: inv.id },
  description: `Send reminder for invoice ${inv.invoiceNumber} (${inv.customer?.name})`,
}));

await propose(actions);
// Execution stops here -- user reviews via CLI or API
```

### MCP tool response format

MCP tools return `{ structuredContent?, content?, isError? }`. When `outputSchema` is defined (most tools), the typed data is in `structuredContent`. Always use `parseMcp(result)` to extract data reliably — it handles both `structuredContent` and legacy text-only responses.

### outputSchema and structuredContent

Most MCP tool registrations include an `outputSchema` (Zod schema) that declares the shape of the tool's response. The MCP SDK converts this to JSON Schema and advertises it via `listTools()`. When a tool handler returns a `structuredContent` object matching this schema, the client receives typed, parseable data instead of serialized JSON text.

**Adding `outputSchema` to a tool:**

```typescript
// In apps/api/src/mcp/tools/transactions.ts
server.tool(
  "transactions_list",
  "List transactions...",
  { /* inputSchema (Zod) */ },
  { outputSchema: { meta: mcpListMetaSchema, data: z.array(mcpTransactionSchema) } },
  async (params, extra) => {
    const result = await listTransactions(params);
    return {
      structuredContent: { meta: result.meta, data: result.data },
      content: [{ type: "text" as const, text: JSON.stringify(result) }],
    };
  }
);
```

Entity schemas live in `apps/api/src/mcp/schemas.ts` (e.g., `mcpTransactionSchema`, `mcpInvoiceSchema`, `mcpAccountSchema`). The `mcpListMetaSchema` provides a standard shape for paginated list metadata (`cursor`, `hasNextPage`, `hasPreviousPage`).

### Type stub generation

`apps/api/src/rest/routers/computer/stubs.ts` auto-generates TypeScript declarations from live MCP tool definitions:

1. An in-process MCP client calls `listTools()` to get all tool definitions
2. For each tool, `inputSchema` and `outputSchema` (JSON Schema) are converted to TypeScript interfaces via `json-schema-to-typescript`
3. Typed `callTool` overloads are generated per tool (e.g., `callTool("transactions_list", TransactionsListInput): Promise<{ structuredContent?: TransactionsListOutput; ... }>`)
4. A fallback overload handles unknown tool names
5. Binding declarations for `parseMcp`, `generateText`, `readMemory`, `writeMemory`, `notify`, `getTrigger`, `callConnector`, and `propose` are appended

These stubs are included in the LLM system prompt during NL generation so the model produces type-safe code. The same stubs are used by `@secure-exec/typescript` to type-check the generated code before compilation.

## API routes

All routes are under `/computer` and require authentication (behind `protectedMiddleware`).

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/catalog` | List available catalog agents (code excluded) |
| `GET` | `/agents` | List team's enabled agents |
| `POST` | `/agents` | Enable a catalog agent (`{ templateId }`) |
| `POST` | `/generate` | Generate agent from NL description (`{ description }`) |
| `POST` | `/agents/confirm` | Deploy a generated agent (`{ name, slug, code, ... }`) |
| `PUT` | `/agents/:id` | Update agent settings (enabled, schedule, config) |
| `DELETE` | `/agents/:id` | Remove an agent and all its data |
| `POST` | `/agents/:id/run` | Trigger a manual run |
| `GET` | `/agents/:id/runs` | List run history (default 20) |
| `GET` | `/agents/:id/runs/:runId` | Get run details with step trace |
| `GET` | `/agents/:id/runs/:runId/proposals` | Get proposed actions for a `waiting_approval` run |
| `POST` | `/agents/:id/runs/:runId/approve` | Approve proposals (`{ actions?: number[] }` for selective) |
| `POST` | `/agents/:id/runs/:runId/reject` | Reject proposals (marks run as failed) |
| `GET` | `/agents/:id/memory` | View agent's persistent memory |

## CLI commands

```
midday computer                                    List your agents
midday computer catalog                            Show available pre-built agents
midday computer enable <templateId>                Enable a catalog agent
midday computer create "<description>"             Create agent from natural language
midday computer run <agentId>                      Manually trigger a run
midday computer run <agentId> --wait               Trigger and wait for completion (polls every 2s)
midday computer logs <agentId>                     View run history
midday computer memory <agentId>                   Inspect persistent memory
midday computer proposals <agentId> <runId>        View proposed actions awaiting approval
midday computer approve <agentId> <runId>          Approve all proposals (or --pick 0,2)
midday computer reject <agentId> <runId>           Reject proposals
midday computer disable <agentId>                  Disable an agent
midday computer remove <agentId>                   Delete an agent
```

## Infrastructure

### Deployment

- Runs as a standalone Docker service on Railway (`apps/compute/Dockerfile`)
- Port 8081 with `/health` endpoint
- Uses the shared `REDIS_QUEUE_URL` (same Redis as the main worker)
- Uses `@midday/db/worker-client` (connection pool tuned for concurrent background jobs)
- Sentry error reporting via `apps/compute/src/instrument.ts`
- CI/CD wired in both `staging.yml` and `production.yml` (detect-changes + deploy)

### Environment variables

See `apps/compute/.env-template`:

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_PRIMARY_POOLER_URL` | Yes (or `DATABASE_PRIMARY_URL`) | Postgres connection for worker-client |
| `REDIS_QUEUE_URL` | Yes | Shared BullMQ Redis |
| `OPENAI_API_KEY` | Yes | For agent LLM calls |
| `COMPOSIO_API_KEY` | No | For Composio external integrations (Gmail, Slack, etc.) |
| `SENTRY_DSN` | Production only | Error reporting |
| `PORT` | No (default: 8081) | HTTP port |

### Graceful shutdown

On `SIGTERM`/`SIGINT`:
1. Stop all cron schedulers
2. Close BullMQ worker (waits for active jobs)
3. Wait 5 seconds for drain
4. Close database pool
5. Flush Sentry events
6. Exit (30s hard timeout)

## Catalog agents

### Month-End Close

**Template ID:** `month-end-close`
**Schedule:** `0 8 28-31 * *` (8 AM on the 28th-31st of each month)

Runs a close-the-books checklist:
1. Finds uncategorized transactions for the current month
2. Checks for pending (unmatched) inbox items
3. Finds draft invoices that haven't been sent
4. Pulls the current month's P&L and spending breakdown
5. Loads previous month's summary from memory for comparison
6. Uses AI to produce a numbered checklist of open items, flag spending anomalies (>25% change), and give an overall health assessment
7. Saves this month's snapshot to memory
8. Notifies the team with the full analysis

### Invoice Chaser

**Template ID:** `invoice-chaser`
**Schedule:** `0 9 * * 2` (Tuesdays 9 AM)

Intelligent collections assistant using approval mode:
1. Fetches all overdue and unpaid invoices
2. Pulls customer details for context (payment history, contact info)
3. Loads escalation history from memory (how many times each invoice was flagged)
4. Uses AI to prioritize by urgency: oldest debt first, largest amounts, repeat late payers
5. Proposes sending reminders via `propose()` — user reviews and approves before any emails go out
6. Saves escalation counts to memory for next run
7. Notifies team with prioritized collections summary

**Showcases:** Approval mode (`propose` + `invoices_remind`), persistent memory for escalation tracking.

### Weekly Financial Briefing

**Template ID:** `weekly-financial-briefing`
**Schedule:** `0 8 * * 1` (Mondays 8 AM)

Executive summary combining data from across all of Midday:
1. Gets team currency and bank account balances for cash position
2. Pulls profit, revenue, spending, and cash flow reports for the past week
3. Fetches invoice summary for outstanding amounts
4. Loads previous week's snapshot and rolling 12-week trend history from memory
5. Uses AI to produce a structured briefing: cash position, revenue vs profit with % change, top spending categories, invoice status, multi-week trend patterns, and 2-3 specific action items
6. Saves weekly snapshot and updates trend history in memory
7. Notifies team with the full briefing

**Showcases:** Cross-domain intelligence (7 different tool calls combined), rolling trend memory across months.

### Expense Anomaly Detector

**Template ID:** `expense-anomaly-detector`
**Schedule:** `0 10 * * *` (daily 10 AM)

Silent-unless-important daily expense monitor:
1. Fetches expenses from the last 24 hours
2. Pulls 90-day spending baseline by category
3. Loads previously flagged transaction IDs from memory (avoids repeat alerts)
4. Uses AI to compare new expenses against baselines — flags: transactions >3x category daily average, new/unknown spending categories, potential duplicate charges, any single transaction over 2000
5. Updates flagged IDs and baseline snapshots in memory
6. Only notifies if anomalies are found (urgent priority for amounts over 5000). Stays completely silent on normal days.

**Showcases:** Silent-unless-important pattern (no noise), baseline learning via memory, conservative anomaly detection.

## Adding a new catalog agent

1. Add an entry to `CATALOG_AGENTS` in `apps/api/src/rest/routers/computer/catalog.ts`:

```typescript
{
  templateId: "your-agent-id",
  name: "Your Agent",
  slug: "your-agent",
  description: "What it does in one sentence.",
  scheduleCron: "0 9 * * 1",  // cron expression
  code: `const { callTool, generateText, readMemory, writeMemory, notify, callConnector, propose } = SecureExec.bindings;
// ... agent code ...
module.exports = { summary: "done" };`,
}
```

2. The agent becomes immediately available in the catalog (`GET /computer/catalog`) and can be enabled via `POST /computer/agents` with `{ templateId: "your-agent-id" }` or `midday computer enable your-agent-id`.

## Adding a new binding

To expose a new function to agent code:

1. Add the binding function to the `bindings` object in `apps/compute/src/runtime.ts`
2. Add a step type to the `computerRunStepTypeEnum` in `packages/db/src/schema.ts` if it's a new category
3. Update the migration if the enum changes
4. Document the binding in the orchestrator's `SYSTEM_PROMPT` in `apps/api/src/rest/routers/computer/orchestrator.ts` so the NL generator knows about it

## Limits and safety

| Limit | Value | Enforced in |
|-------|-------|-------------|
| Tool calls per run | 50 | `runtime.ts` (throws on exceed) |
| LLM calls per run | 10 | `runtime.ts` (throws on exceed) |
| Memory per isolate | 64 MB | Secure Exec `NodeExecutionDriver` |
| CPU time per run | 30 seconds | Secure Exec `NodeExecutionDriver` |
| Concurrency per agent | 1 active run | `claimComputerRun` atomic SQL in `queries/computer.ts` |
| Filesystem access | Denied | Secure Exec permissions |
| Network access | Denied | Secure Exec permissions |

## Approval mode flow

The approval mode enables human-in-the-loop workflows for write operations:

1. **Agent runs and calls `propose(actions)`** — The binding stores the proposed actions in `computer_runs.proposed_actions`, transitions the run to `waiting_approval` status, sends an `agent_alert` notification (so the user knows proposals are waiting), and throws `ProposalSubmittedError` to halt the isolate cleanly.

2. **User reviews** — Via CLI (`midday computer proposals <agentId> <runId>`) or API (`GET /agents/:id/runs/:runId/proposals`).

3. **User approves or rejects**:
   - **Approve all**: `midday computer approve <agentId> <runId>` or `POST /approve`
   - **Selective approve**: `midday computer approve <agentId> <runId> --pick 0,2` or `POST /approve { actions: [0, 2] }`
   - **Reject**: `midday computer reject <agentId> <runId>` or `POST /reject`

4. **Replay** — On approval, `approveComputerRun` filters the actions, transitions the run back to `pending`, and `enqueueReplay` adds a `replay-proposals` job to the BullMQ queue.

5. **Execution** — The compute worker dispatches the replay job to `processReplay`, which calls `executeProposedActions`. This creates an in-process MCP client and calls each approved tool in sequence, recording steps.

## Composio connectors

Agents can call external services via the `callConnector` binding. This uses [Composio](https://composio.dev/) to provide tool-based access to 100+ services (Gmail, Slack, Google Sheets, Linear, etc.).

- **Auth model**: Composio manages per-user OAuth connections. The user connects services through the Midday dashboard, and agents inherit access.
- **Tool naming**: Composio tools follow the `SERVICE_ACTION_NAME` convention (e.g., `SLACK_SEND_MESSAGE`, `GMAIL_SEND_EMAIL`).
- **Rate limits**: `callConnector` calls count toward the same 50-call-per-run limit as `callTool`.
- **Dependency**: Requires `COMPOSIO_API_KEY` environment variable. Returns an error if the user hasn't connected the requested service.

## Notification delivery

The `notify` binding sends notifications via `@midday/notifications`:

- **In-app**: Every notification creates an activity entry visible in the Midday notification center.
- **Email**: Sent automatically when priority is `"urgent"`. Uses the `plain` email template.

The notification type is `agent_alert` and appears in user notification settings under the "computer" category.

Bot platform delivery (Slack, WhatsApp, Telegram, iMessage) requires wiring `agent_alert` into the `@midday/bot` `sendToProviders` pipeline with platform-specific formatters — planned for v1.1.

## Future (v1.1)

- Agent notifications to Slack, Telegram, WhatsApp, iMessage via `@midday/bot` pipeline
- Event-based triggers (on new transaction, on overdue invoice, etc.)
- Custom `.ts` agent deployment (user-submitted code)
- Unified daily briefing across all agents
- Dashboard UI for agent management and proposal review
- Streaming visibility for long-running agents
- Additional catalog agents (Cash Flow Watchdog, Revenue Forecaster)
- Cross-agent communication (agent-to-agent triggers)
