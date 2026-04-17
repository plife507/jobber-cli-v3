#!/usr/bin/env bash
# Ensure jobber-cli has a valid Jobber OAuth access token.
# Cron-friendly and non-interactive. Uses the shared KC OAuth manager,
# but writes the refreshed access token into jobber-cli/.env via JOBBER_ENV_PATH.
#
# Usage:
#   scripts/refresh-oauth-token.sh
#   scripts/refresh-oauth-token.sh --print-token   # prints token to stdout on success
#
# Exit codes:
#   0 = token ready
#   1 = refresh/authorization failed
#   2 = missing dependencies or invalid setup
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
JOBBER_CLI_ROOT="$(dirname "$SCRIPT_DIR")"
KC_ROOT="$(dirname "$JOBBER_CLI_ROOT")"
ENV_PATH="$JOBBER_CLI_ROOT/.env"
OAUTH_MANAGER="$KC_ROOT/jobber_oauth_manager.py"
PRINT_TOKEN=0

if [[ "${1:-}" == "--print-token" ]]; then
  PRINT_TOKEN=1
elif [[ $# -gt 0 ]]; then
  echo "Usage: $0 [--print-token]" >&2
  exit 2
fi

if [[ -f "$KC_ROOT/.venv/bin/python3" ]]; then
  PYTHON="$KC_ROOT/.venv/bin/python3"
elif [[ -f "$KC_ROOT/.venv/bin/python" ]]; then
  PYTHON="$KC_ROOT/.venv/bin/python"
elif command -v python3 >/dev/null 2>&1; then
  PYTHON="$(command -v python3)"
else
  echo "$(date -Iseconds) ERROR: Python 3 not found" >&2
  exit 2
fi

if [[ ! -f "$OAUTH_MANAGER" ]]; then
  echo "$(date -Iseconds) ERROR: OAuth manager not found at $OAUTH_MANAGER" >&2
  exit 2
fi

export JOBBER_ENV_PATH="$ENV_PATH"
export JOBBER_OAUTH_SKIP_AUTHORIZE=1

cd "$KC_ROOT"

if ! TOKEN="$($PYTHON "$OAUTH_MANAGER" get-token 2> >(cat >&2))"; then
  echo "$(date -Iseconds) ERROR: token refresh failed, run interactive re-auth if needed: jobber token oauth-authorize" >&2
  exit 1
fi

TOKEN="$(printf '%s' "$TOKEN" | tail -n 1 | tr -d '\r')"
if [[ ${#TOKEN} -lt 50 || "$TOKEN" == *"[ERROR]"* ]]; then
  echo "$(date -Iseconds) ERROR: OAuth manager returned an invalid token payload" >&2
  exit 1
fi

if [[ "$PRINT_TOKEN" -eq 1 ]]; then
  printf '%s\n' "$TOKEN"
else
  echo "$(date -Iseconds) OK: jobber-cli token ready (.env synced via OAuth manager)"
fi
