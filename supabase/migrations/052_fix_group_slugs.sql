-- Merge duplicate community rows and re-link tools.
--
-- Why: some communities exist twice (different UUIDs). Tools/posts point at one row;
-- the UI opens another. This keeps one canonical row per community and removes only
-- the extra duplicates after re-linking posts and memberships.
--
-- Safe to run: does not assign slugs that already exist on another row.
-- Destructive step: DELETE removes only non-canonical duplicate group rows (not the
-- row we keep). group_subgroups on removed rows cascade; posts/members are moved first.
--
-- Optional preview (run alone first, no writes):
-- with canonical_groups as (
--   select distinct on (key) id as canonical_id, key
--   from (
--     select id,
--       coalesce(nullif(lower(trim(slug)), ''), nullif(lower(trim(category)), ''), nullif(lower(trim(name)), '')) as key,
--       case when slug is not null and trim(slug) <> '' then 0 else 1 end as slug_rank,
--       member_count, created_at
--     from public.groups
--     where coalesce(nullif(trim(slug), ''), nullif(trim(category), ''), nullif(trim(name), '')) is not null
--   ) ranked
--   order by key, slug_rank, member_count desc nulls last, created_at asc
-- )
-- select g.id, g.name, g.slug, g.category, c.canonical_id as kept_id,
--   g.id = c.canonical_id as is_kept
-- from public.groups g
-- join canonical_groups c on c.key = coalesce(
--   nullif(lower(trim(g.slug)), ''), nullif(lower(trim(g.category)), ''), nullif(lower(trim(g.name)), ''))
-- order by c.key, is_kept desc;

begin;

-- Re-link posts (messages, resources, wins) to canonical community
with canonical_groups as (
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
  order by key, slug_rank, member_count desc nulls last, created_at asc
)
update public.posts p
set group_id = c.canonical_id
from public.groups g
join canonical_groups c
  on c.key = coalesce(
    nullif(lower(trim(g.slug)), ''),
    nullif(lower(trim(g.category)), ''),
    nullif(lower(trim(g.name)), '')
  )
where p.group_id = g.id
  and p.group_id is distinct from c.canonical_id;

-- Re-link memberships
with canonical_groups as (
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
  order by key, slug_rank, member_count desc nulls last, created_at asc
)
insert into public.group_members (group_id, user_id)
select c.canonical_id, gm.user_id
from public.group_members gm
join public.groups g on g.id = gm.group_id
join canonical_groups c
  on c.key = coalesce(
    nullif(lower(trim(g.slug)), ''),
    nullif(lower(trim(g.category)), ''),
    nullif(lower(trim(g.name)), '')
  )
where gm.group_id is distinct from c.canonical_id
on conflict (group_id, user_id) do nothing;

-- Remove only non-canonical duplicate rows (posts/members already moved)
with canonical_groups as (
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
  order by key, slug_rank, member_count desc nulls last, created_at asc
)
delete from public.groups g
using canonical_groups c
where coalesce(
    nullif(lower(trim(g.slug)), ''),
    nullif(lower(trim(g.category)), ''),
    nullif(lower(trim(g.name)), '')
  ) = c.key
  and g.id is distinct from c.canonical_id;

-- Backfill slug on canonical row only when still missing
with canonical_groups as (
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
  order by key, slug_rank, member_count desc nulls last, created_at asc
)
update public.groups g
set slug = m.slug
from canonical_groups c
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

commit;
