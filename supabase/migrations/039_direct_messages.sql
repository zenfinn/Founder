-- Direct messages: conversations after accepted message requests

create table if not exists public.dm_conversations (
  id uuid primary key default gen_random_uuid(),
  participant_a uuid not null references auth.users (id) on delete cascade,
  participant_b uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  last_message_at timestamptz not null default now(),
  check (participant_a <> participant_b)
);

create unique index if not exists dm_conversations_participants_idx
  on public.dm_conversations (
    least(participant_a::text, participant_b::text),
    greatest(participant_a::text, participant_b::text)
  );

create index if not exists dm_conversations_last_message_idx
  on public.dm_conversations (last_message_at desc);

create table if not exists public.dm_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.dm_conversations (id) on delete cascade,
  sender_id uuid not null references auth.users (id) on delete cascade,
  content text not null check (char_length(trim(content)) between 1 and 2000),
  created_at timestamptz not null default now()
);

create index if not exists dm_messages_conversation_created_idx
  on public.dm_messages (conversation_id, created_at asc);

alter table public.dm_conversations enable row level security;
alter table public.dm_messages enable row level security;

drop policy if exists "dm_conversations_select_participant" on public.dm_conversations;
create policy "dm_conversations_select_participant"
  on public.dm_conversations
  for select
  to authenticated
  using (auth.uid() = participant_a or auth.uid() = participant_b);

drop policy if exists "dm_messages_select_participant" on public.dm_messages;
create policy "dm_messages_select_participant"
  on public.dm_messages
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.dm_conversations c
      where c.id = conversation_id
        and (c.participant_a = auth.uid() or c.participant_b = auth.uid())
    )
  );

drop policy if exists "dm_messages_insert_sender" on public.dm_messages;
create policy "dm_messages_insert_sender"
  on public.dm_messages
  for insert
  to authenticated
  with check (
    sender_id = auth.uid()
    and exists (
      select 1
      from public.dm_conversations c
      where c.id = conversation_id
        and (c.participant_a = auth.uid() or c.participant_b = auth.uid())
    )
  );

drop policy if exists "message_requests_delete_participants" on public.message_requests;
create policy "message_requests_delete_participants"
  on public.message_requests
  for delete
  to authenticated
  using (sender_id = auth.uid() or recipient_id = auth.uid());
