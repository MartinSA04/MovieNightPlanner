# Architecture

## Stack

* Next.js App Router for the web application
* TypeScript with strict mode across the workspace
* Tailwind CSS for styling
* Supabase for Auth, Postgres, and RLS-backed data access
* TMDb for movie search and watch-provider data
* Zod for input validation

## Monorepo Shape

* `apps/web` holds the deployable web app
* `packages/domain` holds framework-agnostic business logic
* `packages/ui` holds reusable UI primitives
* `packages/config` holds shared configuration
* `supabase` holds local config, migrations, and seed data

## Boundary Rules

* Domain rules live in `packages/domain`.
* React components should stay presentational whenever possible.
* Membership-sensitive writes must run through trusted server-side code.
* TMDb payloads should be normalized before broad UI use.
* Docs should be updated in the same change that alters architecture or workflow.

## Shared Domain Areas

* voting rules
* provider matching and normalization
* permissions helpers
* DTOs
* Zod schemas for external inputs

## Data Flow

1. Client reads authenticated state and cached queries.
2. Server actions or route handlers validate input with Zod.
3. Trusted server code checks membership and permissions.
4. Supabase stores canonical application state.
5. TMDb results are fetched server-side and cached in dedicated tables.
6. UI renders normalized data and provider badge states.

## Testing Strategy

* unit tests for pure domain rules
* integration tests for server and database boundaries
* e2e tests for group, event, suggestion, and vote flows

