-- Allow Stripe checkout records for the current static event and mentor catalog.
-- Native DB-backed catalogs can still use event_id / mentor_id once those pages are fully dynamic.

alter table public.event_tickets alter column event_id drop not null;
alter table public.event_tickets add column if not exists event_key text;
alter table public.event_tickets add column if not exists event_title text;

create unique index if not exists event_tickets_event_key_user_idx
  on public.event_tickets (event_key, user_id)
  where event_key is not null;

alter table public.mentor_bookings alter column mentor_id drop not null;
alter table public.mentor_bookings add column if not exists mentor_key text;
alter table public.mentor_bookings add column if not exists mentor_name text;
alter table public.mentor_bookings add column if not exists stripe_payment_intent_id text;

create index if not exists mentor_bookings_mentor_key_created_idx
  on public.mentor_bookings (mentor_key, created_at desc)
  where mentor_key is not null;
