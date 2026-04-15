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
* pnpm 10+
* Supabase CLI

### Install

```bash
pnpm install
```

### Configure Environment

```bash
cp .env.example .env.local
```

Required variables:

* `NEXT_PUBLIC_APP_URL`: browser-facing app URL
* `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL
* `NEXT_PUBLIC_SUPABASE_ANON_KEY`: public client key
* `SUPABASE_SERVICE_ROLE_KEY`: server-only privileged key
* `TMDB_API_KEY`: TMDb API key or bearer token

### Local Development

Start the database stack:

```bash
supabase start
supabase db reset
```

Run the app:

```bash
pnpm dev
```

Open `http://localhost:3000`.

## Commands

```bash
pnpm dev
pnpm build
pnpm lint
pnpm typecheck
pnpm test
pnpm e2e
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
