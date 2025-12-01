# Base image with Bun
FROM oven/bun:1.2.22 AS base

# Install turbo CLI globally using Bun
FROM base AS turbo-cli
RUN bun add -g turbo

# Builder stage
FROM turbo-cli AS builder
WORKDIR /app
# Copy all files
COPY . .
# Use turbo CLI from Bun global install to prune workspaces
RUN turbo prune @midday/board --docker

# Installer stage
FROM base AS installer
WORKDIR /app

# Install build dependencies for native modules if needed
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# First install the dependencies (as they change less often)
COPY --from=builder /app/out/json/ .
# Don't copy the lockfile, allow Bun to generate a fresh one
RUN bun install

# Copy the full source code
COPY --from=builder /app/out/full/ .

# Runner stage (same as installer to avoid another copy)
FROM installer AS runner

# Set the board directory as working directory
WORKDIR /app/apps/board

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3002

# Required environment variables (must be provided at runtime):
# - REDIS_QUEUE_URL: Redis connection URL for BullMQ queues
#   Example: redis://localhost:6379 or rediss://:password@host:6379
#
# Optional environment variables:
# - BOARD_USERNAME: Basic auth username (recommended for production)
# - BOARD_PASSWORD: Basic auth password (recommended for production)
#
# These can be set via:
#   docker run -e REDIS_QUEUE_URL=redis://... -e BOARD_USERNAME=... -e BOARD_PASSWORD=...
#   Or via docker-compose.yml or orchestration platform secrets

# Build the Next.js app
RUN bun run build

# Expose the port the board runs on
EXPOSE 3002

# Run the board with Bun
CMD ["bun", "run", "start"]

