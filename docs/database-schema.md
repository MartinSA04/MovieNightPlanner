# Database Schema

## Core Tables

### `profiles`

User profile data keyed by Supabase auth user id.

### `streaming_services`

Known watch providers mapped to TMDb provider ids.

### `user_streaming_services`

Join table for user subscriptions with unique `(user_id, streaming_service_id)`.

### `groups`

Persistent social units with an owner, invite code, and default country.

### `group_members`

Membership table with roles `owner`, `admin`, and `member`. Unique `(group_id, user_id)`.

### `movie_night_events`

Event records with region, lifecycle status, and optional winning suggestion.

### `movie_suggestions`

Suggestions tied to an event. Unique `(event_id, tmdb_movie_id)` to prevent duplicates.

### `votes`

One vote per user per event via unique `(event_id, user_id)`.

### `comments`

Lightweight event discussion entries.

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
* owner/admin role checks for group and event management
* open event state for suggestions and votes

## Cache Strategy

* keep raw TMDb payload fragments for debugging
* store normalized provider subsets for app use
* refresh watch-provider entries periodically

