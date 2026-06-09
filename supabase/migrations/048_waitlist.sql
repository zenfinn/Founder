-- Waitlist signups for pre-launch gate
create table if not exists public.waitlist_signups (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  created_at timestamptz not null default now(),
  constraint waitlist_signups_email_unique unique (email)
);

create index if not exists waitlist_signups_created_idx
  on public.waitlist_signups (created_at desc);

alter table public.waitlist_signups enable row level security;

drop policy if exists "waitlist_insert_anyone" on public.waitlist_signups;
create policy "waitlist_insert_anyone"
  on public.waitlist_signups
  for insert
  to anon, authenticated
  with check (char_length(trim(email)) between 5 and 320);
