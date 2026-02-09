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

# Install build dependencies for native modules (canvas for PDF previews)
RUN apt-get update && apt-get install -y \
    nodejs \
    npm \
    python3 \
    build-essential \
    libcairo2-dev \
    libpango1.0-dev \
    libjpeg-dev \
    libgif-dev \
    librsvg2-dev \
    pkg-config \
    && rm -rf /var/lib/apt/lists/*

# Copy package.json files from pruned workspace
COPY --from=builder /app/out/json/ .
COPY bunfig.toml .

# Install dependencies and rebuild canvas native module
RUN bun install
RUN npm rebuild canvas --build-from-source

# Copy full source from pruned workspace
COPY --from=builder /app/out/full/ .

# Build-time NEXT_PUBLIC_ env vars (Railway passes these as build args)
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_SUPABASE_ID
ARG NEXT_PUBLIC_URL
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_OPENPANEL_CLIENT_ID
ARG NEXT_PUBLIC_SENTRY_DSN
ARG NEXT_PUBLIC_PLAID_ENVIRONMENT
ARG NEXT_PUBLIC_TELLER_APPLICATION_ID
ARG NEXT_PUBLIC_TELLER_ENVIRONMENT
ARG NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
ARG NEXT_PUBLIC_GOOGLE_API_KEY
ARG NEXT_PUBLIC_DESKTOP_SCHEME
ARG NEXT_PUBLIC_WHATSAPP_NUMBER

# Build engine types (dependency) then dashboard only
ENV NODE_ENV=production
RUN bunx turbo run build --filter=@midday/engine --only
RUN bunx turbo run build --filter=@midday/dashboard --only

# Runner stage - clean bun image, no turbo
FROM oven/bun:1.3.9 AS runner
WORKDIR /app

# Install runtime libraries for canvas
RUN apt-get update && apt-get install -y --no-install-recommends \
    libcairo2 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libjpeg62-turbo \
    libgif7 \
    librsvg2-2 \
    && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

RUN groupadd --system --gid 1001 nodejs && \
    useradd --system --uid 1001 --no-log-init -g nodejs nextjs

# Copy standalone output
COPY --from=installer --chown=nextjs:nodejs /app/apps/dashboard/.next/standalone ./
COPY --from=installer --chown=nextjs:nodejs /app/apps/dashboard/.next/static ./apps/dashboard/.next/static
COPY --from=installer --chown=nextjs:nodejs /app/apps/dashboard/public ./apps/dashboard/public
COPY --from=installer --chown=nextjs:nodejs /app/apps/dashboard/cache-handler.mjs ./apps/dashboard/cache-handler.mjs

# Copy canvas native module for PDF preview rendering
COPY --from=installer /app/node_modules/canvas ./node_modules/canvas

USER nextjs

EXPOSE 3000

CMD ["bun", "apps/dashboard/server.js"]
