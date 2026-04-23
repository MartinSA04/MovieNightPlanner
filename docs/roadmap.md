# Roadmap

Forward-looking plan beyond the current MVP. Phases are ordered by dependency and user impact, not by calendar. Each item lists a short *why* and the concrete surfaces it touches so estimation and scoping stay honest.

Out of scope for the roadmap (matches `product-spec.md`): native mobile app, social feed, AI recommendations, monetization, heavy analytics, full chat product.

## Phase 0 — Finish deferred MVP work

These are the three items already flagged in `product-spec.md`. Everything else depends on this foundation being stable.

1. **Explicit winner selection and movie-night lock flow**
   - Why: votes produce a leader but nothing currently marks an event as "this is what we're watching." Locking the winner freezes the state and enables downstream features (history, ratings, re-suggestion prevention).
   - Surfaces: `movie_night_events.winning_suggestion_id` already exists; needs UI on the event detail page (owner/admin action), status transitions `open → locked → completed`, and a server action guarded by permissions.

2. **Subscription-aware provider matching in the leaderboard**
   - Why: users already record their streaming services, but the movie-night view doesn't tell them "3 of 4 members can stream this." That's the key decision input.
   - Surfaces: new server query that joins `user_streaming_services`, `watch_provider_cache`, and suggestions; badge on each leaderboard row; group-level "combined coverage" chip.

3. **Comments + realtime updates**
   - Why: decisions happen in chat; pulling the conversation in-app makes the event the source of truth. Realtime makes voting feel collaborative.
   - Surfaces: `comments` table already exists; add an inline thread under the suggestions list. Wire Supabase realtime channels for votes, suggestions, and comments; invalidate React Query / `router.refresh` on events.

## Phase 1 — Per-user personal layer

The app is currently 100% group-scoped. Adding a private layer makes it useful even when no movie night is planned.

1. **Private "to-watch" list**
   - Why: the one feature you asked for. Users browse TMDb freely and add to their own shelf; they can later push items from the shelf into a group suggestion with one click.
   - Data: new table `user_watchlist (user_id, tmdb_movie_id, added_at, note)` with RLS `user_id = auth.uid()`.
   - UI: new `/watchlist` route, add-to-watchlist action on TMDb search results and any suggestion row, "add from my list" shortcut inside the create-suggestion flow.

2. **Seen / already-watched list**
   - Why: prevents repeat suggestions ("we watched this last month") and powers a user's personal history view.
   - Data: `user_watched (user_id, tmdb_movie_id, watched_at, rating, source: group|solo, event_id?)`. Auto-populate when a user attends a locked event (Phase 0 item 1).
   - UI: subtle "Seen" badge on TMDb search hits for the current user; toggle on each movie detail; filter on the watchlist view.

3. **Group-level watch history**
   - Why: "has the group watched this together before?" is a common question. Surfaces as a warning when a suggestion duplicates a past winner.
   - Data: derived from completed events; no new table. Query + indexed lookup by `(group_id, tmdb_movie_id)`.
   - UI: badge on search results inside a group suggestion flow.

4. **Avatar upload**
   - Why: the profile menu currently only shows initials. Tiny visual polish that makes groups feel more like a room of people.
   - Data: Supabase Storage bucket `avatars`, `profiles.avatar_url` already exists.
   - UI: upload control in settings; respects 1–2 MB cap.

5. **Account-lifecycle flows**
   - Why: reset + delete are table-stakes for a product people will trust with their email.
   - Scope: password reset email, magic-link login, "delete account" (with owner-reassignment prompt), basic GDPR-style "export my data" JSON download.

## Phase 2 — Smart discovery

Reduce the friction in "we have six tabs open and still can't pick."

1. **Search filters**
   - Genre, release year, runtime range, language, content rating, minimum TMDb score.
   - Surfaces: extend the TMDb search panel; persist last-used filters per user.

2. **"Only what we can stream" toggle**
   - Why: closes the loop between subscription settings and suggestion browsing.
   - Surfaces: toggle on the TMDb search panel inside a movie-night flow; uses the combined group coverage from Phase 0 item 2.

3. **Availability badges per suggestion**
   - Surfaces: suggestion row shows per-member coverage dots (e.g. "4/5 can stream").

4. **Tiebreaker / random pick**
   - Why: ranked votes can tie. Instead of arguing, let the app pick one with a visible "rolling" animation from the tied set.
   - Surfaces: server-side deterministic tiebreak (with seeded randomness logged), UI wheel on the leaderboard when the top has a tie at lock time.

5. **Trending / popular in region quick pick**
   - Surfaces: one-tap card on the empty suggestion list.

## Phase 3 — Richer movie-night lifecycle

Once a night completes, stop losing all the state.

1. **Scheduling quality**
   - Timezone-aware stored `scheduled_for` (already `timestamptz`; UI needs to display in user's tz consistently).
   - iCal export per event; Google/Outlook calendar deep links.
   - Optional: member availability hints ("2 members have a conflict then").

2. **Post-movie ratings**
   - Why: the most natural moment to rate a movie is right after watching. Ratings feed personal taste signals and "did your group like it" stats.
   - Data: `event_ratings (event_id, user_id, rating smallint, comment text, created_at)`.
   - UI: prompt after a completed event; optional rewatch toggle.

3. **Event recap / shareable summary**
   - Why: closes the loop emotionally and gives a low-friction re-engagement hook.
   - Surfaces: read-only `/events/{id}/recap` page (public for the group, not internet-public) with winner, attendees, ratings, leaderboard final standings.

## Phase 4 — Trust, quality, ops

What separates a demo from a tool people return to weekly.

1. **Realtime + resilience**
   - Supabase realtime subscriptions for votes, suggestions, comments, status transitions.
   - Error boundaries at the route-handler and page level; user-facing toasts for transient failures.
   - Offline-tolerant reads (cached last-good state) on dashboard and event pages.

2. **Abuse / rate limiting**
   - Rate-limit `/api/events/*/vote`, `/api/events/*/suggestions`, and `/api/groups/*/members` writes per user.
   - Cap suggestion count per event (configurable, default 20) to keep leaderboard legible.

3. **Accessibility pass**
   - Keyboard traversal across the dashboard, group, event, and settings pages.
   - `aria-*` on the profile menu, the create-movie-night dialog, and the vote modal.
   - Color contrast audit against the light palette (new) and dark palette.

4. **Performance**
   - Virtualize long member lists and long group/event lists past a threshold.
   - Move TMDb image sizing hints to a central helper so `next/image` requests stay right-sized.
   - Request-level `cache-control` on read-only route handlers where appropriate.

5. **Telemetry**
   - Privacy-respecting analytics (self-hosted Plausible or similar): page views, core-flow completions (create group, lock event, cast vote). No PII, no session replay.
   - Structured server logs with request IDs; surface them in local dev too.

6. **Tests**
   - E2E: sign up → create group → invite → accept → create event → add suggestion → vote → lock → recap.
   - Integration tests for every server action that mutates membership or event state.
   - Contract tests for TMDb normalization given shape drift.

## Cross-cutting prerequisites

Small items worth landing early because later phases depend on them.

* **Notification primitive.** Event reminders, new-suggestion pings, vote-locked notifications all need the same underlying in-app notifications table + email dispatcher. Build once in Phase 1, reuse.
* **Background jobs.** Email reminders, cache warming, and post-movie rating prompts need a scheduled mechanism (Supabase cron or a tiny edge function on a schedule).
* **Feature flags.** As the surface grows, per-group feature flags (e.g. "comments enabled") keep rollout reversible without deploys.

## Explicit non-goals (re-stated for continuity)

* **AI/LLM recommendations.** Useful but orthogonal to the "help us stop arguing" core. Revisit after Phase 3 once we have ratings + group history to feed it.
* **Native mobile app.** PWA-level polish first; measure demand before investing.
* **Social feed / discover across strangers.** Explicit in product spec. The product is small-group, not public.
