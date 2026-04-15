#!/usr/bin/env bash

set -euo pipefail

source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/lib/local-dev.sh"

run_supabase db reset
sync_local_env

echo "Local database reset complete."
print_tmdb_notice

