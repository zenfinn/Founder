-- Consolidation layer for the Founder platform data model.
-- Auth users live in Supabase `auth.users`; app-specific user data lives in `public.profiles`.

create table if not exists public.ranks (
  id text primary key,
  label text not null,
  sort_order integer not null unique,
  description text,
  verification_summary text
);

insert into public.ranks (id, label, sort_order, description, verification_summary)
values
  ('aspiring', 'Aspiring', 0, 'Noch nicht verifiziert oder in Gründung.', 'Keine Dokumente erforderlich.'),
  ('starter', 'Starter', 1, 'Gewerbe unter 2 Jahren oder Umsatz unter 50k EUR.', 'Gewerbeanmeldung.'),
  ('builder', 'Builder', 2, '50k-250k EUR Umsatz oder 2-10 Mitarbeitende.', 'Gewerbeanmeldung und BWA oder Steuerbescheid.'),
  ('scaler', 'Scaler', 3, '250k-1M EUR Umsatz oder 10-50 Mitarbeitende.', 'Handelsregisterauszug und BWA.'),
  ('elite', 'Elite', 4, '1M EUR+ Umsatz oder 50+ Mitarbeitende.', 'Handelsregisterauszug und Jahresabschluss.')
on conflict (id) do update set
  label = excluded.label,
  sort_order = excluded.sort_order,
  description = excluded.description,
  verification_summary = excluded.verification_summary;

alter table public.ranks enable row level security;

create policy "ranks_public_read"
  on public.ranks for select
  using (true);

-- Compatibility view: the app currently stores chat messages in `posts`.
create or replace view public.messages as
select
  id,
  channel_id,
  author_id as user_id,
  content,
  created_at,
  updated_at,
  deleted_at
from public.posts;

create index if not exists posts_channel_created_idx on public.posts (channel_id, created_at desc);
create index if not exists events_category_rank_idx on public.events (category, min_rank, starts_at);
create index if not exists mentor_bookings_mentor_created_idx on public.mentor_bookings (mentor_id, created_at desc);
create index if not exists event_tickets_event_created_idx on public.event_tickets (event_id, created_at desc);
create index if not exists partner_resources_category_idx on public.partner_resources (category);
create index if not exists referrals_status_created_idx on public.referrals (status, created_at desc);
