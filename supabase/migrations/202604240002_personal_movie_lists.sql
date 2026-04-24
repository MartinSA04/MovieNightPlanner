-- Personal movie lists: a private watchlist and a watched history.

create table public.user_watchlist (
  user_id uuid not null references public.profiles (id) on delete cascade,
  tmdb_movie_id bigint not null,
  note text,
  added_at timestamptz not null default timezone('utc', now()),
  primary key (user_id, tmdb_movie_id)
);

alter table public.user_watchlist enable row level security;

create policy "user_watchlist_select_self"
on public.user_watchlist for select
using ((select auth.uid()) = user_id);

create policy "user_watchlist_insert_self"
on public.user_watchlist for insert
with check ((select auth.uid()) = user_id);

create policy "user_watchlist_update_self"
on public.user_watchlist for update
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "user_watchlist_delete_self"
on public.user_watchlist for delete
using ((select auth.uid()) = user_id);

create index user_watchlist_added_at_idx on public.user_watchlist(user_id, added_at desc);

create table public.user_watched (
  user_id uuid not null references public.profiles (id) on delete cascade,
  tmdb_movie_id bigint not null,
  event_id uuid references public.movie_night_events (id) on delete set null,
  rating smallint check (rating is null or (rating between 1 and 5)),
  note text,
  watched_at timestamptz not null default timezone('utc', now()),
  primary key (user_id, tmdb_movie_id)
);

alter table public.user_watched enable row level security;

create policy "user_watched_select_self"
on public.user_watched for select
using ((select auth.uid()) = user_id);

create policy "user_watched_insert_self"
on public.user_watched for insert
with check ((select auth.uid()) = user_id);

create policy "user_watched_update_self"
on public.user_watched for update
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "user_watched_delete_self"
on public.user_watched for delete
using ((select auth.uid()) = user_id);

create index user_watched_event_idx on public.user_watched(event_id) where event_id is not null;
create index user_watched_movie_idx on public.user_watched(tmdb_movie_id);
