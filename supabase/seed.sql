insert into public.streaming_services (id, tmdb_provider_id, name, logo_path, provider_type)
values
  ('11111111-1111-1111-1111-111111111111', 8, 'Netflix', '/t2yyOv40HZeVlLjYsCsPHnWLk4W.jpg', 'flatrate'),
  ('22222222-2222-2222-2222-222222222222', 337, 'Disney Plus', '/97yvRBw1GzX7fXprcF80er19ot.jpg', 'flatrate'),
  ('33333333-3333-3333-3333-333333333333', 9, 'Amazon Prime Video', '/emthp39XA2YScoYL1p0sdbAH2WA.jpg', 'flatrate'),
  ('44444444-4444-4444-4444-444444444444', 2, 'Apple TV', '/peURlLlr8jggOwK53fJ5wdQl05y.jpg', 'buy')
on conflict (tmdb_provider_id) do nothing;

