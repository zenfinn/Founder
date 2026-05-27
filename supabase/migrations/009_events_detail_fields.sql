-- Event detail fields for categories, speakers, agenda and Stripe checkout.

alter table public.events add column if not exists category text default 'Allgemein';
alter table public.events add column if not exists speakers text[] not null default '{}';
alter table public.events add column if not exists agenda text[] not null default '{}';
alter table public.events add column if not exists stripe_price_id text;

create table if not exists public.event_tickets (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  stripe_checkout_session_id text,
  stripe_payment_intent_id text,
  status text not null default 'pending' check (status in ('pending', 'paid', 'cancelled', 'refunded', 'free')),
  amount_cents integer not null default 0,
  created_at timestamptz not null default now(),
  unique (event_id, user_id)
);

alter table public.event_tickets enable row level security;

create policy "event_tickets_select_own_or_admin"
  on public.event_tickets for select
  using (auth.uid() = user_id or public.is_founder_admin());

create policy "event_tickets_insert_own"
  on public.event_tickets for insert
  with check (auth.uid() = user_id);

create policy "event_tickets_admin_all"
  on public.event_tickets for all
  using (public.is_founder_admin())
  with check (public.is_founder_admin());
