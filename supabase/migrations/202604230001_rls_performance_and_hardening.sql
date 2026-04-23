-- Pin search_path for the updated_at trigger function.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

-- Enable RLS on cache tables. They are only accessed via the service-role
-- admin client, which bypasses RLS, so no policies are needed.
alter table public.streaming_services enable row level security;
alter table public.movie_cache enable row level security;
alter table public.watch_provider_cache enable row level security;

-- profiles: wrap auth.uid() in (select ...) to evaluate once per statement.
drop policy if exists "profiles_select_self" on public.profiles;
drop policy if exists "profiles_insert_self" on public.profiles;
drop policy if exists "profiles_update_self" on public.profiles;

create policy "profiles_select_self"
on public.profiles
for select
using ((select auth.uid()) = id);

create policy "profiles_insert_self"
on public.profiles
for insert
with check ((select auth.uid()) = id);

create policy "profiles_update_self"
on public.profiles
for update
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

-- groups
drop policy if exists "groups_read_for_members" on public.groups;
drop policy if exists "groups_insert_for_owner" on public.groups;
drop policy if exists "groups_update_for_managers" on public.groups;

create policy "groups_read_for_members"
on public.groups
for select
using (public.is_group_member(id) or owner_user_id = (select auth.uid()));

create policy "groups_insert_for_owner"
on public.groups
for insert
with check (owner_user_id = (select auth.uid()));

create policy "groups_update_for_managers"
on public.groups
for update
using (public.is_group_manager(id) or owner_user_id = (select auth.uid()))
with check (public.is_group_manager(id) or owner_user_id = (select auth.uid()));

-- group_members: split FOR ALL into explicit commands so SELECT is not duplicated.
drop policy if exists "group_members_write_for_managers" on public.group_members;

create policy "group_members_insert_for_managers"
on public.group_members
for insert
with check (public.is_group_manager(group_id));

create policy "group_members_update_for_managers"
on public.group_members
for update
using (public.is_group_manager(group_id))
with check (public.is_group_manager(group_id));

create policy "group_members_delete_for_managers"
on public.group_members
for delete
using (public.is_group_manager(group_id));

-- user_streaming_services: split FOR ALL and use (select auth.uid()).
drop policy if exists "subscriptions_self_access" on public.user_streaming_services;

create policy "subscriptions_select_self"
on public.user_streaming_services
for select
using ((select auth.uid()) = user_id);

create policy "subscriptions_insert_self"
on public.user_streaming_services
for insert
with check ((select auth.uid()) = user_id);

create policy "subscriptions_update_self"
on public.user_streaming_services
for update
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "subscriptions_delete_self"
on public.user_streaming_services
for delete
using ((select auth.uid()) = user_id);

-- movie_night_events: split FOR ALL.
drop policy if exists "events_write_for_managers" on public.movie_night_events;

create policy "events_insert_for_managers"
on public.movie_night_events
for insert
with check (public.is_group_manager(group_id));

create policy "events_update_for_managers"
on public.movie_night_events
for update
using (public.is_group_manager(group_id))
with check (public.is_group_manager(group_id));

create policy "events_delete_for_managers"
on public.movie_night_events
for delete
using (public.is_group_manager(group_id));

-- votes: split FOR ALL and use (select auth.uid()).
drop policy if exists "votes_write_for_members" on public.votes;

create policy "votes_insert_for_members"
on public.votes
for insert
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1
    from public.movie_night_events event
    where event.id = event_id
      and event.status in ('draft', 'open')
      and public.is_group_member(event.group_id)
  )
);

create policy "votes_update_for_members"
on public.votes
for update
using (
  (select auth.uid()) = user_id
  and exists (
    select 1
    from public.movie_night_events event
    where event.id = event_id
      and event.status in ('draft', 'open')
      and public.is_group_member(event.group_id)
  )
)
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1
    from public.movie_night_events event
    where event.id = event_id
      and event.status in ('draft', 'open')
      and public.is_group_member(event.group_id)
  )
);

create policy "votes_delete_for_members"
on public.votes
for delete
using (
  (select auth.uid()) = user_id
  and exists (
    select 1
    from public.movie_night_events event
    where event.id = event_id
      and event.status in ('draft', 'open')
      and public.is_group_member(event.group_id)
  )
);

-- comments: split FOR ALL and use (select auth.uid()).
drop policy if exists "comments_write_for_members" on public.comments;

create policy "comments_insert_for_members"
on public.comments
for insert
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1
    from public.movie_night_events event
    where event.id = event_id
      and public.is_group_member(event.group_id)
  )
);

create policy "comments_update_for_members"
on public.comments
for update
using (
  (select auth.uid()) = user_id
  and exists (
    select 1
    from public.movie_night_events event
    where event.id = event_id
      and public.is_group_member(event.group_id)
  )
)
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1
    from public.movie_night_events event
    where event.id = event_id
      and public.is_group_member(event.group_id)
  )
);

create policy "comments_delete_for_members"
on public.comments
for delete
using (
  (select auth.uid()) = user_id
  and exists (
    select 1
    from public.movie_night_events event
    where event.id = event_id
      and public.is_group_member(event.group_id)
  )
);
