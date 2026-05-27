-- Public event suggestions (admin approval via email + future admin UI).

create table if not exists public.event_submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  description text,
  starts_at timestamptz,
  location_text text,
  category text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  admin_notes text,
  created_at timestamptz not null default now()
);

create index if not exists event_submissions_status_created_idx
  on public.event_submissions (status, created_at desc);

create index if not exists event_submissions_user_idx
  on public.event_submissions (user_id, created_at desc);

alter table public.event_submissions enable row level security;

drop policy if exists "event_submissions_insert_own" on public.event_submissions;
create policy "event_submissions_insert_own"
  on public.event_submissions
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "event_submissions_select_own_or_admin" on public.event_submissions;
create policy "event_submissions_select_own_or_admin"
  on public.event_submissions
  for select
  to authenticated
  using (auth.uid() = user_id or public.is_founder_admin());

drop policy if exists "event_submissions_update_admin" on public.event_submissions;
create policy "event_submissions_update_admin"
  on public.event_submissions
  for update
  to authenticated
  using (public.is_founder_admin())
  with check (public.is_founder_admin());
