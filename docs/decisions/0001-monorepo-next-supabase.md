# ADR 0001: Monorepo With Next.js And Supabase

## Status

Accepted

## Context

The product needs a low-ops stack, fast iteration, strong TypeScript ergonomics, and a clean place for reusable domain logic that can later support a mobile client.

## Decision

Use a pnpm workspace with:

* `apps/web` for the Next.js frontend
* `packages/domain` for shared business logic
* Supabase for Auth and Postgres
* TMDb as the external movie metadata source

## Consequences

Positive:

* one TypeScript-first codebase
* easier reuse of DTOs, validation, and permissions logic
* simple deployment path for the web app
* lower operational burden than a separate backend service

Tradeoffs:

* disciplined boundaries are required to keep domain logic framework-agnostic
* RLS and server-action authorization both need deliberate design
* external API caching becomes part of app architecture early

