#!/usr/bin/env bash

set -euo pipefail

APP_DIR="${APP_DIR:?APP_DIR is required}"
PM2_APP_NAME="${PM2_APP_NAME:?PM2_APP_NAME is required}"
BRANCH_NAME="${BRANCH_NAME:-main}"
RUN_DB_MIGRATIONS="${RUN_DB_MIGRATIONS:-false}"
HEALTHCHECK_URL="${HEALTHCHECK_URL:-}"
SKIP_GIT_SYNC="${SKIP_GIT_SYNC:-false}"
FORCE_CLEAN_WORKTREE="${FORCE_CLEAN_WORKTREE:-true}"

export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
if [ -s "$NVM_DIR/nvm.sh" ]; then
  . "$NVM_DIR/nvm.sh"
fi

if [ -s "$HOME/.profile" ]; then
  . "$HOME/.profile"
fi

if [ -s "$HOME/.bashrc" ]; then
  . "$HOME/.bashrc"
fi

cd "$APP_DIR"

if [ ! -f ".env" ]; then
  echo "Missing .env in $APP_DIR"
  exit 1
fi

if [ -n "$(git status --porcelain)" ]; then
  if [ "$FORCE_CLEAN_WORKTREE" = "true" ]; then
    echo "Cleaning dirty working tree before deploy..."
    git reset --hard HEAD
    git clean -fd -e .env -e .env.* -e backups/ -e uploads/
  else
    echo "Working tree is dirty on the server. Refusing to deploy."
    git status --short
    exit 1
  fi
fi

if [ "$SKIP_GIT_SYNC" != "true" ]; then
  git fetch origin "$BRANCH_NAME"
  git checkout "$BRANCH_NAME"
  git pull --ff-only origin "$BRANCH_NAME"
fi

npm ci
npx prisma generate

if [ "$RUN_DB_MIGRATIONS" = "true" ] && [ -d "prisma/migrations" ]; then
  npx prisma migrate deploy
fi

if [ -f "ecosystem.config.js" ]; then
  pm2 startOrReload ecosystem.config.js --update-env
elif pm2 describe "$PM2_APP_NAME" >/dev/null 2>&1; then
  pm2 restart "$PM2_APP_NAME" --update-env
else
  pm2 start app.js --name "$PM2_APP_NAME"
fi

pm2 save

if [ -n "$HEALTHCHECK_URL" ]; then
  sleep 5
  curl --fail --silent --show-error "$HEALTHCHECK_URL" >/dev/null
fi
