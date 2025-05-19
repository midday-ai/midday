# Base image with Bun
FROM oven/bun:1.2.13 AS base

# Builder stage
FROM base AS builder
WORKDIR /app
# Install turbo globally
RUN bun install -g turbo
# Copy all files
COPY . .
# Prune the workspaces to only the api and its dependencies, make sure to include all dependencies
RUN turbo prune @midday/api --docker

# Installer stage
FROM base AS installer
WORKDIR /app

# First install the dependencies (as they change less often)
COPY --from=builder /app/out/json/ .
# Don't copy the lockfile, allow Bun to generate a fresh one
RUN bun install

# Copy the full source code
COPY --from=builder /app/out/full/ .

# Runner stage (same as installer to avoid another copy)
FROM installer AS runner

# Set the API directory as working directory
WORKDIR /app/apps/api

# Set environment variables
ENV NODE_ENV=production

# Expose the port the API runs on
EXPOSE 3000

# Run the API directly with Bun
CMD ["bun", "run", "src/index.ts"]
