# Base image with Bun
FROM oven/bun:1.2.20 AS base

# Install turbo CLI globally using Bun
FROM base AS turbo-cli
RUN bun add -g turbo

# Builder stage: prune to only what's needed for the dashboard app
FROM turbo-cli AS builder
WORKDIR /app
COPY . .
RUN turbo prune @midday/dashboard --docker

# Installer stage: install dependencies from pruned output
FROM base AS installer
WORKDIR /app
COPY --from=builder /app/out/json/ .
RUN bun install
COPY --from=builder /app/out/full/ .

# Build stage
FROM installer AS build
WORKDIR /app/apps/dashboard

# Inject public runtime envs at build time so Next.js embeds correct URLs/keys
ARG NEXT_PUBLIC_URL
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    NEXT_PUBLIC_URL=${NEXT_PUBLIC_URL} \
    NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL} \
    NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL} \
    NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}

RUN bun run build

# Runner stage
FROM base AS runner
WORKDIR /app/apps/dashboard
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3001

# Copy the built app and node_modules from the build/installer layers
COPY --from=installer /app/node_modules /app/node_modules
COPY --from=installer /app/apps /app/apps
COPY --from=build /app/apps/dashboard/.next /app/apps/dashboard/.next

EXPOSE 3001

# Use Bun to start Next.js (it will run the Node-compatible server)
CMD ["bun", "run", "start"]

