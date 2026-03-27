# @midday-ai/cli

Run your business from the command line. The Midday CLI gives you full access to transactions, invoices, time tracking, reports, and more — designed for humans and AI agents alike.

## Install

```bash
npx @midday-ai/cli@latest
```

Or install globally:

```bash
npm install -g @midday-ai/cli
```

## Authentication

```bash
midday auth login          # Opens browser for OAuth
midday auth login --no-browser  # Prints URL to open manually
midday auth status         # Check current session
midday auth logout         # Clear stored credentials
```

You can also authenticate with an API key:

```bash
echo $MIDDAY_API_KEY | midday auth login --token-stdin
```

## Commands

### Transactions

| Command | Description |
|---------|-------------|
| `midday transactions list` | List transactions |
| `midday transactions get <id>` | Get transaction details |
| `midday transactions create` | Create a manual transaction |
| `midday transactions update <id>` | Update a transaction |
| `midday transactions delete <id>` | Delete a transaction |

```bash
midday transactions list --from 2026-01-01 --to 2026-03-31
midday transactions list --search "Spotify" --category software
midday transactions create --name "Office Supplies" --amount -49.99 --currency USD --account acc_123
```

### Invoices

| Command | Description |
|---------|-------------|
| `midday invoices list` | List invoices |
| `midday invoices get <id>` | Get invoice details |
| `midday invoices create` | Create an invoice |
| `midday invoices send <id>` | Send to customer |
| `midday invoices update <id>` | Update an invoice |
| `midday invoices delete <id>` | Delete an invoice |
| `midday invoices mark-paid <id>` | Mark as paid |
| `midday invoices remind <id>` | Send payment reminder |

```bash
midday invoices list --status unpaid
midday invoices create --customer cust_123 --due-date 2026-04-30
midday invoices send inv_abc123
```

### Customers

| Command | Description |
|---------|-------------|
| `midday customers list` | List customers |
| `midday customers get <id>` | Get customer details |
| `midday customers create` | Create a customer |
| `midday customers update <id>` | Update a customer |
| `midday customers delete <id>` | Delete a customer |

```bash
midday customers list --search "Acme"
midday customers create --name "Acme Corp" --email billing@acme.com
```

### Time Tracking

| Command | Description |
|---------|-------------|
| `midday tracker start` | Start the timer |
| `midday tracker stop` | Stop the timer |
| `midday tracker status` | Show current timer |
| `midday tracker projects list` | List projects |
| `midday tracker projects create` | Create a project |

```bash
midday tracker start --project proj_abc --description "API development"
midday tracker stop
midday tracker projects create --name "Website Redesign" --rate 150
```

### Bank Accounts

| Command | Description |
|---------|-------------|
| `midday bank-accounts list` | List connected accounts |
| `midday bank-accounts balances` | Show all balances |
| `midday bank-accounts get <id>` | Get account details |

### Inbox

| Command | Description |
|---------|-------------|
| `midday inbox list` | List inbox items |
| `midday inbox get <id>` | Get item details |
| `midday inbox match <id>` | Match to transaction |
| `midday inbox delete <id>` | Delete an item |

```bash
midday inbox list --status pending
midday inbox match inb_abc --transaction txn_def
```

### Reports

| Command | Description |
|---------|-------------|
| `midday reports revenue` | Revenue report |
| `midday reports profit` | Profit report |
| `midday reports burn-rate` | Monthly burn rate |
| `midday reports runway` | Cash runway estimate |
| `midday reports expenses` | Expense breakdown |
| `midday reports spending` | Spending by category |

```bash
midday reports revenue --from 2026-01-01 --to 2026-03-31
midday reports runway --currency USD
midday reports spending --json
```

### Documents

| Command | Description |
|---------|-------------|
| `midday documents list` | List documents |
| `midday documents get <id>` | Get document details |
| `midday documents delete <id>` | Delete a document |

### Categories

| Command | Description |
|---------|-------------|
| `midday categories list` | List categories |
| `midday categories create` | Create a category |
| `midday categories update <id>` | Update a category |
| `midday categories delete <id>` | Delete a category |

### Tags

| Command | Description |
|---------|-------------|
| `midday tags list` | List tags |
| `midday tags create` | Create a tag |
| `midday tags delete <id>` | Delete a tag |

### Products

| Command | Description |
|---------|-------------|
| `midday products list` | List invoice products |
| `midday products get <id>` | Get product details |
| `midday products create` | Create a product |
| `midday products update <id>` | Update a product |
| `midday products delete <id>` | Delete a product |

### Team

| Command | Description |
|---------|-------------|
| `midday team info` | Show team information |
| `midday team members` | List team members |

### Search

```bash
midday search "Acme"
midday search "office supplies" --json
```

## Global Flags

| Flag | Description |
|------|-------------|
| `--json` | Output as JSON (default when piped) |
| `--table` | Output as table (default in terminal) |
| `--agent` | Agent mode: JSON, no prompts, no spinners |
| `--quiet` | Suppress progress output |
| `--dry-run` | Preview destructive actions |
| `--debug` | Verbose HTTP logging to stderr |
| `--api-url <url>` | Override API base URL |

## Agent & MCP Integration

The CLI is designed to work seamlessly with AI agents. Use `--agent` or `--json` for structured output:

```bash
midday --agent transactions list --from 2026-01-01
midday invoices list --json | jq '.data[].invoiceNumber'
```

Pipe data in with `--stdin`:

```bash
cat invoice.json | midday invoices create --stdin
echo $API_KEY | midday auth login --token-stdin
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `MIDDAY_API_KEY` | API key (skip `auth login`) |
| `MIDDAY_API_URL` | Override API endpoint |
| `MIDDAY_DASHBOARD_URL` | Override dashboard URL for OAuth |
| `NO_COLOR` | Disable colored output |

## Development

```bash
bun run dev -- auth login       # Run locally
bun run build                   # Build for distribution
bun run typecheck               # Type checking
bun run lint                    # Lint
```

## License

See the [LICENSE](../../LICENSE) file in the repository root.
