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

# Install CA certificates so Sentry CLI can verify SSL during source map upload
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates && rm -rf /var/lib/apt/lists/*

# Copy package.json files from pruned workspace
COPY --from=builder /app/out/json/ .
COPY bunfig.toml .

# Install dependencies
RUN bun install

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

# Sentry source map upload (build-time only)
ARG SENTRY_AUTH_TOKEN
ARG SENTRY_ORG
ARG SENTRY_PROJECT

# Server Action encryption key — must be identical across all replicas/regions
# to prevent "Failed to find Server Action" errors. Base64-encoded, 32 bytes.
ARG NEXT_SERVER_ACTIONS_ENCRYPTION_KEY
ENV NEXT_SERVER_ACTIONS_ENCRYPTION_KEY=$NEXT_SERVER_ACTIONS_ENCRYPTION_KEY

# Git SHA stamped by CI (echo "$GITHUB_SHA" > .git-commit-sha) before `railway up`.
# The file lives at repo root, so the builder stage has it after COPY . .
COPY --from=builder /app/.git-commit-sha /tmp/git-sha.txt

ENV CI=true
ENV NODE_ENV=production

# Build with GIT_COMMIT_SHA + SENTRY_RELEASE exported so next.config.ts and
# the Sentry webpack plugin can read them via process.env.
RUN GIT_COMMIT_SHA=$(cat /tmp/git-sha.txt 2>/dev/null || echo ""); \
    export GIT_COMMIT_SHA; \
    export SENTRY_RELEASE="$GIT_COMMIT_SHA"; \
    bunx turbo run build --filter=@midday/dashboard --only

# Runner stage - clean bun image, no turbo
FROM oven/bun:1.3.9 AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

RUN groupadd --system --gid 1001 nodejs && \
    useradd --system --uid 1001 --no-log-init -g nodejs nextjs

# Copy standalone output
COPY --from=installer --chown=nextjs:nodejs /app/apps/dashboard/.next/standalone ./
COPY --from=installer --chown=nextjs:nodejs /app/apps/dashboard/.next/static ./apps/dashboard/.next/static
COPY --from=installer --chown=nextjs:nodejs /app/apps/dashboard/public ./apps/dashboard/public

# Carry the git SHA into the runtime container and use the shared entrypoint to
# set GIT_COMMIT_SHA / SENTRY_RELEASE when Railway doesn't provide them.
COPY --from=installer /tmp/git-sha.txt /tmp/git-sha.txt
COPY --from=builder /app/scripts/docker-entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

USER nextjs

EXPOSE 3000

ENTRYPOINT ["/app/entrypoint.sh"]
CMD ["bun", "apps/dashboard/server.js"]
