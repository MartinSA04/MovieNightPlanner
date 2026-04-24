-- Enable Supabase realtime for event-scoped tables so the client can
-- subscribe to INSERT/UPDATE/DELETE on this event's rows.
alter publication supabase_realtime add table public.movie_night_events;
alter publication supabase_realtime add table public.movie_suggestions;
alter publication supabase_realtime add table public.votes;
alter publication supabase_realtime add table public.comments;
