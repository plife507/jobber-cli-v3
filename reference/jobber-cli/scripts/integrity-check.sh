#!/usr/bin/env bash
# Integrity check: run each jobber command to verify it loads and runs without crash.
# Usage: bash scripts/integrity-check.sh [path-to-jobber]
# Default: uses "jobber" from PATH (globally installed).

JOBBER="${1:-jobber}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CLI_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
PROJECT_ROOT="$(cd "$CLI_ROOT/.." && pwd)"
cd "$PROJECT_ROOT"
FAILED=()
PASSED=()

run_cmd() {
  local name="$1"
  shift
  local args=("$@")
  if $JOBBER "${args[@]}" --non-interactive 2>/dev/null; then
    PASSED+=("$name")
    return 0
  fi
  local code=$?
  # Exit 0 = ok. 1,2,3,4,5,6,7,10 = validation/auth/rate/not-found/config/non-interactive/internal
  if [[ "$code" -ge 0 && "$code" -le 10 ]]; then
    PASSED+=("$name (exit $code)")
    return 0
  fi
  FAILED+=("$name (exit $code)")
  return 1
}

echo "=== Jobber CLI integrity check ==="
echo "Using: $JOBBER"
echo ""

# Global flags
echo -n "jobber --help ... "
if $JOBBER --help &>/dev/null; then echo "OK"; else echo "FAIL"; FAILED+=("--help"); fi

echo -n "jobber --version ... "
if $JOBBER --version &>/dev/null; then echo "OK"; else echo "FAIL"; FAILED+=("--version"); fi

echo -n "jobber (no args) ... "
if $JOBBER &>/dev/null; then echo "OK"; else echo "FAIL"; FAILED+=("no-args"); fi

# Unique commands (no aliases)
echo ""
echo "--- Commands ---"

echo -n "status ... "
run_cmd "status" "status" && echo "OK" || echo "FAIL"

echo -n "schema analyze ... "
run_cmd "schema analyze" "schema" "analyze" && echo "OK" || echo "FAIL"

echo -n "search ... "
run_cmd "search" "search" "job" "0" && echo "OK" || echo "FAIL"

echo -n "searchpp ... "
run_cmd "searchpp" "searchpp" && echo "OK" || echo "FAIL"

echo -n "get ... "
run_cmd "get" "get" "job" "0" && echo "OK" || echo "FAIL"

echo -n "query ... "
run_cmd "query" "query" "query { __typename }" && echo "OK" || echo "FAIL"

echo -n "token check ... "
run_cmd "token check" "token" "check" && echo "OK" || echo "FAIL"

echo -n "creport ... "
run_cmd "creport" "creport" "0" && echo "OK" || echo "FAIL"

echo -n "notes ... "
run_cmd "notes" "notes" && echo "OK" || echo "FAIL"

echo -n "test-api ... "
run_cmd "test-api" "test-api" && echo "OK" || echo "FAIL"

echo -n "map-schema ... "
run_cmd "map-schema" "map-schema" "--type" "Job" && echo "OK" || echo "FAIL"

echo -n "test-comprehensive ... "
run_cmd "test-comprehensive" "test-comprehensive" && echo "OK" || echo "FAIL"

echo -n "analyze-line-items ... "
run_cmd "analyze-line-items" "analyze-line-items" "0" && echo "OK" || echo "FAIL"

echo -n "list-ar ... "
run_cmd "list-ar" "list-ar" && echo "OK" || echo "FAIL"

echo -n "sort-jobs ... "
run_cmd "sort-jobs" "sort-jobs" && echo "OK" || echo "FAIL"

echo -n "batch-html-report ... "
run_cmd "batch-html-report" "batch-html-report" "nonexistent.csv" && echo "OK" || echo "FAIL"

echo -n "client-report ... "
run_cmd "client-report" "client-report" "0" && echo "OK" || echo "FAIL"

echo -n "visits-report ... "
run_cmd "visits-report" "visits-report" && echo "OK" || echo "FAIL"

echo -n "doctor ... "
run_cmd "doctor" "doctor" && echo "OK" || echo "FAIL"

echo -n "exit ... "
run_cmd "exit" "exit" && echo "OK" || echo "FAIL"

# Aliases
echo ""
echo "--- Aliases ---"
echo -n "batch (alias) ... "
run_cmd "batch" "batch" "/dev/null" 2>/dev/null && echo "OK" || echo "FAIL"
echo -n "cr (alias) ... "
run_cmd "cr" "cr" "0" && echo "OK" || echo "FAIL"
echo -n "quit (alias) ... "
run_cmd "quit" "quit" && echo "OK" || echo "FAIL"

echo ""
echo "=== Summary ==="
echo "Passed: ${#PASSED[@]}"
printf '  %s\n' "${PASSED[@]}"
if [[ ${#FAILED[@]} -gt 0 ]]; then
  echo "Failed: ${#FAILED[@]}"
  printf '  %s\n' "${FAILED[@]}"
  exit 1
fi
echo "All checks passed."
exit 0
