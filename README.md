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

The scaffold includes:

* a Next.js app shell
* a shared domain package for voting, permissions, and provider matching
* baseline docs and ADRs
* an initial Supabase schema and seed file
* unit and e2e testing entry points

Implementation should continue in phases:

1. Auth, profiles, groups, and subscriptions
2. Events, suggestions, and voting
3. Provider matching badges and winner selection
4. Invites, comments, realtime, and broader e2e coverage
