-- Group detail tabs: additional groups, realtime chat, approved resources and downloadable templates.

alter table public.channels add column if not exists group_slug text;

insert into public.channels (slug, name, category, description, min_rank, group_slug)
values
  ('reselling', 'Reselling', 'Reselling', 'Sourcing, Margen, Plattformen und operative Tipps für Reseller.', 'aspiring', 'reselling'),
  ('dropshipping', 'Dropshipping', 'Dropshipping', 'Shop-Aufbau, Lieferanten, Creatives und Testing für Dropshipping.', 'aspiring', 'dropshipping'),
  ('e-commerce', 'E-Commerce', 'E-Commerce', 'DTC, Shops, Conversion, Logistik und Wachstum für Online-Händler.', 'aspiring', 'e-commerce'),
  ('tiktok-creator', 'TikTok Creator', 'TikTok Creator', 'Content, Creator Funnels, Live Shopping und Social Commerce.', 'aspiring', 'tiktok-creator'),
  ('ki-creator', 'KI Creator', 'KI Creator', 'KI-Workflows, Content-Produktion, Automationen und Creator-Tools.', 'aspiring', 'ki-creator'),
  ('trading', 'Trading', 'Trading', 'Austausch zu Trading-Strategien, Risikomanagement und Setups.', 'aspiring', 'trading'),
  ('memecoin-trading', 'Memecoin Trading', 'Memecoin Trading', 'High-Risk Research, Onchain-Tools, Narratives und Risikohinweise.', 'aspiring', 'memecoin-trading'),
  ('youtube-ressourcen', 'YouTube Ressourcen', 'YouTube Ressourcen', 'Kanäle, Skripte, Thumbnails, Monetarisierung und Creator-Systeme.', 'aspiring', 'youtube-ressourcen'),
  ('digital-business', 'Digital Business', 'Digital Business', 'SaaS, Agenturen, Infoprodukte, Automationen und digitale Services.', 'builder', 'digital-business')
on conflict (slug) do update set
  name = excluded.name,
  category = excluded.category,
  description = excluded.description,
  min_rank = excluded.min_rank,
  group_slug = excluded.group_slug;

create table if not exists public.group_resources (
  id uuid primary key default gen_random_uuid(),
  group_slug text not null,
  title text not null,
  description text not null,
  category text not null check (category in ('Discord-Gruppen', 'Telegram-Kanäle', 'YouTube-Kanäle', 'Kurse', 'Tools')),
  external_url text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  submitted_by uuid references auth.users (id) on delete set null,
  reviewed_by uuid references auth.users (id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.group_resources enable row level security;

create policy "group_resources_read_approved_or_admin"
  on public.group_resources for select
  using (status = 'approved' or public.is_founder_admin());

create policy "group_resources_insert_member"
  on public.group_resources for insert
  with check (auth.uid() = submitted_by);

create policy "group_resources_admin_update"
  on public.group_resources for update
  using (public.is_founder_admin())
  with check (public.is_founder_admin());

create table if not exists public.group_templates (
  id uuid primary key default gen_random_uuid(),
  group_slug text not null,
  title text not null,
  file_type text not null check (file_type in ('PDF', 'Excel')),
  storage_path text,
  price_cents integer not null default 0,
  is_active boolean not null default true,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.group_templates enable row level security;

create policy "group_templates_read_active"
  on public.group_templates for select
  using (is_active = true);

create policy "group_templates_admin_all"
  on public.group_templates for all
  using (public.is_founder_admin())
  with check (public.is_founder_admin());

insert into storage.buckets (id, name, public)
values ('founder-group-templates', 'founder-group-templates', false)
on conflict (id) do update set public = false;

create policy "group_templates_admin_upload"
  on storage.objects for insert
  with check (
    bucket_id = 'founder-group-templates'
    and public.is_founder_admin()
  );

create policy "group_templates_admin_read"
  on storage.objects for select
  using (
    bucket_id = 'founder-group-templates'
    and public.is_founder_admin()
  );

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'posts'
  ) then
    alter publication supabase_realtime add table public.posts;
  end if;
end $$;

insert into public.group_resources (group_slug, title, description, category, external_url, status)
values
  ('reselling', 'Reselling Discord Deutschland', 'Aktive Discord-Gruppe für Sourcing, Deals und Marktplatz-News.', 'Discord-Gruppen', 'https://example.com', 'approved'),
  ('dropshipping', 'Dropshipping Alerts', 'Telegram-Kanal mit Creatives, Store-Beispielen und Lieferanten-Hinweisen.', 'Telegram-Kanäle', 'https://example.com', 'approved'),
  ('tiktok-creator', 'TikTok Growth Kanal', 'YouTube-Kanal zu Hooks, Creator Ads und organischem Wachstum.', 'YouTube-Kanäle', 'https://example.com', 'approved'),
  ('ki-creator', 'KI Content Systeme', 'Kurs zu KI-gestützter Content-Produktion und Automationen.', 'Kurse', 'https://example.com', 'approved'),
  ('digital-business', 'Automation Stack', 'Tool-Liste für CRM, Automationen, Zahlungen und Reporting.', 'Tools', 'https://example.com', 'approved');

insert into public.group_templates (group_slug, title, file_type, price_cents)
values
  ('reselling', 'Marge-Rechner', 'Excel', 1900),
  ('dropshipping', 'Supplier Outreach Vorlage', 'PDF', 2900),
  ('tiktok-creator', '30 Tage Content Plan', 'Excel', 1900),
  ('trading', 'Risk Journal', 'Excel', 3900),
  ('digital-business', 'Business KPI Dashboard', 'Excel', 4900);
