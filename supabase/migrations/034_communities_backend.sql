-- Communities backend: schema, RLS, seed data, member counts

alter table public.groups
  add column if not exists slug text,
  add column if not exists description text,
  add column if not exists min_rank text not null default 'aspiring',
  add column if not exists requires_founder_pro boolean not null default false,
  add column if not exists updated_at timestamptz not null default now();

create unique index if not exists groups_slug_unique_idx on public.groups (slug);
create unique index if not exists groups_category_unique_idx on public.groups (category);

alter table public.groups enable row level security;

drop policy if exists "groups_select_authenticated" on public.groups;
create policy "groups_select_authenticated"
  on public.groups
  for select
  to authenticated
  using (true);

insert into public.groups (name, category, slug, description, min_rank, requires_founder_pro, member_count)
values
  ('Reselling', 'Reselling', 'reselling', 'Sourcing, Margen, Plattformen und operative Tipps für Reseller.', 'aspiring', false, 1240),
  ('Dropshipping', 'Dropshipping', 'dropshipping', 'Shop-Aufbau, Lieferanten, Creatives und Testing für Dropshipping.', 'aspiring', false, 980),
  ('E-Commerce', 'E-Commerce', 'e-commerce', 'DTC, Shops, Conversion, Logistik und Wachstum für Online-Händler.', 'aspiring', false, 1540),
  ('Amazon FBA', 'Amazon FBA', 'amazon-fba', 'Private Label, Produktrecherche, Launch, Listing-Optimierung und Amazon Operations.', 'aspiring', false, 780),
  ('TikTok Creator', 'TikTok Creator', 'tiktok-creator', 'Content, Creator Funnels, Live Shopping und Social Commerce.', 'aspiring', false, 2130),
  ('TikTok Shop', 'TikTok Shop', 'tiktok-shop', 'Shop-Setup, Creator-Affiliates, GMV-Wachstum, Live Shopping und Kurzvideo-Commerce.', 'aspiring', false, 1320),
  ('KI Creator', 'KI Creator', 'ki-creator', 'KI-Workflows, Content-Produktion, Automationen und Creator-Tools.', 'aspiring', false, 860),
  ('Trading', 'Trading', 'trading', 'Austausch zu Trading-Strategien, Risikomanagement und Setups.', 'aspiring', false, 720),
  ('Memecoin Trading', 'Memecoin Trading', 'memecoin-trading', 'High-Risk Research, Onchain-Tools, Narratives und Risikohinweise.', 'aspiring', false, 640),
  ('YouTube Automation', 'YouTube Automation', 'youtube-automation', 'Automatisierte YouTube-Kanäle, Skripte, Thumbnails, Produktion, Teams und Monetarisierung.', 'aspiring', false, 910),
  ('Digital Business', 'Digital Business', 'digital-business', 'SaaS, Agenturen, Infoprodukte, Automationen und digitale Services.', 'builder', false, 1120),
  ('Founder Pro Lounge', 'Founder Pro', 'founder-pro', 'Premium-Channel für exklusive Ressourcen, frühe Event-Zugänge und Pro-Diskussionen.', 'starter', true, 320)
on conflict (category) do update set
  name = excluded.name,
  slug = excluded.slug,
  description = excluded.description,
  min_rank = excluded.min_rank,
  requires_founder_pro = excluded.requires_founder_pro,
  member_count = greatest(public.groups.member_count, excluded.member_count),
  updated_at = now();

-- Keep member_count in sync with group_members
create or replace function public.sync_group_member_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    update public.groups
    set member_count = (
      select count(*)::integer from public.group_members gm where gm.group_id = new.group_id
    ),
    updated_at = now()
    where id = new.group_id;
    return new;
  elsif tg_op = 'DELETE' then
    update public.groups
    set member_count = (
      select count(*)::integer from public.group_members gm where gm.group_id = old.group_id
    ),
    updated_at = now()
    where id = old.group_id;
    return old;
  end if;
  return null;
end;
$$;

drop trigger if exists group_members_sync_count on public.group_members;
create trigger group_members_sync_count
  after insert or delete on public.group_members
  for each row execute function public.sync_group_member_count();

-- Platform owner: Mitglied in allen Communities
insert into public.group_members (group_id, user_id)
select g.id, u.id
from public.groups g
cross join auth.users u
where lower(u.email) = lower('zndr.supply@gmail.com')
on conflict (group_id, user_id) do nothing;
