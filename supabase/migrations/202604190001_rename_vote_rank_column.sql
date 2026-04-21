do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'votes'
      and column_name = 'rank'
  ) then
    alter table public.votes
      rename column rank to choice_rank;
  end if;
end
$$;
