# Base image with Bun
FROM oven/bun:1.2.22 AS base

# Install turbo CLI globally using Bun
FROM base AS turbo-cli
RUN bun add -g turbo

# Builder stage - prune both worker and board workspaces
FROM turbo-cli AS builder
WORKDIR /app
# Copy all files
COPY . .
# Prune both workspaces separately
RUN turbo prune @midday/worker --docker --out-dir=out/worker
RUN turbo prune @midday/board --docker --out-dir=out/board

# Installer stage
FROM base AS installer
WORKDIR /app

# Install build dependencies for native modules if needed
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy package.json files from worker pruned workspace first
COPY --from=builder /app/out/worker/json/ .
# Copy package.json files from board pruned workspace (will merge/overwrite as needed)
COPY --from=builder /app/out/board/json/ .

# Copy full source from worker pruned workspace
COPY --from=builder /app/out/worker/full/ .
# Copy full source from board pruned workspace (will merge/overwrite as needed)
COPY --from=builder /app/out/board/full/ .

# Remove any lockfile that might have been copied
RUN rm -f bun.lock
# Generate a fresh lockfile
RUN bun install

# Build the board Next.js app
WORKDIR /app/apps/board
RUN bun run build

# Runner stage
FROM installer AS runner

# Set working directory to app root
WORKDIR /app

# Set environment variables
ENV NODE_ENV=production

# Copy and make entrypoint script executable
COPY apps/worker/entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

# Expose both ports
EXPOSE 8080 3002

# Use entrypoint script - process group will pass 'worker' or 'board' as argument
CMD ["/app/entrypoint.sh"]