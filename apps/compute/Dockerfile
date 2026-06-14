FROM oven/bun:1.3.10 AS base

FROM base AS turbo-cli
RUN bun add -g turbo

FROM turbo-cli AS builder
WORKDIR /app
COPY . .
RUN turbo prune @midday/compute --docker --out-dir=out/compute

FROM base AS installer
WORKDIR /app

RUN apt-get update && apt-get install -y \
    python3 \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/out/compute/json/ .
COPY bunfig.toml .

RUN rm -f bun.lock
RUN bun install

COPY --from=builder /app/out/compute/full/ .

FROM oven/bun:1.3.10 AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8081

COPY --from=installer /app/node_modules ./node_modules
COPY --from=installer /app/apps/compute ./apps/compute
COPY --from=installer /app/apps/api ./apps/api
COPY --from=installer /app/packages ./packages
COPY --from=installer /app/package.json ./package.json

COPY --from=builder /app/.git-commit-sha /tmp/git-sha.txt
COPY --from=builder /app/scripts/docker-entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

WORKDIR /app/apps/compute

EXPOSE 8081

ENTRYPOINT ["/app/entrypoint.sh"]
CMD ["bun", "src/index.ts"]
