# Database Schema

## Core Tables

### `profiles`

User profile data keyed by Supabase auth user id.

### `streaming_services`

Known watch providers mapped to TMDb provider ids. This table is refreshed from TMDb for the settings flow and referenced by `user_streaming_services`.

### `user_streaming_services`

Join table for user subscriptions with unique `(user_id, streaming_service_id)`.

### `groups`

Persistent social units with an owner, invite code, and default country. Deleting a group cascades through memberships and movie-night data.

### `group_members`

Membership table with roles `owner`, `admin`, and `member`. Unique `(group_id, user_id)`.

### `movie_night_events`

Movie-night records with region, lifecycle status, and optional winning suggestion. `winning_suggestion_id` exists in the schema but explicit winner selection is not yet surfaced in the UI.

### `movie_suggestions`

Suggestions tied to a movie night. Unique `(event_id, tmdb_movie_id)` prevents duplicate movies within the same movie night.

### `votes`

Ranked picks tied to a movie night. One row is stored per ranked choice, with:

* unique `(event_id, user_id, choice_rank)`
* unique `(event_id, user_id, suggestion_id)`

This allows a user to save up to 3 different ordered picks.

### `comments`

Lightweight movie-night discussion entries. Present in the schema but not yet exposed in the current UI.

### `movie_cache`

Normalized movie metadata from TMDb.

### `watch_provider_cache`

Region-specific provider data keyed by movie id and country code.

## Conventions

* snake_case for tables and columns
* UUID primary keys for app-owned entities
* explicit foreign keys
* timestamp columns on user-facing tables
* JSONB for cached external payload fragments

## Permission Expectations

RLS should deny by default. Policies should be based on:

* authenticated user ownership for profiles and subscriptions
* group membership for reads
* owner/admin role checks for group and movie-night management
* draft or open movie-night state for suggestions and votes

Membership helper functions used inside RLS policies should run as `security definer` so
group-based checks do not recurse back into `group_members` policy evaluation.

## Cache Strategy

* keep raw TMDb payload fragments for debugging
* store normalized movie data in `movie_cache`
* store region-specific provider data in `watch_provider_cache`
* refresh watch-provider entries periodically
* sync provider catalogs into `streaming_services` for the settings UI
