-- Auth onboarding profile fields.

alter table public.profiles add column if not exists estimated_annual_revenue text;

create index if not exists profiles_industry_idx on public.profiles (industry);
create index if not exists verification_requests_user_submitted_idx
  on public.verification_requests (user_id, submitted_at desc);
