# ADR 0002: Ranked Voting With 3-2-1 Scoring

## Status

Accepted

## Context

The product needs a lightweight group decision mechanism that is more expressive than a single
pick, but still simple enough to explain and edit quickly in the UI.

## Decision

Use ranked voting with up to 3 ordered picks per user:

* 1st pick = 3 points
* 2nd pick = 2 points
* 3rd pick = 1 point

Persist votes as one row per ranked pick in `votes`, keyed by `(event_id, user_id, choice_rank)`.

Tie-breaking is deterministic and favors:

1. higher total points
2. more 1st-place votes
3. more 2nd-place votes
4. more 3rd-place votes
5. earlier suggestion creation time
6. title sort as final fallback

## Consequences

Positive:

* users can express preference order without a complex ballot model
* the leaderboard can be derived directly from stored vote rows
* users can change their picks without special merge logic

Tradeoffs:

* winner selection is still a separate concern and is not yet persisted
* server and UI code must preserve ordered ranks and reject duplicate picks
* the database model is slightly more complex than a single-vote-per-user table
