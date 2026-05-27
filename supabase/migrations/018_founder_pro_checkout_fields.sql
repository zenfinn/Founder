-- Founder Pro subscription state written by Stripe webhook.
alter table public.profiles
  add column if not exists founder_pro boolean not null default false,
  add column if not exists founder_pro_since timestamptz,
  add column if not exists stripe_customer_id text;

create index if not exists profiles_founder_pro_idx on public.profiles (founder_pro);
create index if not exists profiles_stripe_customer_idx on public.profiles (stripe_customer_id);

alter table public.profiles
  add column if not exists requested_rank text default 'aspiring';
