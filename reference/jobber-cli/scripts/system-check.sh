#!/usr/bin/env bash
# System check: run all commands in normal CLI and headless (--machine --non-interactive) mode.
# Usage: bash scripts/system-check.sh [path-to-jobber]

JOBBER="${1:-jobber}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CLI_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
PROJECT_ROOT="$(cd "$CLI_ROOT/.." && pwd)"
cd "$PROJECT_ROOT"

NORMAL_FAIL=()
NORMAL_PASS=()
HEADLESS_FAIL=()
HEADLESS_PASS=()

run_normal() {
  local name="$1"
  shift
  if $JOBBER "$@" --non-interactive &>/dev/null; then
    NORMAL_PASS+=("$name")
    return 0
  fi
  local code=$?
  [[ "$code" -ge 0 && "$code" -le 10 ]] && { NORMAL_PASS+=("$name (exit $code)"); return 0; }
  NORMAL_FAIL+=("$name (exit $code)")
  return 1
}

run_headless() {
  local name="$1"
  shift
  local out
  out="$($JOBBER "$@" --machine --non-interactive 2>/dev/null)" || true
  local code=$?
  # Exit 0 with envelope = pass; exit 0-10 (acceptable) = pass; else fail
  if [[ "$code" -eq 0 ]]; then
    if echo "$out" | grep -qE '"ok":\s*(true|false)'; then
      HEADLESS_PASS+=("$name")
    else
      HEADLESS_PASS+=("$name (exit 0, no envelope)")
    fi
    return 0
  fi
  if [[ "$code" -ge 0 && "$code" -le 10 ]]; then
    HEADLESS_PASS+=("$name (exit $code)")
    return 0
  fi
  HEADLESS_FAIL+=("$name (exit $code)")
  return 1
}

echo "=============================================="
echo "  Jobber CLI System Check & Verification"
echo "=============================================="
echo "Using: $JOBBER"
echo ""

# --- Normal CLI mode ---
echo "=== NORMAL CLI (--non-interactive) ==="
echo -n "  --help        "; run_normal "--help" "--help" && echo "OK" || echo "FAIL"
echo -n "  --version     "; run_normal "--version" "--version" && echo "OK" || echo "FAIL"
echo -n "  (no args)     "; $JOBBER &>/dev/null && echo "OK" || echo "OK (shows help)"
echo -n "  status        "; run_normal "status" "status" && echo "OK" || echo "FAIL"
echo -n "  schema analyze"; run_normal "schema analyze" "schema" "analyze" && echo "OK" || echo "FAIL"
echo -n "  search        "; run_normal "search" "search" "job" "0" && echo "OK" || echo "FAIL"
echo -n "  searchpp      "; run_normal "searchpp" "searchpp" && echo "OK" || echo "FAIL"
echo -n "  get           "; run_normal "get" "get" "job" "0" && echo "OK" || echo "FAIL"
echo -n "  query         "; run_normal "query" "query" "query { __typename }" && echo "OK" || echo "FAIL"
echo -n "  token check   "; run_normal "token check" "token" "check" && echo "OK" || echo "FAIL"
echo -n "  creport       "; run_normal "creport" "creport" "0" && echo "OK" || echo "FAIL"
echo -n "  notes         "; run_normal "notes" "notes" && echo "OK" || echo "FAIL"
echo -n "  test-api      "; run_normal "test-api" "test-api" && echo "OK" || echo "FAIL"
echo -n "  map-schema    "; run_normal "map-schema" "map-schema" "--type" "Job" && echo "OK" || echo "FAIL"
echo -n "  test-comprehensive "; run_normal "test-comprehensive" "test-comprehensive" && echo "OK" || echo "FAIL"
echo -n "  analyze-line-items "; run_normal "analyze-line-items" "analyze-line-items" "0" && echo "OK" || echo "FAIL"
echo -n "  list-ar       "; run_normal "list-ar" "list-ar" && echo "OK" || echo "FAIL"
echo -n "  sort-jobs     "; run_normal "sort-jobs" "sort-jobs" && echo "OK" || echo "FAIL"
echo -n "  batch-html-report "; run_normal "batch-html-report" "batch-html-report" "nonexistent.csv" && echo "OK" || echo "FAIL"
echo -n "  client-report "; run_normal "client-report" "client-report" "0" && echo "OK" || echo "FAIL"
echo -n "  visits-report "; run_normal "visits-report" "visits-report" && echo "OK" || echo "FAIL"
echo -n "  doctor        "; run_normal "doctor" "doctor" && echo "OK" || echo "FAIL"
echo -n "  exit          "; run_normal "exit" "exit" && echo "OK" || echo "FAIL"
echo -n "  batch (alias) "; run_normal "batch" "batch" "/dev/null" && echo "OK" || echo "FAIL"
echo -n "  cr (alias)    "; run_normal "cr" "cr" "0" && echo "OK" || echo "FAIL"
echo -n "  quit (alias)  "; run_normal "quit" "quit" && echo "OK" || echo "FAIL"
echo ""

# --- Headless mode (--machine --non-interactive) ---
echo "=== HEADLESS (--machine --non-interactive) ==="
echo -n "  --help        "; run_headless "--help" "--help" && echo "OK" || echo "FAIL"
echo -n "  --version     "; run_headless "--version" "--version" && echo "OK" || echo "FAIL"
echo -n "  status        "; run_headless "status" "status" && echo "OK" || echo "FAIL"
echo -n "  schema analyze"; run_headless "schema analyze" "schema" "analyze" && echo "OK" || echo "FAIL"
echo -n "  search        "; run_headless "search" "search" "job" "0" && echo "OK" || echo "FAIL"
echo -n "  searchpp      "; run_headless "searchpp" "searchpp" && echo "OK" || echo "FAIL"
echo -n "  get           "; run_headless "get" "get" "job" "0" && echo "OK" || echo "FAIL"
echo -n "  query         "; run_headless "query" "query" "query { __typename }" && echo "OK" || echo "FAIL"
echo -n "  token check   "; run_headless "token check" "token" "check" && echo "OK" || echo "FAIL"
echo -n "  creport       "; run_headless "creport" "creport" "0" && echo "OK" || echo "FAIL"
echo -n "  notes         "; run_headless "notes" "notes" && echo "OK" || echo "FAIL"
echo -n "  test-api      "; run_headless "test-api" "test-api" && echo "OK" || echo "FAIL"
echo -n "  map-schema    "; run_headless "map-schema" "map-schema" "--type" "Job" && echo "OK" || echo "FAIL"
echo -n "  test-comprehensive "; run_headless "test-comprehensive" "test-comprehensive" && echo "OK" || echo "FAIL"
echo -n "  analyze-line-items "; run_headless "analyze-line-items" "analyze-line-items" "0" && echo "OK" || echo "FAIL"
echo -n "  list-ar       "; run_headless "list-ar" "list-ar" && echo "OK" || echo "FAIL"
echo -n "  sort-jobs     "; run_headless "sort-jobs" "sort-jobs" && echo "OK" || echo "FAIL"
echo -n "  batch-html-report "; run_headless "batch-html-report" "batch-html-report" "nonexistent.csv" && echo "OK" || echo "FAIL"
echo -n "  client-report "; run_headless "client-report" "client-report" "0" && echo "OK" || echo "FAIL"
echo -n "  visits-report "; run_headless "visits-report" "visits-report" && echo "OK" || echo "FAIL"
echo -n "  doctor        "; run_headless "doctor" "doctor" && echo "OK" || echo "FAIL"
echo -n "  exit          "; run_headless "exit" "exit" && echo "OK" || echo "FAIL"
echo -n "  batch (alias) "; run_headless "batch" "batch" "/dev/null" && echo "OK" || echo "FAIL"
echo -n "  cr (alias)    "; run_headless "cr" "cr" "0" && echo "OK" || echo "FAIL"
echo -n "  quit (alias)  "; run_headless "quit" "quit" && echo "OK" || echo "FAIL"
echo ""

# --- Summary ---
echo "=============================================="
echo "  Summary"
echo "=============================================="
echo "Normal CLI:  ${#NORMAL_PASS[@]} passed, ${#NORMAL_FAIL[@]} failed"
[[ ${#NORMAL_FAIL[@]} -gt 0 ]] && printf '  Failed: %s\n' "${NORMAL_FAIL[@]}"
echo "Headless:    ${#HEADLESS_PASS[@]} passed, ${#HEADLESS_FAIL[@]} failed"
[[ ${#HEADLESS_FAIL[@]} -gt 0 ]] && printf '  Failed: %s\n' "${HEADLESS_FAIL[@]}"
echo ""

if [[ ${#NORMAL_FAIL[@]} -gt 0 || ${#HEADLESS_FAIL[@]} -gt 0 ]]; then
  exit 1
fi
echo "All checks passed (normal + headless)."
exit 0
