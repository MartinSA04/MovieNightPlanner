# Movie Night Planner Agents Guide

## Project Overview

Movie Night Planner is a pnpm workspace for a Next.js + Supabase app that helps groups plan movie nights, collect suggestions, vote, and surface region-aware streaming availability.

## Repo Layout

* `apps/web`: deployable Next.js App Router frontend
* `packages/domain`: framework-agnostic business logic, DTOs, validation, permissions, and provider matching
* `packages/ui`: shared UI primitives for the web app
* `packages/config`: shared TypeScript config and future shared tooling presets
* `docs`: product, architecture, database, and API reference docs
* `supabase`: local Supabase config, SQL migrations, and seed data
* `tests`: unit, integration, and e2e coverage

## Run And Verify

* Install: `corepack enable && corepack pnpm install`
* Start the app: `corepack pnpm dev`
* One-command local startup: `corepack pnpm local:dev`
* Lint: `corepack pnpm lint`
* Typecheck: `corepack pnpm typecheck`
* Unit tests: `corepack pnpm test`
* E2E tests: `corepack pnpm e2e`
* Local Supabase start: `corepack pnpm db:start`
* Local Supabase helper commands: `corepack pnpm local:up`, `local:status`, `local:reset`, `local:down`
* Local Supabase env sync: `corepack pnpm setup:local-env`
* Reset DB: `corepack pnpm db:reset`
* Stop local Supabase: `corepack pnpm db:stop`

## Coding Standards

* Keep domain logic in `packages/domain`, not inside React components.
* Use strict TypeScript and avoid `any`.
* Validate external inputs with Zod.
* Keep sensitive writes in trusted server-side code.
* Prefer small, composable modules and explicit names over clever abstractions.

## Secrets And Safety

* Never commit `.env`, `.env.*`, API keys, bearer tokens, service-role keys, SSH private keys, cookies, or exported credentials.
* Commit only placeholder files such as `.env.example`.
* Treat `NEXT_PUBLIC_*` values as client-visible and never place server-only secrets there.
* Do not print secret values into terminal output, docs, issues, PR text, screenshots, or chat responses. Summarize them without revealing the raw value.
* If a task requires checking env setup, confirm whether a variable exists and whether its format looks valid, but do not echo the full secret.
* Before any commit or push, review staged changes for accidental secret exposure, especially `.env` files, config files, seed data, and copied curl examples.
* If a secret is found in tracked files or history during work, stop, flag it immediately, and avoid copying it into any new location.

## Domain Rules

* One vote per user per event for the MVP.
* Prevent duplicate movie suggestions within the same event.
* Treat event or group region as the source of truth for provider matching.
* Only owner/admin flows should create or manage membership-sensitive resources.

## Done Criteria

* App builds.
* `pnpm lint`, `pnpm typecheck`, and relevant tests pass.
* Docs are updated with architecture or workflow changes.
* No secrets, tokens, or private credentials are staged, committed, or pasted into docs.
* No unrelated files are changed.

## Docs

* [README](README.md)
* [Architecture](docs/architecture.md)
* [Product Spec](docs/product-spec.md)
* [Database Schema](docs/database-schema.md)
* [API Contracts](docs/api-contracts.md)
