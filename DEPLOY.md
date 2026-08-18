# Deploying Skatisho

Self-contained Docker Compose stack: nginx + certbot + Next.js app + Postgres 16
+ MinIO. No Coolify, no Traefik, no Cloudflare tunnel — the droplet has a public
IP and terminates its own TLS.

Only nginx publishes ports (80/443). Postgres and MinIO sit on an `internal:
true` network with no published ports and no route off the host.

**The image carries no domain.** `NEXT_PUBLIC_SITE_URL` is resolved at runtime,
so the same image runs on `new.skatisho.com` (DigitalOcean) and `skatisho.com`
(Iran/Arvan). See [Switching domains](#switching-domains).

---

## Prerequisites

- Docker Engine with the Compose plugin
- DNS: an A record for `new.skatisho.com` → the droplet's public IP, resolving
  **before** you request a certificate
- Ports 80 and 443 open in the droplet firewall

---

## First deployment

### 1. Configure

```bash
cp .env.example .env
$EDITOR .env
```

Must-set before anything will start: `POSTGRES_PASSWORD`, `DATABASE_URL`
(matching it), `JWT_SECRET`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`.

Generate secrets:

```bash
openssl rand -base64 32   # JWT_SECRET
openssl rand -base64 24   # POSTGRES_PASSWORD, S3_SECRET_KEY
```

**Set `SUPER_ADMIN_EMAILS` (or `SUPER_ADMIN_PHONES`) now.** On a fresh database
there is no admin account, and without this there is no way into the admin panel.

Compose refuses to start rather than substituting a default for any of the
required variables, so a missing one is a startup error, not a silent weak
secret.

### 2. Build

```bash
docker compose build
```

Builds `skatisho-app:${APP_VERSION:-local}` — Next.js 16 standalone on
`node:22-slim`, Prisma 6.19.3. The only build arg is `NEXT_PUBLIC_CDN_URL=/media`
(relative, domain-independent). No database is needed at build time.

### 3. Data services and bootstrap

```bash
docker compose up -d postgres minio
docker compose run --rm createbuckets     # idempotent; safe to re-run
docker compose run --rm migrate           # prisma migrate deploy
```

`createbuckets` creates `sktsho-private` and `sktsho-public` and sets both to
`anonymous set none`. The public bucket needs no anonymous download policy: the
app fetches public objects with its own credentials and streams them out through
`/media/*`. MinIO has no published port for anyone to reach anonymously.

### 4. Seed light test data (optional)

```bash
docker compose run --rm migrate node prisma/seed.js
```

Idempotent upserts: three coaches plus a couple of courses and lessons — enough
to verify upload and playback end to end.

**Light test data only.** Do not upload real course video on DigitalOcean. Video
lives in the `minio_data` volume, which is deliberately not part of the
transferred image; real content gets uploaded on the Iran VPS over Iran traffic.

### 5. Start the app over HTTP and smoke-test

```bash
docker compose up -d
curl -I http://new.skatisho.com/
```

The stack starts with `nginx/conf.d/00-bootstrap.conf` — HTTP only. TLS ships
as `10-tls.conf.disabled` because nginx validates `ssl_certificate` at startup
and would crash-loop on a certificate that does not exist yet, taking the ACME
challenge endpoint down with it and making issuance impossible.

### 6. Issue the certificate

```bash
docker compose run --rm --entrypoint certbot certbot \
  certonly --webroot -w /var/www/certbot \
  -d new.skatisho.com \
  --email you@example.com --agree-tos --no-eff-email
```

Add `--dry-run` first if you want to check the challenge path without spending
one of Let's Encrypt's five-per-week duplicate-certificate attempts.

### 7. Enable TLS

```bash
mv nginx/conf.d/10-tls.conf.disabled nginx/conf.d/10-tls.conf
```

Then edit `00-bootstrap.conf`: delete both `location` proxy blocks and leave
only the ACME challenge plus a redirect —

```nginx
location / { return 301 https://$host$request_uri; }
```

```bash
docker compose exec nginx nginx -t      # validate before reloading
docker compose exec nginx nginx -s reload
```

The `certbot` service renews every 12 hours in the background. nginx does not
pick up a renewed certificate on its own — reload it after a renewal, e.g. via a
weekly cron: `docker compose exec nginx nginx -s reload`.

### 8. Verify

- `https://new.skatisho.com/` — landing page, images load from `/media/*`
- Admin sign-in with a `SUPER_ADMIN_EMAILS` address
- Upload one test video (admin → courses → lesson). A 500MB upload should stream
  with a progress bar that tracks real progress. If the bar jumps to 100% and
  then hangs, `proxy_request_buffering off` is missing from the upload location.
- Play the lesson back, and seek — seeking exercises Range requests through the
  authenticated video route.

---

## Everyday operations

```bash
docker compose logs -f app
docker compose up -d --build app          # deploy code changes
docker compose run --rm migrate           # after adding a migration
docker compose ps
```

After changing `.env`: `docker compose up -d app` (recreates the container).
`ZARINPAL_SANDBOX` in particular is read at module load and needs the restart.

Database backup:

```bash
docker compose exec -T postgres pg_dump -U skatisho skatisho | zstd > backup.sql.zst
```

---

## Transferring to the Iran VPS

Docker Hub is not reachable from Iran, so images travel as a tarball rather than
being re-pulled. Every tag in `docker-compose.yml` is pinned for this reason.

On DigitalOcean:

```bash
docker compose build
docker save \
  skatisho-app:${APP_VERSION:-local} \
  postgres:16-alpine \
  minio/minio:RELEASE.2025-09-07T16-13-09Z \
  minio/mc:RELEASE.2025-08-13T08-35-41Z \
  nginx:1.27-alpine \
  certbot/certbot:v5.7.0 \
  | zstd -19 -T0 > skatisho-stack.tar.zst
```

Expect roughly 600–800 MB before compression. **No video is in it** — uploads
live in the `minio_data` volume, and `.dockerignore` excludes `*.mp4/*.mov/*.mkv`
from the build context. (If you want it smaller, dropping `ffmpeg` from the
runner stage of the `Dockerfile` saves several hundred MB; it is installed ahead
of an HLS pipeline that does not exist yet.)

On the Iran VPS:

```bash
zstd -d -c skatisho-stack.tar.zst | docker load
git clone <repo> && cd skatisho-app      # or copy the repo across
cp .env.example .env && $EDITOR .env     # new secrets, new domain
docker compose up -d postgres minio
docker compose run --rm createbuckets
docker compose run --rm migrate
docker compose up -d
```

`docker compose up` will not rebuild the app: the `image:` tag already exists
locally after `docker load`.

Data moves separately — restore the `pg_dump` above, and upload real video on
the Iran side.

---

## Switching domains

`new.skatisho.com` → `skatisho.com`. Four places, **no rebuild**:

| # | What | Where |
|---|---|---|
| 1 | `NEXT_PUBLIC_SITE_URL` and `APP_URL` | `.env`, then `docker compose up -d app` |
| 2 | `server_name` (both files) and the two `ssl_certificate` paths | `nginx/conf.d/00-bootstrap.conf`, `10-tls.conf` |
| 3 | Reissue the certificate for the new name | step 6 above, with `-d skatisho.com` |
| 4 | Authorized redirect URI `https://skatisho.com/api/auth/google/callback` | Google Cloud Console |

The image is untouched because nothing bakes the domain: `lib/env.ts` reads
`NEXT_PUBLIC_SITE_URL` through a dynamic `process.env[name]` lookup that Next
cannot inline, and `NEXT_PUBLIC_CDN_URL=/media` is relative and same-origin under
any domain.

Verify at any time — this must print `0`:

```bash
NEXT_PUBLIC_SITE_URL=https://SENTINEL.example npm run build
grep -rl 'SENTINEL' .next | wc -l
```

---

## Constraints worth knowing

**The app must stay at one replica.** `src/lib/sms/store.ts` keeps OTP codes in a
per-process `Map`. A second replica would verify codes against the wrong process
and OTP login would fail intermittently. Scaling out requires moving that store
to Postgres or Redis first.

**MinIO and Postgres never get published ports.** They are on `internal: true`,
which strips the default gateway — no inbound path, and no outbound route
either. The app is the only thing that talks to them.

**Uploads depend on `proxy_request_buffering off`.** Without it nginx buffers the
whole body to disk before the app sees a byte, which defeats the streaming
upload path and presents as a progress bar stuck at 100%.

---

## Optional: Portainer

Management only. Keep it off the request path — do not attach it to the `edge`
network and do not proxy it through nginx, or you have a second, unconfigured
reverse proxy with none of the upload timeouts and body limits set.

```yaml
  portainer:
    image: portainer/portainer-ce:2.21.4
    restart: unless-stopped
    ports:
      - "127.0.0.1:9443:9443"          # localhost only — reach it over SSH
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
      - portainer_data:/data
    networks: [mgmt]
```

Add `mgmt:` to `networks:` and `portainer_data:` to `volumes:`, then reach it via
`ssh -L 9443:localhost:9443 root@droplet` and open <https://localhost:9443>.

It gets the Docker socket, which is root-equivalent on the host — the
localhost-only port binding is what keeps that off the internet.
