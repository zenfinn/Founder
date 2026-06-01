-- Display member counts: seeded baseline + real group_members (never show "1" when chat is active).

create or replace function public.community_member_baseline(p_slug text, p_category text)
returns integer
language sql
immutable
as $$
  select case coalesce(nullif(trim(p_slug), ''), nullif(trim(p_category), ''), 'default')
    when 'reselling' then 1240
    when 'dropshipping' then 980
    when 'e-commerce' then 1540
    when 'amazon-fba' then 780
    when 'tiktok-creator' then 2130
    when 'tiktok-shop' then 1320
    when 'ki-creator' then 860
    when 'trading' then 720
    when 'memecoin-trading' then 640
    when 'youtube-automation' then 910
    when 'digital-business' then 1120
    when 'founder-pro' then 320
    when 'Reselling' then 1240
    when 'Dropshipping' then 980
    when 'E-Commerce' then 1540
    when 'Amazon FBA' then 780
    when 'TikTok Creator' then 2130
    when 'TikTok Shop' then 1320
    when 'KI Creator' then 860
    when 'Trading' then 720
    when 'Memecoin Trading' then 640
    when 'YouTube Automation' then 910
    when 'Digital Business' then 1120
    when 'Founder Pro' then 320
    else 420
  end;
$$;

create or replace function public.sync_group_member_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_group_id uuid;
  real_count integer;
  baseline integer;
begin
  target_group_id := coalesce(new.group_id, old.group_id);

  select count(*)::integer
  into real_count
  from public.group_members gm
  where gm.group_id = target_group_id;

  select public.community_member_baseline(g.slug, g.category)
  into baseline
  from public.groups g
  where g.id = target_group_id;

  update public.groups
  set
    member_count = coalesce(baseline, 420) + coalesce(real_count, 0),
    updated_at = now()
  where id = target_group_id;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

create or replace function public.sync_subgroup_member_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_subgroup_id uuid;
  real_count integer;
begin
  target_subgroup_id := coalesce(new.subgroup_id, old.subgroup_id);

  select count(*)::integer
  into real_count
  from public.group_subgroup_members gsm
  where gsm.subgroup_id = target_subgroup_id;

  update public.group_subgroups
  set
    member_count = 48 + coalesce(real_count, 0),
    updated_at = now()
  where id = target_subgroup_id;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

drop trigger if exists group_subgroup_members_decrement on public.group_subgroup_members;
create trigger group_subgroup_members_sync_count
  after insert or delete on public.group_subgroup_members
  for each row execute function public.sync_subgroup_member_count();

update public.groups g
set member_count = public.community_member_baseline(g.slug, g.category) + (
  select count(*)::integer from public.group_members gm where gm.group_id = g.id
);

update public.group_subgroups gs
set member_count = 48 + (
  select count(*)::integer from public.group_subgroup_members gsm where gsm.subgroup_id = gs.id
);
