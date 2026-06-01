-- Mentor pricing: monthly rate + sessions per month (replaces hourly model in app).

alter table public.mentors
  add column if not exists monthly_rate_cents integer,
  add column if not exists sessions_per_month integer not null default 4;

update public.mentors
set
  monthly_rate_cents = coalesce(monthly_rate_cents, hourly_rate_cents),
  sessions_per_month = greatest(coalesce(sessions_per_month, 4), 1)
where true;

alter table public.mentors
  alter column monthly_rate_cents set default 0;

alter table public.mentors
  drop constraint if exists mentors_sessions_per_month_check;

alter table public.mentors
  add constraint mentors_sessions_per_month_check
  check (sessions_per_month >= 1 and sessions_per_month <= 31);

create index if not exists mentor_bookings_mentor_month_status_idx
  on public.mentor_bookings (mentor_key, created_at desc)
  where mentor_key is not null and status in ('pending', 'paid', 'completed');

create index if not exists mentor_bookings_mentor_id_month_status_idx
  on public.mentor_bookings (mentor_id, created_at desc)
  where mentor_id is not null and status in ('pending', 'paid', 'completed');
