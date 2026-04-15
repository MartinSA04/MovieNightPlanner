#!/usr/bin/env bash

set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$script_dir/lib/local-dev.sh"

repo_cd

status_output=""
if ! status_output="$(run_supabase status -o env 2>/dev/null)"; then
  echo "The local Supabase stack is not running yet. Start it with 'corepack pnpm db:start' first." >&2
  exit 1
fi

extract_var() {
  local key="$1"
  printf '%s\n' "$status_output" | sed -n "s/^${key}=//p" | tail -n 1
}

api_url="$(extract_var API_URL)"
anon_key="$(extract_var ANON_KEY)"
service_role_key="$(extract_var SERVICE_ROLE_KEY)"

if [ -z "$api_url" ] || [ -z "$anon_key" ] || [ -z "$service_role_key" ]; then
  echo "Could not read local Supabase credentials from 'supabase status -o env'." >&2
  exit 1
fi

tmdb_api_key="your-tmdb-api-key-or-bearer-token"

if [ -f .env.local ]; then
  existing_tmdb="$(sed -n 's/^TMDB_API_KEY=//p' .env.local | tail -n 1)"
  if [ -n "${existing_tmdb:-}" ]; then
    tmdb_api_key="$existing_tmdb"
  fi
fi

cat > .env.local <<EOF
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=$api_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=$anon_key
SUPABASE_SERVICE_ROLE_KEY=$service_role_key
TMDB_API_KEY=$tmdb_api_key
EOF

echo "Wrote .env.local for local Supabase."
if [ "$tmdb_api_key" = "your-tmdb-api-key-or-bearer-token" ]; then
  echo "TMDB_API_KEY still needs a real value before movie search features will work."
fi
