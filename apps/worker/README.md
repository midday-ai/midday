# BullMQ Worker

A background job processing system for the Midday using BullMQ and Redis.

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   API/Client    │────│   Redis Queue   │────│   Worker App    │
│   (Job Creator) │    │   (Job Storage) │    │ (Job Processor) │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                       │
                                                       ▼
                                               ┌─────────────────┐
                                               │   PostgreSQL    │
                                               │   (Database)    │
                                               └─────────────────┘
```

## Environment Variables

Create a `.env` file in the worker directory:

```bash
# Redis Configuration (required for BullMQ)
REDIS_URL=redis://localhost:6379

# Database Configuration
DATABASE_PRIMARY_URL=postgresql://user:password@localhost:5432/midday

ENVIRONMENT=development
```

## Development

### Starting the Worker

```bash
# From the root of the monorepo
bun dev:worker

# Or from the worker directory
bun dev
```
