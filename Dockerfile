# Multi-stage Dockerfile for building and running the NestJS application

# --- Builder stage ----------------------------------------------------------
FROM node:20-bullseye-slim AS builder
WORKDIR /app

# Install small build deps (native modules may need python/g++/make)
RUN apt-get update \
    && apt-get install -y --no-install-recommends python3 make g++ ca-certificates curl \
    && rm -rf /var/lib/apt/lists/*

# Copy lockfile and package manifest first to leverage caching
COPY package.json pnpm-lock.yaml ./

# Enable corepack and install dependencies (uses pnpm from corepack)
RUN corepack enable && corepack prepare pnpm@latest --activate \
    && pnpm install --frozen-lockfile

# Copy source and build
COPY . .
RUN pnpm build


# --- Runner stage ----------------------------------------------------------
FROM node:20-bullseye-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

# Copy only package manifests and install full dependencies in the runtime image
# (we keep full deps so packages required at runtime via require('dotenv/config') are available)
COPY package.json pnpm-lock.yaml ./
RUN corepack enable && corepack prepare pnpm@latest --activate \
    && pnpm install --frozen-lockfile \
    && rm -rf /root/.cache

# Copy built output from builder
COPY --from=builder /app/dist ./dist

# Expose the port the app listens on (default 3000)
EXPOSE 3000

# Run the compiled Nest app (build output places compiled files under dist/src)
CMD ["node", "dist/src/main.js"]
