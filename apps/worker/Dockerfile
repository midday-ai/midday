# Base image with Bun
FROM oven/bun:1.2.22 AS base

# Install turbo CLI globally using Bun
FROM base AS turbo-cli
RUN bun add -g turbo

# Builder stage - prune worker workspace
FROM turbo-cli AS builder
WORKDIR /app
# Copy all files
COPY . .
# Prune worker workspace
RUN turbo prune @midday/worker --docker --out-dir=out/worker

# Installer stage
FROM base AS installer
WORKDIR /app

# Install build dependencies for native modules if needed
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy package.json files from worker pruned workspace
COPY --from=builder /app/out/worker/json/ .

# Copy full source from worker pruned workspace
COPY --from=builder /app/out/worker/full/ .

# Remove any lockfile that might have been copied
RUN rm -f bun.lock
# Generate a fresh lockfile
RUN bun install

# Runner stage
FROM installer AS runner

# Set working directory to app root
WORKDIR /app

# Set environment variables
ENV NODE_ENV=production

# Copy and make entrypoint script executable
COPY apps/worker/entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

# Expose worker port
EXPOSE 8080

# Use entrypoint script - process group will pass 'worker' as argument
CMD ["/app/entrypoint.sh"]