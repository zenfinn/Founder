-- Profile interests, bio limit, direct message requests

alter table public.profiles
  add column if not exists interests text[] not null default '{}';

alter table public.profiles drop constraint if exists profiles_bio_length;
alter table public.profiles
  add constraint profiles_bio_length check (bio is null or char_length(bio) <= 200);

alter table public.profiles drop constraint if exists profiles_interests_max;
alter table public.profiles
  add constraint profiles_interests_max check (cardinality(interests) <= 3);

create table if not exists public.message_requests (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references auth.users (id) on delete cascade,
  recipient_id uuid not null references auth.users (id) on delete cascade,
  message text not null check (char_length(trim(message)) between 1 and 500),
  status text not null default 'pending' check (status in ('pending', 'accepted', 'rejected')),
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  check (sender_id <> recipient_id)
);

create unique index if not exists message_requests_pending_pair_idx
  on public.message_requests (sender_id, recipient_id)
  where status = 'pending';

create index if not exists message_requests_recipient_idx
  on public.message_requests (recipient_id, created_at desc);

alter table public.message_requests enable row level security;

drop policy if exists "message_requests_select_participants" on public.message_requests;
create policy "message_requests_select_participants"
  on public.message_requests
  for select
  to authenticated
  using (sender_id = auth.uid() or recipient_id = auth.uid());

drop policy if exists "message_requests_insert_own" on public.message_requests;
create policy "message_requests_insert_own"
  on public.message_requests
  for insert
  to authenticated
  with check (sender_id = auth.uid() and sender_id <> recipient_id);

drop policy if exists "message_requests_update_recipient" on public.message_requests;
create policy "message_requests_update_recipient"
  on public.message_requests
  for update
  to authenticated
  using (recipient_id = auth.uid())
  with check (recipient_id = auth.uid());

alter table public.notifications drop constraint if exists notifications_type_check;
alter table public.notifications
  add constraint notifications_type_check
  check (type in ('chat_message', 'event_reminder', 'verification', 'mentor_booking', 'referral', 'message_request'));
