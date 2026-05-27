-- Additional Founder MVP channels and partner resources.

insert into public.channels (slug, name, category, description, min_rank)
values
  ('reselling', 'Reselling', 'BRANCHEN', 'Sourcing, Margen, Plattformen und operative Tipps für Reseller.', 'aspiring'),
  ('dropshipping', 'Dropshipping', 'BRANCHEN', 'Shop-Aufbau, Lieferanten, Creatives und Testing für Dropshipping.', 'aspiring'),
  ('tiktok-creator', 'TikTok Creator', 'BRANCHEN', 'Content, Creator Funnels, Live Shopping und Social Commerce.', 'aspiring'),
  ('digital-business', 'Digital Business', 'BRANCHEN', 'SaaS, Agenturen, Infoprodukte, Automationen und digitale Services.', 'builder')
on conflict (slug) do update set
  name = excluded.name,
  category = excluded.category,
  description = excluded.description,
  min_rank = excluded.min_rank;

create table if not exists public.partner_resources (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null,
  category text not null check (category in ('Reselling', 'Dropshipping', 'TikTok', 'E-Commerce')),
  external_url text not null,
  logo_url text,
  is_active boolean not null default true,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.partner_resources enable row level security;

create policy "partner_resources_public_read_active"
  on public.partner_resources for select
  using (is_active = true);

create policy "partner_resources_admin_all"
  on public.partner_resources for all
  using (public.is_founder_admin())
  with check (public.is_founder_admin());

insert into public.events (title, slug, description, starts_at, ends_at, location_type, location_text, min_rank, price_cents, capacity, status)
values
  (
    'Starter Webinar: Gewerbe sauber aufsetzen',
    'starter-webinar-gewerbe',
    'Live Webinar für angehende Gründer und Starter mit Q&A.',
    '2026-06-04 18:00:00+00',
    '2026-06-04 19:30:00+00',
    'online',
    'Online',
    'aspiring',
    0,
    500,
    'published'
  ),
  (
    'Builder Workshop: 50k auf 250k skalieren',
    'builder-workshop-skalierung',
    'Taktischer Workshop für Umsatz, Prozesse und erste Teamstrukturen.',
    '2026-06-13 10:00:00+00',
    '2026-06-13 16:00:00+00',
    'offline',
    'Berlin',
    'builder',
    14900,
    60,
    'published'
  ),
  (
    'Founder Networking Dinner',
    'founder-networking-dinner',
    'Kuratierter Abend für Builder+ mit hochwertigen Kontakten.',
    '2026-06-21 19:00:00+00',
    '2026-06-21 22:00:00+00',
    'offline',
    'München',
    'builder',
    9900,
    30,
    'published'
  )
on conflict (slug) do nothing;

insert into public.partner_resources (name, description, category, external_url)
values
  ('ResellOS', 'Tool-Stack für Produktrecherche, Kalkulation und Reselling-Workflows.', 'Reselling', 'https://example.com'),
  ('Supplier Hub', 'Kuratierte Lieferanten und Fulfillment-Partner für Dropshipping-Brands.', 'Dropshipping', 'https://example.com'),
  ('Creator Metrics', 'Analytics und Content-Tracking für TikTok Creator und Social Commerce.', 'TikTok', 'https://example.com'),
  ('Commerce Suite', 'Rabatte auf Shop-Apps, Checkout-Optimierung und E-Commerce Operations.', 'E-Commerce', 'https://example.com');
