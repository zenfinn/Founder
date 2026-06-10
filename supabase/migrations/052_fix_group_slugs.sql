-- Merge duplicate community rows and re-link tools.
--
-- Run in Supabase SQL Editor (postgres role). RLS warnings on INSERT/DELETE are expected;
-- this migration does not expose group_members to anon/authenticated clients.
-- group_members RLS is enabled in migration 032 (idempotent guard below).
--
-- Optional preview (run alone first, no writes):
-- with ranked as (
--   select id,
--     coalesce(nullif(lower(trim(slug)), ''), nullif(lower(trim(category)), ''), nullif(lower(trim(name)), '')) as key,
--     case when slug is not null and trim(slug) <> '' then 0 else 1 end as slug_rank,
--     member_count, created_at
--   from public.groups
--   where coalesce(nullif(trim(slug), ''), nullif(trim(category), ''), nullif(trim(name), '')) is not null
-- ), canonical_groups as (
--   select distinct on (key) id as canonical_id, key
--   from ranked
--   order by key, slug_rank, member_count desc nulls last, created_at asc
-- )
-- select g.id, g.name, g.slug, g.category, c.canonical_id as kept_id, g.id = c.canonical_id as is_kept
-- from public.groups g
-- join canonical_groups c on c.key = coalesce(
--   nullif(lower(trim(g.slug)), ''), nullif(lower(trim(g.category)), ''), nullif(lower(trim(g.name)), ''))
-- order by c.key, is_kept desc;

alter table public.group_members enable row level security;

create or replace function public._merge_duplicate_groups_once()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  create temp table _canonical_groups on commit drop as
  select distinct on (key)
    id as canonical_id,
    key
  from (
    select
      id,
      coalesce(
        nullif(lower(trim(slug)), ''),
        nullif(lower(trim(category)), ''),
        nullif(lower(trim(name)), '')
      ) as key,
      case when slug is not null and trim(slug) <> '' then 0 else 1 end as slug_rank,
      member_count,
      created_at
    from public.groups
    where coalesce(nullif(trim(slug), ''), nullif(trim(category), ''), nullif(trim(name), '')) is not null
  ) ranked
  order by key, slug_rank, member_count desc nulls last, created_at asc;

  update public.posts p
  set group_id = c.canonical_id
  from public.groups g
  join _canonical_groups c
    on c.key = coalesce(
      nullif(lower(trim(g.slug)), ''),
      nullif(lower(trim(g.category)), ''),
      nullif(lower(trim(g.name)), '')
    )
  where p.group_id = g.id
    and p.group_id is distinct from c.canonical_id;

  insert into public.group_members (group_id, user_id)
  select c.canonical_id, gm.user_id
  from public.group_members gm
  join public.groups g on g.id = gm.group_id
  join _canonical_groups c
    on c.key = coalesce(
      nullif(lower(trim(g.slug)), ''),
      nullif(lower(trim(g.category)), ''),
      nullif(lower(trim(g.name)), '')
    )
  where gm.group_id is distinct from c.canonical_id
  on conflict (group_id, user_id) do nothing;

  delete from public.groups g
  using _canonical_groups c
  where coalesce(
      nullif(lower(trim(g.slug)), ''),
      nullif(lower(trim(g.category)), ''),
      nullif(lower(trim(g.name)), '')
    ) = c.key
    and g.id is distinct from c.canonical_id;

  update public.groups g
  set slug = m.slug
  from _canonical_groups c
  join (
    values
      ('reselling', 'reselling'),
      ('dropshipping', 'dropshipping'),
      ('e-commerce', 'e-commerce'),
      ('amazon fba', 'amazon-fba'),
      ('tiktok creator', 'tiktok-creator'),
      ('tiktok shop', 'tiktok-shop'),
      ('ki creator', 'ki-creator'),
      ('trading', 'trading'),
      ('memecoin trading', 'memecoin-trading'),
      ('youtube automation', 'youtube-automation'),
      ('digital business', 'digital-business'),
      ('real estate', 'real-estate'),
      ('traditional services', 'traditional-services'),
      ('web design', 'web-design'),
      ('founder pro', 'founder-pro'),
      ('founder pro lounge', 'founder-pro'),
      ('gründer lounge', 'gruender-lounge')
  ) as m(key, slug) on m.key = c.key
  where g.id = c.canonical_id
    and (g.slug is null or trim(g.slug) = '');
end;
$$;

select public._merge_duplicate_groups_once();

drop function public._merge_duplicate_groups_once();
