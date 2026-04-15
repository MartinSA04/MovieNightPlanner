# API Contracts

## Principles

* all sensitive writes go through trusted server code
* every external input is validated with Zod
* expected failures should return typed, UI-friendly errors
* unexpected failures should be logged centrally

## Planned Server Actions

### `createGroup`

Creates a group, assigns the owner, and creates the initial membership row.

### `joinGroupByInvite`

Accepts an invite code and adds the current user to the target group.

### `updateGroup`

Updates group metadata for owner/admin roles.

### `createEvent`

Creates a movie night event for an authorized group.

### `updateEventStatus`

Transitions event state between draft, open, locked, completed, and cancelled.

### `searchMovies`

Calls TMDb server-side, validates query input, and returns normalized search results.

### `addSuggestion`

Adds a TMDb movie suggestion to an event while preventing duplicates.

### `castVote`

Creates or replaces the current user's vote while the event is open.

### `removeVote`

Clears the current user's vote while the event is open.

### `selectWinner`

Persists the winning suggestion on a locked or completed event.

### `updateUserStreamingServices`

Replaces the current user's selected streaming services.

## Error Shape

Suggested application error contract:

```ts
type AppActionError = {
  code: string;
  message: string;
  fieldErrors?: Record<string, string[]>;
};
```

## Response Guidance

* return normalized domain objects, not raw DB rows when avoidable
* keep provider matching as a dedicated result object
* do not expose service-role operations to the client

