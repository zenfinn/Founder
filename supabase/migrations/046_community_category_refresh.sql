-- Refresh community categories: remove Amazon FBA, add Real Estate & Web Design, rename Digital Business.

delete from public.groups where slug = 'amazon-fba';

update public.groups
set
  name = 'Traditional Services',
  category = 'Traditional Services',
  slug = 'traditional-services',
  description = 'Handwerk, lokale Dienstleister, Agenturen und klassische Service-Businesses.',
  min_rank = 'builder',
  updated_at = now()
where slug = 'digital-business';

insert into public.groups (name, category, slug, description, min_rank, requires_founder_pro, member_count)
values
  (
    'Real Estate',
    'Real Estate',
    'real-estate',
    'Immobilien-Deals, Vermietung, Flipping und Investment-Strategien für Founder.',
    'aspiring',
    false,
    40
  ),
  (
    'Web Design',
    'Web Design',
    'web-design',
    'Websites, Landing Pages, UX und Design-Systeme für Kundenprojekte.',
    'aspiring',
    false,
    38
  )
on conflict (category) do update set
  name = excluded.name,
  slug = excluded.slug,
  description = excluded.description,
  min_rank = excluded.min_rank,
  member_count = greatest(public.groups.member_count, excluded.member_count),
  updated_at = now();

create or replace function public.community_member_baseline(p_slug text, p_category text)
returns integer
language sql
immutable
as $$
  select least(50, case coalesce(nullif(trim(p_slug), ''), nullif(trim(p_category), ''), 'default')
    when 'reselling' then 47
    when 'dropshipping' then 41
    when 'e-commerce' then 50
    when 'tiktok-creator' then 49
    when 'tiktok-shop' then 44
    when 'ki-creator' then 38
    when 'trading' then 33
    when 'memecoin-trading' then 29
    when 'youtube-automation' then 42
    when 'real-estate' then 40
    when 'traditional-services' then 46
    when 'web-design' then 38
    when 'founder-pro' then 24
    when 'Reselling' then 47
    when 'Dropshipping' then 41
    when 'E-Commerce' then 50
    when 'TikTok Creator' then 49
    when 'TikTok Shop' then 44
    when 'KI Creator' then 38
    when 'Trading' then 33
    when 'Memecoin Trading' then 29
    when 'YouTube Automation' then 42
    when 'Real Estate' then 40
    when 'Traditional Services' then 46
    when 'Web Design' then 38
    when 'Founder Pro' then 24
    else 36
  end);
$$;
