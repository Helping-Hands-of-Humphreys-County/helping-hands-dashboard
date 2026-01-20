#!/usr/bin/env bash
set -euo pipefail

# Apply EF Core migrations to the production database using the SDK image.
# Requirements:
# - DATABASE_URL env var must be set (e.g., postgres://user:pass@host:port/db?sslmode=require&trustServerCertificate=true)
# - Docker available locally

if [ -z "${DATABASE_URL:-}" ]; then
  echo "DATABASE_URL is required" >&2
  exit 1
fi

SCRIPT_DIR=$(cd -- "$(dirname "$0")" && pwd)
ROOT_DIR=$(cd -- "$SCRIPT_DIR/.." && pwd)

docker run --rm \
  -e DATABASE_URL="$DATABASE_URL" \
  -v "$ROOT_DIR":/src \
  -w /src/server/HelpingHands.Server \
  mcr.microsoft.com/dotnet/sdk:9.0 \
  dotnet ef database update -p . -s .
