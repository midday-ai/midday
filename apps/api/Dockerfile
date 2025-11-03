# Base image with Bun
FROM oven/bun:1.2.22 AS base

# Install turbo CLI globally using Bun (cache this layer)
FROM base AS turbo-cli
RUN bun add -g turbo@2.6.0

# Builder stage
FROM turbo-cli AS builder
WORKDIR /app
# Copy all files for turbo prune
COPY . .
# Use turbo CLI from Bun global install to prune workspaces
RUN turbo prune @midday/api --docker

# Installer stage with build dependencies
FROM base AS installer
WORKDIR /app

# Install build dependencies for native modules (canvas, etc.)
# This layer is cached unless build dependencies change
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    build-essential \
    libcairo2-dev \
    libpango1.0-dev \
    libjpeg-dev \
    libgif-dev \
    librsvg2-dev \
    && rm -rf /var/lib/apt/lists/*

# Install npm and node-gyp (required for building native modules like canvas)
# Bun has compatibility issues with tar-fs used by canvas, so we use npm for canvas
RUN apt-get update && apt-get install -y --no-install-recommends \
    npm \
    && npm install -g node-gyp \
    && rm -rf /var/lib/apt/lists/*

# Copy only JSON files first (package.json files) for better layer caching
# This allows Docker to cache dependency installation layer separately
COPY --from=builder /app/out/json/ .

# Install dependencies - use bun for most packages, npm for canvas
# Cache this layer - only rebuilds when dependencies change
RUN --mount=type=cache,target=/root/.bun/install/cache \
    --mount=type=cache,target=/root/.npm \
    bun install --ignore-scripts && \
    npm install canvas --legacy-peer-deps --no-save || true && \
    bun install --ignore-scripts=false

# Copy the full source code (this invalidates cache when code changes)
COPY --from=builder /app/out/full/ .

# Copy the prebuilt engine dist from the build context (assumes CI built it)
COPY apps/engine/dist /app/apps/engine/dist

# Runner stage - final runtime image (remove build dependencies)
FROM base AS runner
WORKDIR /app

# Install only runtime libraries needed for canvas (not build tools)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libcairo2 \
    libpango-1.0-0 \
    libjpeg62-turbo \
    libgif7 \
    librsvg2-2 \
    && rm -rf /var/lib/apt/lists/*

# Copy only runtime files from installer
COPY --from=installer /app/node_modules ./node_modules
COPY --from=installer /app/apps ./apps
COPY --from=installer /app/packages ./packages

# Set the API directory as working directory
WORKDIR /app/apps/api

# Set environment variables
ENV NODE_ENV=production

# Expose the port the API runs on
EXPOSE 3000

# Run the API directly with Bun
CMD ["bun", "run", "src/index.ts"]
