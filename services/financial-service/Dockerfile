FROM  node:lts AS compile

WORKDIR /app
RUN npm install -g workerd@latest bun

COPY bun.lock ./
RUN bun fetch


COPY . .
RUN rm .dev.vars || true


RUN bun install --offline -r

WORKDIR /app/services/financial-service
RUN bun wrangler deploy --outdir=dist --dry-run

RUN bun workerd compile ./worker.capnp > solomonai


FROM ubuntu:latest
COPY --from=compile /app/services/financial-service/solomonai /usr/bin/solomonai

EXPOSE 8787
CMD ["solomonai"]


# FROM --platform=linux/amd64 node:lts AS compile

# WORKDIR /app
# RUN npm install -g workerd bun

# COPY bun.lock ./
# RUN bun fetch


# COPY . .
# RUN rm .dev.vars || true



# RUN bun install --offline -r

# WORKDIR /app/services/financial-service
# RUN bun wrangler deploy --dry-run --outdir .wrangler/dist

# FROM jacoblincool/workerd

# COPY --from=compile /app/services/financial-service/worker.capnp /app/worker.capnp
# COPY --from=compile /app/services/financial-service/.wrangler/dist /app/.wrangler/dist

# WORKDIR /app

# EXPOSE 8787