# Multi-stage build targeting Raspberry Pi (linux/arm64). Built on Debian-slim rather than
# Alpine because better-sqlite3's native bindings are more reliable on glibc for ARM64.
# Node 24 (not 20) because better-sqlite3 declares engines.node >=22.

FROM node:24-bookworm-slim AS builder
WORKDIR /app
# better-sqlite3 needs a C/C++ toolchain to compile its native addon when no prebuilt
# binary matches this exact arch/glibc/Node ABI combo (common on ARM64/Raspberry Pi).
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ \
	&& rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:24-bookworm-slim AS prod-deps
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ \
	&& rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

FROM node:24-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=builder /app/build ./build
COPY --from=builder /app/src/lib/server/db ./src/lib/server/db
COPY package.json ./

RUN useradd --create-home --uid 1001 appuser \
	&& mkdir -p /app/data \
	&& chown -R appuser:appuser /app

USER appuser
EXPOSE 3000

# Applies pending migrations and (re-)seeds the tag/exercise library, then starts the
# server. Both are safe to re-run on every boot: the migrator tracks what already ran, and
# the seed script skips tags/exercises that already exist by name.
CMD ["sh", "-c", "node_modules/.bin/tsx src/lib/server/db/migrate.ts && node_modules/.bin/tsx src/lib/server/db/seed/seed.ts && node build/index.js"]
