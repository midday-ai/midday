# syntax=docker/dockerfile:1
FROM debian:bookworm-slim AS stainless

RUN apt-get update && apt-get install -y \
  nodejs \
  npm \
  yarnpkg \
  && apt-get clean autoclean

# Yarn
RUN ln -sf /usr/bin/yarnpkg /usr/bin/yarn

WORKDIR /workspace

COPY package.json yarn.lock /workspace/

RUN yarn install

COPY . /workspace
