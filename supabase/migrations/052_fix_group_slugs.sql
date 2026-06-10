-- Merge duplicate community rows and re-link tools (safe: no duplicate slug violations)

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

-- Re-link posts (messages, resources, wins) to canonical community
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

-- Re-link memberships
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

-- Remove duplicate community rows (posts/members already moved; subgroups cascade)
delete from public.groups g
using _canonical_groups c
where coalesce(
    nullif(lower(trim(g.slug)), ''),
    nullif(lower(trim(g.category)), ''),
    nullif(lower(trim(g.name)), '')
  ) = c.key
  and g.id is distinct from c.canonical_id;

-- Backfill slug on canonical row only when still missing (no conflict possible after merge)
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
