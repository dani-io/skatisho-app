#!/usr/bin/env bash
#
# deploy.sh — pull latest code, rebuild, migrate, restart, health-check.
# Saves a rollback point first. Run: bash ~/skatisho-app/deploy.sh
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

echo "==> [1/6] Saving rollback point..."
git rev-parse HEAD > "$ROLLBACK_FILE"
echo "    Saved current commit: $(cat "$ROLLBACK_FILE")"
if docker image inspect "$IMAGE" >/dev/null 2>&1; then
  docker tag "$IMAGE" "$PREV_IMAGE"
  echo "    Tagged current image as $PREV_IMAGE"
else
  echo "    No current image found to tag (first deploy?). Continuing."
fi

echo "==> [2/6] Pulling latest code..."
BEFORE=$(git rev-parse HEAD)
git pull --ff-only
AFTER=$(git rev-parse HEAD)

if [ "$BEFORE" = "$AFTER" ] && [ "${FORCE:-0}" != "1" ]; then
  echo "    No new commits. Nothing to deploy. (FORCE=1 to rebuild anyway.)"
  exit 0
fi
[ "$BEFORE" = "$AFTER" ] && echo "    FORCE=1 — rebuilding anyway." || echo "    Updated: $BEFORE -> $AFTER"

echo "==> [3/6] Building app image..."
docker compose build app

echo "==> [4/6] Running database migrations..."
docker compose run --rm migrate

echo "==> [5/6] Restarting app..."
docker compose up -d app

echo "==> [6/6] Health check..."
OK=0
for i in $(seq 1 "$HEALTH_RETRIES"); do
  CODE=$(curl -s -o /dev/null -w "%{http_code}" "$HEALTH_URL" || echo "000")
  case "$CODE" in
    200|301|307) OK=1; echo "    App is up (HTTP $CODE) after ${i} check(s)."; break ;;
    *) echo "    Attempt ${i}/${HEALTH_RETRIES}: got HTTP $CODE, retrying in ${HEALTH_DELAY}s..."; sleep "$HEALTH_DELAY" ;;
  esac
done

echo
if [ "$OK" = "1" ]; then
  echo "==> Deploy SUCCESSFUL."
  docker compose ps
else
  echo "==> WARNING: app did not become healthy."
  echo "    To roll back to the previous working version, run:"
  echo "        bash ~/skatisho-app/rollback.sh"
  echo "    Or inspect logs:  docker compose logs --tail 50 app"
  docker compose ps
  exit 1
fi
