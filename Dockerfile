# syntax=docker/dockerfile:1

###############################################################################
# Skatisho — production image
#
# Next.js 16 (output: "standalone") + Prisma 6.19.3 on Debian slim.
# FFmpeg is included for the future HLS pipeline.
#
# IMPORTANT — NEXT_PUBLIC_* are inlined into the client bundle at BUILD time.
# They must be passed as --build-arg, not just runtime env, or the wrong
# value bakes into the browser bundle (e.g. the CDN host for public images).
#
# Migrations are NOT run here. Per our workflow they run manually after
# deploy from the Coolify Terminal:  npx prisma migrate deploy
###############################################################################


###############################################################################
# Stage 1 — deps : install node_modules (cached unless lockfile changes)
###############################################################################
FROM node:22-slim AS deps
WORKDIR /app

# openssl is required by Prisma's engine at install/generate time.
RUN apt-get update && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*

# Only the manifests first, so this layer caches independently of source.
COPY package.json package-lock.json ./
RUN npm ci


###############################################################################
# Stage 2 — builder : prisma generate + next build
###############################################################################
FROM node:22-slim AS builder
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# --- Build-time public vars (inlined into the client bundle) ---------------
# Pass with: docker build --build-arg NEXT_PUBLIC_CDN_URL=https://cdn.skatisho.com ...
ARG NEXT_PUBLIC_CDN_URL
ARG NEXT_PUBLIC_SITE_URL
ARG NEXT_PUBLIC_VAPID_PUBLIC_KEY
ENV NEXT_PUBLIC_CDN_URL=${NEXT_PUBLIC_CDN_URL}
ENV NEXT_PUBLIC_SITE_URL=${NEXT_PUBLIC_SITE_URL}
ENV NEXT_PUBLIC_VAPID_PUBLIC_KEY=${NEXT_PUBLIC_VAPID_PUBLIC_KEY}

# Prisma client must be generated before the build (the app imports it).
RUN npx prisma generate

# Telemetry off for reproducible, quieter builds.
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build


###############################################################################
# Stage 3 — runner : minimal runtime with only what standalone needs
###############################################################################
FROM node:22-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# ffmpeg for the future HLS pipeline; openssl for the Prisma engine at runtime.
RUN apt-get update && apt-get install -y --no-install-recommends \
      ffmpeg openssl \
    && rm -rf /var/lib/apt/lists/*

# Run as a non-root user.
RUN groupadd --system --gid 1001 nodejs \
    && useradd --system --uid 1001 --gid nodejs nextjs

# --- Copy the standalone output ---------------------------------------------
# .next/standalone already contains a minimal node_modules + server.js.
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
# Static assets and public files are NOT included in standalone; copy them.
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# --- Prisma runtime bits ----------------------------------------------------
# standalone tracing sometimes misses the generated client + engine.
# Copy them explicitly so runtime queries work.
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma/client ./node_modules/@prisma/client
# schema + migrations, so `npx prisma migrate deploy` can be run from a shell.
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

USER nextjs

# server.js (from standalone) reads HOSTNAME and PORT from the environment.
# This is the standalone-correct way to bind 0.0.0.0:3000 — not `next start`.
ENV HOSTNAME=0.0.0.0
ENV PORT=3000
EXPOSE 3000

CMD ["node", "server.js"]
