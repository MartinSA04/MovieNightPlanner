#!/usr/bin/env bash

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
supabase_project_name="movie-night-planner"

repo_cd() {
  cd "$repo_root"
}

ensure_corepack() {
  if ! command -v corepack >/dev/null 2>&1; then
    echo "Corepack is required. Install Node.js 20+ and run 'corepack enable'." >&2
    exit 1
  fi
}

ensure_docker_installed() {
  if ! command -v docker >/dev/null 2>&1; then
    echo "Docker is not installed yet. Run './scripts/install-docker-ubuntu.sh' first." >&2
    exit 1
  fi
}

ensure_workspace_dependencies() {
  if [ ! -x "$repo_root/node_modules/.bin/supabase" ]; then
    echo "Workspace dependencies are missing. Run 'corepack pnpm install' first." >&2
    exit 1
  fi
}

user_is_listed_in_docker_group() {
  local members

  members="$(getent group docker 2>/dev/null | cut -d: -f4 || true)"
  if [ -z "${USER:-}" ]; then
    return 1
  fi

  printf '%s\n' "$members" | tr ',' '\n' | grep -Fxq "$USER"
}

repo_command_string() {
  local quoted=()
  local arg

  for arg in "$@"; do
    quoted+=("$(printf '%q' "$arg")")
  done

  printf '%s ' "${quoted[@]}"
}

run_in_repo() {
  (
    repo_cd
    "$@"
  )
}

run_with_docker_access() {
  ensure_docker_installed

  if run_in_repo docker info >/dev/null 2>&1; then
    run_in_repo "$@"
    return
  fi

  if command -v sg >/dev/null 2>&1 && user_is_listed_in_docker_group; then
    local cmd
    cmd="$(repo_command_string "$@")"

    (
      repo_cd
      sg docker -c "$cmd"
    )
    return
  fi

  cat >&2 <<'EOF'
Docker is installed, but this shell cannot access the Docker daemon yet.
Open a new terminal or run 'newgrp docker', then retry.
EOF
  exit 1
}

run_supabase() {
  ensure_corepack
  ensure_workspace_dependencies
  run_with_docker_access corepack pnpm exec supabase "$@"
}

list_supabase_containers() {
  run_with_docker_access docker ps -a \
    --filter "label=com.supabase.cli.project=${supabase_project_name}" \
    --format '{{.Names}}\t{{.Status}}'
}

sync_local_env() {
  ensure_corepack
  ensure_workspace_dependencies
  run_with_docker_access ./scripts/setup-local-env.sh
}

tmdb_key_is_placeholder() {
  [ -f "$repo_root/.env.local" ] &&
    grep -q '^TMDB_API_KEY=your-tmdb-api-key-or-bearer-token$' "$repo_root/.env.local"
}

print_tmdb_notice() {
  if tmdb_key_is_placeholder; then
    echo "TMDB_API_KEY is still a placeholder in .env.local."
  fi
}
