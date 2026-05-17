#!/bin/bash
# local-run.sh — starts the backend using secrets from the root .env file.
# No secrets are stored in this script. All values come from ../.env (gitignored).
#
# Required .env keys:
#   DB_USERNAME, DB_PASSWORD, JWT_SECRET, ADMIN_INITIAL_PASSWORD, ALLOWED_ORIGINS

set -e

ENV_FILE="$(dirname "$0")/../.env"

if [ ! -f "$ENV_FILE" ]; then
  echo "ERROR: .env file not found at $ENV_FILE"
  echo "Copy .env.example to .env and fill in your values."
  exit 1
fi

set -o allexport
# shellcheck source=/dev/null
source "$ENV_FILE"
set +o allexport

# Local dev overrides (Docker DB remapped to 5433 to avoid conflict with local Postgres)
export DB_URL="jdbc:postgresql://localhost:5433/farm_db"
export ALLOWED_ORIGINS="${ALLOWED_ORIGINS:-http://localhost:3000}"

java -jar "$(dirname "$0")/target/farm-management-0.0.1-SNAPSHOT.jar"
