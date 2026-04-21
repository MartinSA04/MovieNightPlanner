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

## UI Structure

* Public pages use a shared `AppShell`.
* Authenticated pages use a shared top-header shell and dashboard-level navigation.
* Shared semantic tokens live in `apps/web/app/globals.css` and `apps/web/tailwind.config.ts`.
* Reusable UI primitives live in `packages/ui`.
* Group and movie-night pages use a single dominant panel with attached section tabs instead of multiple equal-weight cards.

## Shared Domain Areas

* voting rules
* provider matching and normalization
* permissions helpers
* DTOs
* Zod schemas for external inputs

## Runtime Flow

1. Server components load authenticated page data directly from trusted server modules.
2. Form-style mutations go through server actions and redirect to the next stable page.
3. Interactive mutations such as vote updates, suggestion add/remove, and provider lookup go through route handlers.
4. Route handlers and server actions validate input with Zod-backed schemas from `packages/domain`.
5. Trusted server code checks membership and permissions before writing.
6. Revalidation keeps dashboard, group, and movie-night views in sync after writes.

## TMDb Caching

* Search responses are memoized with Next `unstable_cache`.
* Normalized movie details are persisted in `movie_cache`.
* Region-specific provider availability is persisted in `watch_provider_cache`.
* Streaming-service catalogs are synced into `streaming_services` for settings selection.

## Testing Strategy

* unit tests for pure domain rules
* integration tests for server and database boundaries
* e2e tests for group, movie-night, suggestion, and vote flows
