#!/usr/bin/env bash

set -euo pipefail

source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/lib/local-dev.sh"

reset_database=false

while [ "$#" -gt 0 ]; do
  case "$1" in
    --reset)
      reset_database=true
      ;;
    *)
      echo "Unknown option: $1" >&2
      echo "Usage: ./scripts/local-up.sh [--reset]" >&2
      exit 1
      ;;
  esac
  shift
done

run_supabase start
sync_local_env

if [ "$reset_database" = true ]; then
  run_supabase db reset
  sync_local_env
fi

echo "Local Supabase is ready."
echo "App: http://127.0.0.1:3000"
echo "Studio: http://127.0.0.1:54323"
echo "Mailpit: http://127.0.0.1:54324"
print_tmdb_notice

