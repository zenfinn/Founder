-- Founder Pro referrals: 10% commission on actual revenue (incl. discounted checkout).

alter table public.profiles
  add column if not exists referred_by_affiliate_id uuid references public.affiliates (id) on delete set null;

create index if not exists profiles_referred_by_affiliate_idx
  on public.profiles (referred_by_affiliate_id);

create table if not exists public.referral_commissions (
  id uuid primary key default gen_random_uuid(),
  affiliate_id uuid not null references public.affiliates (id) on delete cascade,
  referred_user_id uuid not null references auth.users (id) on delete cascade,
  revenue_cents integer not null check (revenue_cents >= 0),
  commission_cents integer not null check (commission_cents >= 0),
  commission_rate numeric not null default 0.10,
  product_type text not null default 'founder_pro',
  stripe_invoice_id text unique,
  stripe_checkout_session_id text unique,
  created_at timestamptz not null default now()
);

create index if not exists referral_commissions_affiliate_idx
  on public.referral_commissions (affiliate_id, created_at desc);

alter table public.referral_commissions enable row level security;

drop policy if exists "referral_commissions_select_own" on public.referral_commissions;
create policy "referral_commissions_select_own"
  on public.referral_commissions
  for select
  to authenticated
  using (
    public.is_founder_admin()
    or exists (
      select 1 from public.affiliates a
      where a.id = affiliate_id and a.user_id = auth.uid()
    )
  );

create unique index if not exists referrals_affiliate_referred_user_idx
  on public.referrals (affiliate_id, referred_user_id)
  where referred_user_id is not null;
