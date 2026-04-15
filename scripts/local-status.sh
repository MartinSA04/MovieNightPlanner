#!/usr/bin/env bash

set -euo pipefail

source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/lib/local-dev.sh"

if status_output="$(run_supabase status 2>&1)"; then
  printf '%s\n' "$status_output"
else
  container_lines="$(list_supabase_containers || true)"

  if [ -n "$container_lines" ]; then
    echo "Local Supabase is present but not fully ready yet."
    printf '%s\n' "$container_lines"
  else
    echo "Local Supabase is stopped."
  fi
fi

if [ -f "$repo_root/.env.local" ]; then
  echo
  echo ".env.local is present."
  print_tmdb_notice
else
  echo
  echo ".env.local is missing. Run './scripts/local-up.sh' or 'corepack pnpm db:start'."
fi
