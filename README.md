# Movie Night Planner

Movie Night Planner is a collaborative planning app for small groups that want to stop arguing about what to watch. The project is organized as a pnpm workspace with a Next.js web app, shared TypeScript domain logic, and Supabase-backed data/auth infrastructure.

## Stack

* Next.js App Router
* TypeScript
* Tailwind CSS
* Supabase
* TMDb API
* Zod
* Vitest and Playwright

## Repository Layout

```text
.
├─ AGENTS.md
├─ apps/
│  └─ web/
├─ packages/
│  ├─ config/
│  ├─ domain/
│  └─ ui/
├─ docs/
├─ supabase/
└─ tests/
```

## Getting Started

### Prerequisites

* Node.js 20+
* Corepack enabled for `pnpm`
* Docker Engine or Docker Desktop

### Install

```bash
corepack enable
corepack pnpm install
```

### Configure Environment

Required variables:

* `NEXT_PUBLIC_APP_URL`: browser-facing app URL
* `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL
* `NEXT_PUBLIC_SUPABASE_ANON_KEY`: public client key
* `SUPABASE_SERVICE_ROLE_KEY`: server-only privileged key
* `TMDB_API_KEY`: TMDb API key or bearer token

### Local Development

Simplest local flow:

```bash
corepack pnpm local:dev
```

Open `http://localhost:3000`.

Notes:

* `local:dev` starts local Supabase, syncs `.env.local`, and then launches the web app.
* `db:start`, `db:stop`, `db:status`, and `db:reset` now handle Docker access automatically, including shells that have not picked up the `docker` group yet.
* `setup:local-env` reads the running local Supabase stack and writes `.env.local` without echoing the secret values.
* `TMDB_API_KEY` still needs to be set manually in `.env.local`.
* Stop the local stack with `corepack pnpm local:down`.

## Commands

```bash
corepack pnpm dev
corepack pnpm build
corepack pnpm lint
corepack pnpm typecheck
corepack pnpm test
corepack pnpm e2e
corepack pnpm local:dev
corepack pnpm local:up
corepack pnpm local:status
corepack pnpm local:reset
corepack pnpm local:down
corepack pnpm db:start
corepack pnpm db:status
corepack pnpm db:reset
corepack pnpm db:stop
corepack pnpm setup:local-env
```

## Documentation

* [AGENTS.md](AGENTS.md)
* [Architecture](docs/architecture.md)
* [Product Spec](docs/product-spec.md)
* [Database Schema](docs/database-schema.md)
* [API Contracts](docs/api-contracts.md)

## Current Scope

The current implementation includes:

* local Supabase auth with profile bootstrap
* dedicated create-group, join-group, invite, and user settings flows
* a top-navigation authenticated app shell with dashboard views for `Groups`, `Movie nights`, and `Upcoming`
* group detail pages with movie-night, member, and create-movie-night views
* movie-night detail pages with a leaderboard-style movie list and a separate details view
* TMDb search with posters plus server-side caching in `unstable_cache`, `movie_cache`, and `watch_provider_cache`
* ranked voting with up to 3 ordered picks worth 3, 2, and 1 points
* a vote modal for editing picks at any time while a movie night is in `draft` or `open`
* movie suggestion removal for the user who added the suggestion
* owner-only group deletion
* group and dashboard previews that surface the current top-voted movie plus upcoming schedule emphasis
* invite landing pages that route new or returning members into the app
* a shared domain package for permissions, validation, voting, and provider matching
* TMDb server utilities that normalize payloads and cache movie/provider data in Supabase
* baseline docs, ADRs, an initial Supabase schema, and test coverage

Implementation should continue in phases:

1. Movie-night status transitions and explicit winner selection
2. Subscription-aware provider matching surfaced directly in the movie-night UI
3. Comments, realtime updates, and broader authenticated e2e coverage
