-- In-app notifications.

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  type text not null check (type in ('chat_message', 'event_reminder', 'verification', 'mentor_booking', 'referral')),
  title text not null,
  body text not null,
  link_url text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.notifications enable row level security;

create policy "notifications_select_own"
  on public.notifications for select
  using (auth.uid() = user_id);

create policy "notifications_update_own"
  on public.notifications for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "notifications_admin_insert"
  on public.notifications for insert
  with check (public.is_founder_admin());

create index if not exists notifications_user_created_idx
  on public.notifications (user_id, created_at desc);
