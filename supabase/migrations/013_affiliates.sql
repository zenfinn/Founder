-- Affiliate referrals: 20% on first 3 months.

create table if not exists public.affiliates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade unique,
  referral_code text not null unique,
  payout_email text,
  created_at timestamptz not null default now()
);

alter table public.affiliates enable row level security;

create policy "affiliates_select_own_or_admin"
  on public.affiliates for select
  using (auth.uid() = user_id or public.is_founder_admin());

create policy "affiliates_insert_own"
  on public.affiliates for insert
  with check (auth.uid() = user_id);

create table if not exists public.referrals (
  id uuid primary key default gen_random_uuid(),
  affiliate_id uuid not null references public.affiliates (id) on delete cascade,
  referred_user_id uuid references auth.users (id) on delete set null,
  status text not null default 'clicked' check (status in ('clicked', 'registered', 'paid', 'paid_out')),
  commission_rate numeric not null default 0.20,
  commission_months integer not null default 3,
  commission_cents integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.referrals enable row level security;

create policy "referrals_select_owner_or_admin"
  on public.referrals for select
  using (
    public.is_founder_admin()
    or exists (
      select 1 from public.affiliates a
      where a.id = affiliate_id and a.user_id = auth.uid()
    )
  );
