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

* Install: `pnpm install`
* Start the app: `pnpm dev`
* Lint: `pnpm lint`
* Typecheck: `pnpm typecheck`
* Unit tests: `pnpm test`
* E2E tests: `pnpm e2e`
* Local Supabase: `supabase start`
* Reset DB: `supabase db reset`

## Coding Standards

* Keep domain logic in `packages/domain`, not inside React components.
* Use strict TypeScript and avoid `any`.
* Validate external inputs with Zod.
* Keep sensitive writes in trusted server-side code.
* Prefer small, composable modules and explicit names over clever abstractions.

## Domain Rules

* One vote per user per event for the MVP.
* Prevent duplicate movie suggestions within the same event.
* Treat event or group region as the source of truth for provider matching.
* Only owner/admin flows should create or manage membership-sensitive resources.

## Done Criteria

* App builds.
* `pnpm lint`, `pnpm typecheck`, and relevant tests pass.
* Docs are updated with architecture or workflow changes.
* No unrelated files are changed.

## Docs

* [README](README.md)
* [Architecture](docs/architecture.md)
* [Product Spec](docs/product-spec.md)
* [Database Schema](docs/database-schema.md)
* [API Contracts](docs/api-contracts.md)

