-- Mentors and bookings with platform commission.

create table if not exists public.mentors (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  name text not null,
  bio text,
  experience text,
  expertise_tags text[] not null default '{}',
  industries text[] not null default '{}',
  rating numeric not null default 0,
  hourly_rate_cents integer not null default 0,
  is_approved boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.mentors enable row level security;

create policy "mentors_read_approved"
  on public.mentors for select
  using (is_approved = true or public.is_founder_admin());

create policy "mentors_admin_all"
  on public.mentors for all
  using (public.is_founder_admin())
  with check (public.is_founder_admin());

create table if not exists public.mentor_bookings (
  id uuid primary key default gen_random_uuid(),
  mentor_id uuid not null references public.mentors (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  starts_at timestamptz,
  status text not null default 'pending' check (status in ('pending', 'paid', 'completed', 'cancelled')),
  amount_cents integer not null default 0,
  platform_fee_cents integer not null default 0,
  stripe_checkout_session_id text,
  created_at timestamptz not null default now()
);

alter table public.mentor_bookings enable row level security;

create policy "mentor_bookings_select_own_or_admin"
  on public.mentor_bookings for select
  using (auth.uid() = user_id or public.is_founder_admin());

create policy "mentor_bookings_insert_own"
  on public.mentor_bookings for insert
  with check (auth.uid() = user_id);

create policy "mentor_bookings_admin_all"
  on public.mentor_bookings for all
  using (public.is_founder_admin())
  with check (public.is_founder_admin());
