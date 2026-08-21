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
# Pass with: docker build --build-arg NEXT_PUBLIC_CDN_URL=/media ...
# These are INLINED into the bundle here; setting them in the running
# container's environment has no effect. Changing one requires a rebuild.
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

# --- Stage the Prisma CLI + its dependency closure --------------------------
# `prisma` is a devDependency and is NOT part of the standalone output, so the
# runner has no way to run migrations without it. Its closure is 32 packages
# (@prisma/engines, @prisma/config, effect, c12, ...) — resolved from
# package.json here rather than hand-listed in COPY lines, so a Prisma upgrade
# cannot silently drop one. ~147MB vs ~915MB for the whole node_modules tree.
RUN <<'STAGE_CLI'
set -e
node -e '
const fs = require("fs"), path = require("path"), seen = new Set();
(function walk(name) {
  if (seen.has(name)) return;
  seen.add(name);
  const pj = path.join("node_modules", name, "package.json");
  if (!fs.existsSync(pj)) return;
  const pkg = JSON.parse(fs.readFileSync(pj, "utf8"));
  for (const dep of Object.keys(pkg.dependencies || {})) walk(dep);
})("prisma");
const list = [...seen].filter((n) => fs.existsSync(path.join("node_modules", n)));
fs.writeFileSync("/tmp/prisma-cli-closure.txt", list.join("\n") + "\n");
console.log("prisma CLI closure:", list.length, "packages");
'
mkdir -p /prisma-cli
tar -C node_modules -cf - -T /tmp/prisma-cli-closure.txt | tar -C /prisma-cli -xf -
STAGE_CLI


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

# nextjs has no home directory, so any tool that writes to $HOME (npm/npx cache)
# fails with EACCES. Point HOME at /app.
# NOTE: `WORKDIR /app` creates the directory as root, and the --chown flags on
# COPY only affect the copied contents, not the directory itself — so /app must
# be chowned explicitly or HOME=/app is still unwritable. Non-recursive: only
# the directory inode changes, so this costs nothing in layer size.
RUN chown nextjs:nodejs /app
ENV HOME=/app

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

# --- Prisma CLI, so `prisma migrate deploy` can run in the container ---------
# @prisma/client is only the runtime library. The CLI is a separate package
# with its own dependency closure, staged by the builder — copying just
# `prisma` leaves it dead on startup ("Cannot find module '@prisma/engines'",
# then "Cannot find module 'effect'", ...).
COPY --from=builder --chown=nextjs:nodejs /prisma-cli ./node_modules

# node_modules/.bin/prisma is a SYMLINK to ../prisma/build/index.js. Copying it
# with COPY dereferences it into a plain file, which moves __dirname to
# node_modules/.bin — the CLI then can't find its own .wasm assets and fails
# with "ENOENT: prisma_schema_build_bg.wasm". Recreate the symlink instead.
RUN mkdir -p node_modules/.bin \
    && ln -sf ../prisma/build/index.js node_modules/.bin/prisma \
    && chown -h nextjs:nodejs node_modules/.bin/prisma

# schema + migrations, so `prisma migrate deploy` can be run from a shell.
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

# Preloaded before server.js so http.createServer gets requestTimeout as a
# CONSTRUCTOR option — the only point where Node honors it (see the file).
COPY --chown=nextjs:nodejs server-preload.cjs ./

USER nextjs

# server.js (from standalone) reads HOSTNAME and PORT from the environment.
# This is the standalone-correct way to bind 0.0.0.0:3000 — not `next start`.
ENV HOSTNAME=0.0.0.0
ENV PORT=3000
EXPOSE 3000

# --require runs the preload before server.js, which must happen before Next
# constructs its HTTP server (Node only honors requestTimeout at construction).
CMD ["node", "--require", "./server-preload.cjs", "server.js"]
