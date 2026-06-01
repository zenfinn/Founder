-- Cap displayed member counts at 50 per community (modest early-stage numbers).

create or replace function public.community_member_baseline(p_slug text, p_category text)
returns integer
language sql
immutable
as $$
  select least(50, case coalesce(nullif(trim(p_slug), ''), nullif(trim(p_category), ''), 'default')
    when 'reselling' then 47
    when 'dropshipping' then 41
    when 'e-commerce' then 50
    when 'amazon-fba' then 35
    when 'tiktok-creator' then 49
    when 'tiktok-shop' then 44
    when 'ki-creator' then 38
    when 'trading' then 33
    when 'memecoin-trading' then 29
    when 'youtube-automation' then 42
    when 'digital-business' then 46
    when 'founder-pro' then 24
    when 'Reselling' then 47
    when 'Dropshipping' then 41
    when 'E-Commerce' then 50
    when 'Amazon FBA' then 35
    when 'TikTok Creator' then 49
    when 'TikTok Shop' then 44
    when 'KI Creator' then 38
    when 'Trading' then 33
    when 'Memecoin Trading' then 29
    when 'YouTube Automation' then 42
    when 'Digital Business' then 46
    when 'Founder Pro' then 24
    else 36
  end);
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
    member_count = least(50, coalesce(baseline, 36) + coalesce(real_count, 0)),
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
    member_count = least(50, 12 + coalesce(real_count, 0)),
    updated_at = now()
  where id = target_subgroup_id;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

update public.groups g
set member_count = least(50, public.community_member_baseline(g.slug, g.category) + (
  select count(*)::integer from public.group_members gm where gm.group_id = g.id
));

update public.group_subgroups gs
set member_count = least(50, 12 + (
  select count(*)::integer from public.group_subgroup_members gsm where gsm.subgroup_id = gs.id
));
