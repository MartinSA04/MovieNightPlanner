# API Contracts

## Principles

* all sensitive writes go through trusted server code
* every external input is validated with Zod
* expected failures should return typed, UI-friendly errors
* unexpected failures should be logged centrally

## Current Server Actions

### `createGroupAction`

Validates `name` and `countryCode`, creates the group, inserts the owner membership, revalidates the dashboard shell, and redirects to the new group page.

### `joinGroupByInviteAction`

Validates the invite code, joins the current user as a member when needed, revalidates dashboard data, and redirects to the target group with a notice.

### `createEventAction`

Validates the movie-night form, checks owner/admin permissions, creates the movie night, revalidates related pages, and redirects to `/events/:id?view=suggestions`.

### `updateUserSettingsAction`

Validates `countryCode` and selected provider ids, replaces `user_streaming_services`, updates `profiles.country_code`, best-effort syncs auth metadata, and redirects back to settings.

## Current Route Handlers

### `GET /api/tmdb/search`

Auth required. Accepts:

* `query`: 2 to 100 chars
* `page`: 1 to 5
* `regionCode`: optional 2-letter code

Returns normalized TMDb search results, including region-specific watch-provider data when `regionCode` is present.

### `GET /api/settings/providers`

Auth required. Accepts `countryCode` and returns the available streaming-service catalog for the settings page. When TMDb is configured, the provider catalog is refreshed and synced into `streaming_services` before returning.

### `POST /api/events/:eventId/suggestions`

Auth required. Accepts:

```ts
{
  tmdbMovieId: number;
  note?: string;
}
```

Adds a movie suggestion for the current user while the movie night is in `draft` or `open`.

Responses:

* `201` with `{ status: "added", suggestion }`
* `200` with `{ status: "already-exists", suggestion }`
* `400` with `{ error: string }`

### `DELETE /api/events/:eventId/suggestions/:suggestionId`

Auth required. Removes a suggestion only when:

* the current user is a member of the group
* the movie night is still `draft` or `open`
* the suggestion was added by the current user

Returns `{ status: "removed" }` or `{ error: string }`.

### `PUT /api/events/:eventId/votes`

Auth required. Accepts:

```ts
{
  suggestionIds: string[]; // ordered 1st through 3rd, max 3
}
```

Replaces the current user's vote set for the movie night. Empty arrays are allowed and clear the user's picks.

Returns:

```ts
{
  status: "updated";
  voteCount: number;
}
```

### `DELETE /api/groups/:groupId`

Auth required. Deletes a group only when the current user is the owner. Group deletion cascades to memberships, movie nights, suggestions, and votes through foreign keys.

Returns `{ status: "deleted" }` or `{ error: string }`.

## Deferred Endpoints

The following behaviors are still product-level goals but do not have live endpoints yet:

* updating group metadata
* explicit movie-night status transitions
* winner selection persistence
* comments

## Error Shape

Most current route handlers return a minimal JSON error shape:

```ts
type RouteError = {
  error: string;
};
```

## Response Guidance

* return normalized domain objects, not raw DB rows when avoidable
* keep route-level responses small and UI-oriented
* revalidate affected dashboard, group, and movie-night paths after writes
* do not expose service-role operations to the client
