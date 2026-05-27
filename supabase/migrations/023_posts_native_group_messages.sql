-- Native group chat: store messages in `posts` via group_id (no channel FK required).

create table if not exists public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null,
  member_count integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.posts add column if not exists group_id uuid references public.groups (id) on delete cascade;

alter table public.posts alter column channel_id drop not null;

alter table public.posts drop constraint if exists posts_target_check;
alter table public.posts add constraint posts_target_check check (
  (channel_id is not null and group_id is null)
  or (group_id is not null and channel_id is null)
);

create index if not exists posts_group_created_idx
  on public.posts (group_id, created_at desc)
  where group_id is not null;

create or replace view public.messages as
select
  id,
  channel_id,
  group_id,
  author_id as user_id,
  content,
  created_at,
  updated_at,
  deleted_at
from public.posts;

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'posts'
  ) then
    alter publication supabase_realtime add table public.posts;
  end if;
end $$;
