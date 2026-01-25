# Base image with Bun
FROM oven/bun:1.2.22 AS base

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

# Copy root package files (bun.lock may not exist, hence the *)
COPY package.json bun.lock* turbo.json ./

# Copy workspace package files for dependency resolution
COPY packages/accounting/package.json packages/accounting/
COPY packages/app-store/package.json packages/app-store/
COPY packages/cache/package.json packages/cache/
COPY packages/categories/package.json packages/categories/
COPY packages/customers/package.json packages/customers/
COPY packages/db/package.json packages/db/
COPY packages/documents/package.json packages/documents/
COPY packages/email/package.json packages/email/
COPY packages/encryption/package.json packages/encryption/
COPY packages/engine-client/package.json packages/engine-client/
COPY packages/events/package.json packages/events/
COPY packages/import/package.json packages/import/
COPY packages/inbox/package.json packages/inbox/
COPY packages/invoice/package.json packages/invoice/
COPY packages/job-client/package.json packages/job-client/
COPY packages/jobs/package.json packages/jobs/
COPY packages/location/package.json packages/location/
COPY packages/logger/package.json packages/logger/
COPY packages/notifications/package.json packages/notifications/
COPY packages/plans/package.json packages/plans/
COPY packages/supabase/package.json packages/supabase/
COPY packages/tsconfig/package.json packages/tsconfig/
COPY packages/ui/package.json packages/ui/
COPY packages/utils/package.json packages/utils/
COPY packages/workbench/package.json packages/workbench/
COPY apps/api/package.json apps/api/
COPY apps/engine/package.json apps/engine/

# Install dependencies
RUN bun install --frozen-lockfile || bun install

# Copy all source files
COPY packages packages/
COPY apps/api apps/api/
COPY apps/engine/src apps/engine/src/
COPY apps/engine/tsconfig*.json apps/engine/

# Build engine types
RUN cd apps/engine && bun run build 2>/dev/null || true

# Runner stage
FROM installer AS runner

# Set the API directory as working directory
WORKDIR /app/apps/api

# Set environment variables
ENV NODE_ENV=production

# Expose the port the API runs on
EXPOSE 8080

# Run the API directly with Bun
CMD ["bun", "run", "src/index.ts"]
