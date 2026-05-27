-- Migration 036: Founder Pro referrals
-- 10% commission on actual paid revenue (including discounted onboarding checkout).
-- Depends on: 013_affiliates.sql (affiliates, referrals tables)

alter table public.profiles
  add column if not exists referred_by_affiliate_id uuid references public.affiliates (id) on delete set null;

comment on column public.profiles.referred_by_affiliate_id is
  'Affiliate that referred this user; set once at registration or first checkout.';

create index if not exists profiles_referred_by_affiliate_idx
  on public.profiles (referred_by_affiliate_id);

create table if not exists public.referral_commissions (
  id uuid primary key default gen_random_uuid(),
  affiliate_id uuid not null references public.affiliates (id) on delete cascade,
  referred_user_id uuid not null references auth.users (id) on delete cascade,
  revenue_cents integer not null check (revenue_cents >= 0),
  commission_cents integer not null check (commission_cents >= 0),
  commission_rate numeric not null default 0.10 check (commission_rate >= 0 and commission_rate <= 1),
  product_type text not null default 'founder_pro',
  stripe_invoice_id text,
  stripe_checkout_session_id text,
  created_at timestamptz not null default now(),
  constraint referral_commissions_stripe_invoice_id_key unique (stripe_invoice_id),
  constraint referral_commissions_stripe_checkout_session_id_key unique (stripe_checkout_session_id)
);

comment on table public.referral_commissions is
  'Ledger of Founder Pro referral payouts; one row per Stripe invoice (idempotent via stripe_invoice_id).';

create index if not exists referral_commissions_affiliate_idx
  on public.referral_commissions (affiliate_id, created_at desc);

create index if not exists referral_commissions_referred_user_idx
  on public.referral_commissions (referred_user_id, created_at desc);

alter table public.referral_commissions enable row level security;

drop policy if exists "referral_commissions_select_own" on public.referral_commissions;
create policy "referral_commissions_select_own"
  on public.referral_commissions
  for select
  to authenticated
  using (
    public.is_founder_admin()
    or exists (
      select 1
      from public.affiliates a
      where a.id = affiliate_id
        and a.user_id = auth.uid()
    )
  );

create unique index if not exists referrals_affiliate_referred_user_idx
  on public.referrals (affiliate_id, referred_user_id)
  where referred_user_id is not null;
