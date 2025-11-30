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
RUN turbo prune @midday/worker --docker

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
COPY --from=builder /app/out/full/ .
# Remove any lockfile that might have been copied (turbo prune may include a partial one)
RUN rm -f bun.lock
# Generate a fresh lockfile
RUN bun install

# Runner stage (same as installer to avoid another copy)
FROM installer AS runner

# Set the worker directory as working directory
WORKDIR /app/apps/worker

# Set environment variables
ENV NODE_ENV=production

# Expose the port the worker runs on
EXPOSE 8080

# Run the worker directly with Bun
CMD ["bun", "run", "src/index.ts"]
