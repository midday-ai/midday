# Queue Board

A monochrome dark-themed admin interface for BullMQ queues, built with Next.js.

## Features

- Queue overview with real-time metrics
- Job listing and details
- Retry failed jobs
- Pause/resume queues
- Clean queues
- Monochrome dark theme with Geist Mono font

## Usage

### Local Development

1. Set the `REDIS_QUEUE_URL` environment variable:

```bash
export REDIS_QUEUE_URL="redis://localhost:6379"
```

2. Run the board:

```bash
cd apps/board
bun run dev
```

The board will be available at `http://localhost:3002`

### Production Deployment (Fly.io)

The board is deployed as a separate Fly.io app in the same region as the worker.

#### Prerequisites

- Fly.io CLI installed and authenticated
- Access to the `midday-board` Fly.io app

#### Deploy

```bash
cd apps/board
flyctl deploy
```

#### Environment Variables

Set the following secrets in Fly.io:

```bash
flyctl secrets set BOARD_USERNAME=your-username
flyctl secrets set BOARD_PASSWORD=your-secure-password
flyctl secrets set REDIS_QUEUE_URL=your-redis-url
```

The board will be available at `https://midday-board.fly.dev` (or your custom domain).

#### Authentication

The board uses HTTP Basic Authentication. When accessing the board, you'll be prompted for:
- Username: Set via `BOARD_USERNAME` environment variable
- Password: Set via `BOARD_PASSWORD` environment variable

The `/health` endpoint is publicly accessible and does not require authentication.

### Programmatic Initialization

```typescript
import { startAdmin } from '@midday/board';

await startAdmin({
  redis: { host: 'localhost', port: 6379 },
  queues: ['transactions', 'inbox', 'inbox-provider'],
  port: 3002,
});
```

## Configuration

The admin automatically discovers queues from Redis. By default, it looks for:
- `transactions`
- `inbox`
- `inbox-provider`

You can customize this by passing queue names to `startAdmin()`.

## Environment Variables

- `REDIS_QUEUE_URL` - Redis connection URL (required)
- `BOARD_USERNAME` - Basic auth username (optional, required for production)
- `BOARD_PASSWORD` - Basic auth password (optional, required for production)
- `PORT` - Port to run on (default: 3002)

