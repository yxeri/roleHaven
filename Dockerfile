FROM node:21.7.1 AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
ENV NODE_ENV production

RUN corepack enable
RUN corepack use pnpm@8.15.5

COPY . /app
WORKDIR /app

FROM base AS prod-deps

RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --prod --frozen-lockfile

FROM base AS builder

COPY --from=prod-deps /app/node_modules ./node_modules
COPY . .

FROM base AS build

RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
RUN pnpm run build

EXPOSE 8888

RUN start.sh
CMD ["pnpm", "start"]
