FROM oven/bun:1 as base

WORKDIR /app
ENV NODE_ENV="production"

COPY . .

RUN bun install --frozen-lockfile --production

ENV NEXT_TELEMETRY_DISABLED 1
RUN bun run build --filter=@midday/dashboard

USER bun
EXPOSE 3000/tcp

CMD [ "bun", "run", "start:dashboard" ]


# FROM oven/bun:1 as base

# # Next.js app lives here
# WORKDIR /app

# # Set production environment
# ENV NODE_ENV="production"

# # Throw-away build stage to reduce size of final image
# FROM base as build

# # install dependencies into temp directory
# # this will cache them and speed up future builds
# FROM base AS install
# RUN mkdir -p /temp/dev
# COPY . /temp/dev/
# RUN cd /temp/dev && bun install --frozen-lockfile

# # install with --production (exclude devDependencies)
# RUN mkdir -p /temp/prod
# COPY . /temp/prod/
# RUN cd /temp/prod && bun install --frozen-lockfile --production


# # copy node_modules from temp directory
# # then copy all (non-ignored) project files into the image
# FROM base AS prerelease
# WORKDIR /app
# COPY --from=install /temp/dev/node_modules node_modules
# COPY . .

# ENV NODE_ENV=production
# ENV NEXT_TELEMETRY_DISABLED 1
# RUN bun run build --filter=@midday/dashboard

# # copy production dependencies and source code into final image
# FROM base AS release
# WORKDIR /app
# # COPY --from=prerelease . .
# COPY - from=prerelease /app/apps/dashboard/.next/standalone ./
# # COPY --from=prerelease /app/apps/dashboard/.next/static ./apps/dashboard/.next/static
# # COPY --from=prerelease /app/apps/dashboard/public ./apps/dashboard/public

# USER bun
# EXPOSE 3000/tcp

# CMD [ "node", "server.js" ]
