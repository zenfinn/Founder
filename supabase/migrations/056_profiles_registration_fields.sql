-- Registration / onboarding profile fields (idempotent for prod DBs missing older migrations).
alter table public.profiles
  add column if not exists estimated_annual_revenue text,
  add column if not exists requested_rank text default 'aspiring';

comment on column public.profiles.estimated_annual_revenue is 'Self-reported annual revenue at signup.';
comment on column public.profiles.requested_rank is 'Target rank from signup revenue; verified separately.';

-- Refresh PostgREST schema cache after manual SQL runs.
notify pgrst, 'reload schema';
