# Movie Night Planner

Movie Night Planner is a collaborative planning app for small groups that want to stop arguing about what to watch. The project is organized as a pnpm workspace with a Next.js web app, shared TypeScript domain logic, and Supabase-backed data/auth infrastructure.

## Stack

* Next.js App Router
* TypeScript
* Tailwind CSS
* Supabase
* TMDb API
* Zod
* TanStack Query
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
* dedicated group creation and invite-join pages, plus a dedicated user settings page for country and streaming preferences
* a dark-mode app shell with collapsible sidebar navigation for settings, group actions, and group navigation
* group detail pages with separate events, members, and create-event views
* event detail pages with dedicated TMDb suggestion search screens and add-to-event suggestions
* invite landing pages that route new or returning members into the app
* a shared domain package for permissions, validation, voting, and provider matching
* TMDb server utilities that normalize payloads and cache movie/provider data in Supabase
* baseline docs, ADRs, an initial Supabase schema, and test coverage

Implementation should continue in phases:

1. Vote casting, event status transitions, and winner selection
2. Provider matching badges against group subscriptions
3. Comments, realtime updates, and broader authenticated e2e coverage
