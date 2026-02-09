# Base image with Bun
FROM oven/bun:1.3.9 AS base

# Install turbo CLI globally
FROM base AS turbo-cli
RUN bun add -g turbo

# Builder stage - prune API workspace
FROM turbo-cli AS builder
WORKDIR /app
COPY . .
RUN turbo prune @midday/api --docker

# Installer stage - install deps and build
FROM base AS installer
WORKDIR /app

# Install build dependencies for native modules (canvas, etc.)
RUN apt-get update && apt-get install -y \
    python3 \
    build-essential \
    libcairo2-dev \
    libpango1.0-dev \
    libjpeg-dev \
    libgif-dev \
    librsvg2-dev \
    && rm -rf /var/lib/apt/lists/*

# Install dependencies
COPY --from=builder /app/out/json/ .
COPY bunfig.toml .
RUN bun install

# Copy full source
COPY --from=builder /app/out/full/ .

# Build engine types
RUN bunx turbo run build --filter=@midday/engine --only

# Runner stage - clean image with only runtime deps
FROM oven/bun:1.3.9 AS runner
WORKDIR /app

# Install runtime libraries for canvas
RUN apt-get update && apt-get install -y \
    libcairo2 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libjpeg62-turbo \
    libgif7 \
    librsvg2-2 \
    && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production

# Copy the full workspace from installer (API needs source + node_modules at runtime)
COPY --from=installer /app /app

WORKDIR /app/apps/api

EXPOSE 8080

CMD ["bun", "src/index.ts"]
