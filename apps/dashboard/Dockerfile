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

# Copy package.json files from pruned workspace
COPY --from=builder /app/out/json/ .
COPY bunfig.toml .

# Install dependencies
RUN bun install

# Copy full source from pruned workspace
COPY --from=builder /app/out/full/ .

# Build the dashboard and its dependencies (including @midday/engine)
ENV NODE_ENV=production
RUN bunx turbo run build --filter=@midday/dashboard

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
