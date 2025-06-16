# Base image with Bun
FROM oven/bun:1.2.13 AS base

# Install turbo CLI globally using Bun
FROM base AS turbo-cli
RUN bun add -g turbo

# Builder stage
FROM turbo-cli AS builder
WORKDIR /app
# Copy all files
COPY . .
# Use turbo CLI from Bun global install to prune workspaces
RUN turbo prune @midday/worker --docker

# Installer stage - install all dependencies including devDependencies for building
FROM base AS installer
WORKDIR /app

# First install the dependencies (as they change less often)
COPY --from=builder /app/out/json/ .
# Don't copy the lockfile, allow Bun to generate a fresh one
RUN bun install

# Copy the full source code
COPY --from=builder /app/out/full/ .

# Production dependencies installer stage - install only production dependencies
FROM base AS prod-deps
WORKDIR /app

# Copy package files
COPY --from=builder /app/out/json/ .
# Install only production dependencies
RUN bun install --production

# Final runtime stage - use base image for smallest footprint
FROM base AS runner
WORKDIR /app

# Copy only production dependencies
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=prod-deps /app/packages ./packages

# Copy only the worker app files needed for runtime
COPY --from=builder /app/out/full/apps/worker/src ./apps/worker/src
COPY --from=builder /app/out/full/apps/worker/package.json ./apps/worker/package.json

# Set the API directory as working directory
WORKDIR /app/apps/worker

# Set environment variables
ENV NODE_ENV=production

# Change to non-root user
USER bun

# Expose the port the API runs on
EXPOSE 3000

# Run the API directly with Bun
CMD ["bun", "run", "src/index.ts"]
