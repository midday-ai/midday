# Base image with Bun
FROM oven/bun:1.3.9 AS base

# Install turbo CLI globally using Bun
FROM base AS turbo-cli
RUN bun add -g turbo

# Builder stage - prune dashboard workspace
FROM turbo-cli AS builder
WORKDIR /app
# Copy all files
COPY . .
# Prune dashboard workspace
RUN turbo prune @midday/dashboard --docker

# Installer stage
FROM base AS installer
WORKDIR /app

# Install build dependencies for native modules (canvas, etc.)
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    build-essential \
    libcairo2-dev \
    libpango1.0-dev \
    libjpeg-dev \
    libgif-dev \
    librsvg2-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy package.json files from pruned workspace
COPY --from=builder /app/out/json/ .
COPY bunfig.toml .

# Install dependencies
RUN bun install

# Copy full source from pruned workspace
COPY --from=builder /app/out/full/ .

# Build engine types (dependency) then dashboard only
ENV NODE_ENV=production
RUN bunx turbo run build --filter=@midday/engine --only
RUN bunx turbo run build --filter=@midday/dashboard --only

# Runner stage - minimal image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# Create non-root user
RUN groupadd --system --gid 1001 nodejs
RUN useradd --system --uid 1001 --gid nodejs nextjs

# Copy standalone output
COPY --from=installer /app/apps/dashboard/.next/standalone ./
COPY --from=installer /app/apps/dashboard/.next/static ./apps/dashboard/.next/static
COPY --from=installer /app/apps/dashboard/public ./apps/dashboard/public

# Copy cache handler
COPY --from=installer /app/apps/dashboard/cache-handler.mjs ./apps/dashboard/cache-handler.mjs

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["bun", "apps/dashboard/server.js"]
