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

# Install dependencies
COPY --from=builder /app/out/json/ .
COPY bunfig.toml .
RUN bun install

# Copy full source
COPY --from=builder /app/out/full/ .

# Build engine types
RUN bunx turbo run build --filter=@midday/engine --only

# Runner stage - clean image
FROM oven/bun:1.3.9 AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copy only what's needed at runtime
COPY --from=installer /app/node_modules ./node_modules
COPY --from=installer /app/apps/api ./apps/api
COPY --from=installer /app/apps/engine ./apps/engine
COPY --from=installer /app/packages ./packages
COPY --from=installer /app/package.json ./package.json

WORKDIR /app/apps/api

EXPOSE 8080

CMD ["bun", "src/index.ts"]
