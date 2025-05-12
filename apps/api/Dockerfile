# Base image with Bun
FROM oven/bun:1.2.13 as base

# Set working directory
WORKDIR /app

# Copy root package.json and workspace files
COPY package.json bun.lock tsconfig.json ./
COPY apps/api/package.json ./apps/api/
COPY packages/ ./packages/

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source code
COPY apps/api/src ./apps/api/src
COPY apps/api/migrations ./apps/api/migrations
COPY apps/api/drizzle.config.ts ./apps/api/

# Set the API directory as working directory
WORKDIR /app/apps/api

# Set environment variables
ENV NODE_ENV=production

# Expose the port the API runs on
EXPOSE 3000

# Run the API directly with Bun
CMD ["bun", "run", "src/index.ts"]
