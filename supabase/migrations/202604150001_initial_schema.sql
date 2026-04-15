create extension if not exists pgcrypto;

create type public.group_member_role as enum ('owner', 'admin', 'member');
create type public.event_status as enum ('draft', 'open', 'locked', 'completed', 'cancelled');
create type public.provider_type as enum ('flatrate', 'rent', 'buy', 'free', 'ads');

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null,
  email text not null unique,
  avatar_url text,
  country_code text not null check (char_length(country_code) = 2),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.streaming_services (
  id uuid primary key default gen_random_uuid(),
  tmdb_provider_id integer not null unique,
  name text not null,
  logo_path text,
  provider_type public.provider_type not null default 'flatrate',
  created_at timestamptz not null default timezone('utc', now())
);

create table public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_user_id uuid not null references public.profiles (id) on delete restrict,
  country_code text not null check (char_length(country_code) = 2),
  invite_code text not null unique,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.group_members (
  group_id uuid not null references public.groups (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role public.group_member_role not null default 'member',
  joined_at timestamptz not null default timezone('utc', now()),
  primary key (group_id, user_id)
);

create table public.user_streaming_services (
  user_id uuid not null references public.profiles (id) on delete cascade,
  streaming_service_id uuid not null references public.streaming_services (id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (user_id, streaming_service_id)
);

create table public.movie_night_events (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups (id) on delete cascade,
  title text not null,
  description text,
  scheduled_for timestamptz,
  status public.event_status not null default 'draft',
  region_code text not null check (char_length(region_code) = 2),
  created_by_user_id uuid not null references public.profiles (id) on delete restrict,
  winning_suggestion_id uuid,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.movie_suggestions (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.movie_night_events (id) on delete cascade,
  suggested_by_user_id uuid not null references public.profiles (id) on delete restrict,
  tmdb_movie_id bigint not null,
  note text,
  created_at timestamptz not null default timezone('utc', now()),
  unique (event_id, tmdb_movie_id)
);

create table public.votes (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.movie_night_events (id) on delete cascade,
  suggestion_id uuid not null references public.movie_suggestions (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  unique (event_id, user_id)
);

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.movie_night_events (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.movie_cache (
  tmdb_movie_id bigint primary key,
  title text not null,
  original_title text,
  overview text,
  poster_path text,
  backdrop_path text,
  release_date date,
  runtime integer,
  genres_json jsonb not null default '[]'::jsonb,
  language_code text,
  raw_payload_json jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.watch_provider_cache (
  tmdb_movie_id bigint not null,
  region_code text not null check (char_length(region_code) = 2),
  flatrate_json jsonb not null default '[]'::jsonb,
  rent_json jsonb not null default '[]'::jsonb,
  buy_json jsonb not null default '[]'::jsonb,
  raw_payload_json jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (tmdb_movie_id, region_code)
);

alter table public.movie_night_events
  add constraint movie_night_events_winning_suggestion_id_fkey
  foreign key (winning_suggestion_id)
  references public.movie_suggestions (id)
  on delete set null;

create or replace function public.is_group_member(target_group_id uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.group_members gm
    where gm.group_id = target_group_id
      and gm.user_id = auth.uid()
  );
$$;

create or replace function public.is_group_manager(target_group_id uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.group_members gm
    where gm.group_id = target_group_id
      and gm.user_id = auth.uid()
      and gm.role in ('owner', 'admin')
  );
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger groups_set_updated_at
before update on public.groups
for each row execute function public.set_updated_at();

create trigger movie_night_events_set_updated_at
before update on public.movie_night_events
for each row execute function public.set_updated_at();

create trigger comments_set_updated_at
before update on public.comments
for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.user_streaming_services enable row level security;
alter table public.movie_night_events enable row level security;
alter table public.movie_suggestions enable row level security;
alter table public.votes enable row level security;
alter table public.comments enable row level security;

create policy "profiles_select_self"
on public.profiles
for select
using (auth.uid() = id);

create policy "profiles_insert_self"
on public.profiles
for insert
with check (auth.uid() = id);

create policy "profiles_update_self"
on public.profiles
for update
using (auth.uid() = id)
with check (auth.uid() = id);

create policy "groups_read_for_members"
on public.groups
for select
using (public.is_group_member(id) or owner_user_id = auth.uid());

create policy "groups_insert_for_owner"
on public.groups
for insert
with check (owner_user_id = auth.uid());

create policy "groups_update_for_managers"
on public.groups
for update
using (public.is_group_manager(id) or owner_user_id = auth.uid())
with check (public.is_group_manager(id) or owner_user_id = auth.uid());

create policy "group_members_read_for_members"
on public.group_members
for select
using (public.is_group_member(group_id));

create policy "group_members_write_for_managers"
on public.group_members
for all
using (public.is_group_manager(group_id))
with check (public.is_group_manager(group_id));

create policy "subscriptions_self_access"
on public.user_streaming_services
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "events_read_for_members"
on public.movie_night_events
for select
using (public.is_group_member(group_id));

create policy "events_write_for_managers"
on public.movie_night_events
for all
using (public.is_group_manager(group_id))
with check (public.is_group_manager(group_id));

create policy "suggestions_read_for_members"
on public.movie_suggestions
for select
using (
  exists (
    select 1
    from public.movie_night_events event
    where event.id = event_id
      and public.is_group_member(event.group_id)
  )
);

create policy "suggestions_insert_for_members"
on public.movie_suggestions
for insert
with check (
  exists (
    select 1
    from public.movie_night_events event
    where event.id = event_id
      and event.status = 'open'
      and public.is_group_member(event.group_id)
  )
);

create policy "votes_read_for_members"
on public.votes
for select
using (
  exists (
    select 1
    from public.movie_night_events event
    where event.id = event_id
      and public.is_group_member(event.group_id)
  )
);

create policy "votes_write_for_members"
on public.votes
for all
using (
  auth.uid() = user_id
  and exists (
    select 1
    from public.movie_night_events event
    where event.id = event_id
      and event.status = 'open'
      and public.is_group_member(event.group_id)
  )
)
with check (
  auth.uid() = user_id
  and exists (
    select 1
    from public.movie_night_events event
    where event.id = event_id
      and event.status = 'open'
      and public.is_group_member(event.group_id)
  )
);

create policy "comments_read_for_members"
on public.comments
for select
using (
  exists (
    select 1
    from public.movie_night_events event
    where event.id = event_id
      and public.is_group_member(event.group_id)
  )
);

create policy "comments_write_for_members"
on public.comments
for all
using (
  auth.uid() = user_id
  and exists (
    select 1
    from public.movie_night_events event
    where event.id = event_id
      and public.is_group_member(event.group_id)
  )
)
with check (
  auth.uid() = user_id
  and exists (
    select 1
    from public.movie_night_events event
    where event.id = event_id
      and public.is_group_member(event.group_id)
  )
);

