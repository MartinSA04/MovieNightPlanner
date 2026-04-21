alter table public.votes
  add column if not exists rank smallint;

update public.votes
set rank = 1
where rank is null;

alter table public.votes
  alter column rank set not null;

alter table public.votes
  drop constraint if exists votes_rank_check;

alter table public.votes
  add constraint votes_rank_check
  check (rank between 1 and 3);

alter table public.votes
  drop constraint if exists votes_event_id_user_id_key;

alter table public.votes
  drop constraint if exists votes_event_id_user_id_rank_key;

alter table public.votes
  add constraint votes_event_id_user_id_rank_key
  unique (event_id, user_id, rank);

alter table public.votes
  drop constraint if exists votes_event_id_user_id_suggestion_id_key;

alter table public.votes
  add constraint votes_event_id_user_id_suggestion_id_key
  unique (event_id, user_id, suggestion_id);

drop policy if exists "suggestions_insert_for_members"
on public.movie_suggestions;

create policy "suggestions_insert_for_members"
on public.movie_suggestions
for insert
with check (
  exists (
    select 1
    from public.movie_night_events event
    where event.id = event_id
      and event.status in ('draft', 'open')
      and public.is_group_member(event.group_id)
  )
);

drop policy if exists "votes_write_for_members"
on public.votes;

create policy "votes_write_for_members"
on public.votes
for all
using (
  auth.uid() = user_id
  and exists (
    select 1
    from public.movie_night_events event
    where event.id = event_id
      and event.status in ('draft', 'open')
      and public.is_group_member(event.group_id)
  )
)
with check (
  auth.uid() = user_id
  and exists (
    select 1
    from public.movie_night_events event
    where event.id = event_id
      and event.status in ('draft', 'open')
      and public.is_group_member(event.group_id)
  )
);
