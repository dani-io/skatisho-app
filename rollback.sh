#!/usr/bin/env bash
#
# rollback.sh — revert to the previous code + image saved by deploy.sh.
# For the tech lead only. Protects local nginx/TLS config from git reset.
# Run: bash ~/skatisho-app/rollback.sh
#
set -euo pipefail

APP_DIR="$HOME/skatisho-app"
IMAGE="skatisho-app:local"
PREV_IMAGE="skatisho-app:previous"
ROLLBACK_FILE="$APP_DIR/.rollback-commit"
HEALTH_URL="http://localhost/"
HEALTH_RETRIES=10
HEALTH_DELAY=3

cd "$APP_DIR"

echo "==> Rolling back to the previous working version."

# --- Pre-flight checks ---
if [ ! -f "$ROLLBACK_FILE" ]; then
  echo "ERROR: no rollback point ($ROLLBACK_FILE missing). Cannot roll back."
  exit 1
fi
if ! docker image inspect "$PREV_IMAGE" >/dev/null 2>&1; then
  echo "ERROR: previous image ($PREV_IMAGE) not found. Cannot roll back the app image."
  exit 1
fi
PREV_COMMIT=$(cat "$ROLLBACK_FILE")
echo "    Target commit: $PREV_COMMIT"

# --- Protect local nginx/TLS config from git reset ---
# These files are modified locally on the server (TLS enabled) and are NOT
# committed. 'git reset --hard' would revert them and break HTTPS, so we
# back them up, reset, then restore them.
echo "==> [1/4] Backing up local nginx config..."
NGINX_BAK=$(mktemp -d)
cp -a nginx/conf.d/. "$NGINX_BAK"/
echo "    Backed up nginx/conf.d to $NGINX_BAK"

echo "==> [2/4] Reverting code to $PREV_COMMIT..."
git reset --hard "$PREV_COMMIT"

echo "    Restoring local nginx config..."
cp -a "$NGINX_BAK"/. nginx/conf.d/
rm -rf "$NGINX_BAK"
echo "    nginx config restored (TLS preserved)."

echo "==> [3/4] Restoring previous app image and restarting..."
docker tag "$PREV_IMAGE" "$IMAGE"
docker compose up -d app

echo "==> [4/4] Health check..."
OK=0
for i in $(seq 1 "$HEALTH_RETRIES"); do
  CODE=$(curl -s -o /dev/null -w "%{http_code}" "$HEALTH_URL" || echo "000")
  case "$CODE" in
    200|301|307) OK=1; echo "    App is up (HTTP $CODE)."; break ;;
    *) echo "    Check ${i}/${HEALTH_RETRIES}: HTTP $CODE — retrying..."; sleep "$HEALTH_DELAY" ;;
  esac
done

echo
if [ "$OK" = "1" ]; then
  echo "==> ROLLBACK SUCCESSFUL. Back on the previous working version."
  echo "    NOTE: this reverted code + app image, but NOT database migrations."
  echo "    If the bad deploy ran a migration, check the DB is still compatible."
  docker compose ps
else
  echo "==> WARNING: rollback finished but app still not healthy."
  echo "    Check logs:  docker compose logs --tail 50 app"
  exit 1
fi
