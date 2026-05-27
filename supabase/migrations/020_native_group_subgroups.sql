-- Native group expansion and user-created subgroups.

create unique index if not exists groups_category_unique_idx on public.groups (category);

update public.groups
set
  name = 'YouTube Automation',
  category = 'YouTube Automation'
where category in ('youtube-ressourcen', 'YouTube Ressourcen')
   or name = 'YouTube Ressourcen';

insert into public.groups (name, category, member_count)
values
  ('Amazon FBA', 'Amazon FBA', 780),
  ('TikTok Shop', 'TikTok Shop', 1320),
  ('YouTube Automation', 'YouTube Automation', 910)
on conflict (category) do update set
  name = excluded.name,
  member_count = excluded.member_count;

create table if not exists public.group_subgroups (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  slug text not null,
  description text,
  visibility text not null default 'private' check (visibility in ('private', 'listed', 'public')),
  member_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (group_id, slug)
);

create table if not exists public.group_subgroup_members (
  id uuid primary key default gen_random_uuid(),
  subgroup_id uuid not null references public.group_subgroups(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (subgroup_id, user_id)
);

create index if not exists group_subgroups_group_visibility_idx
  on public.group_subgroups (group_id, visibility, created_at desc);

create index if not exists group_subgroup_members_user_idx
  on public.group_subgroup_members (user_id);

alter table public.group_subgroups enable row level security;
alter table public.group_subgroup_members enable row level security;

create policy "subgroups_select_visible_or_member"
  on public.group_subgroups for select
  using (
    visibility in ('listed', 'public')
    or owner_id = auth.uid()
    or exists (
      select 1
      from public.group_subgroup_members gsm
      where gsm.subgroup_id = id
        and gsm.user_id = auth.uid()
    )
  );

create policy "subgroups_insert_own"
  on public.group_subgroups for insert
  with check (owner_id = auth.uid());

create policy "subgroups_update_owner"
  on public.group_subgroups for update
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create policy "subgroup_members_select_own_or_visible"
  on public.group_subgroup_members for select
  using (
    user_id = auth.uid()
    or exists (
      select 1
      from public.group_subgroups gs
      where gs.id = subgroup_id
        and gs.visibility in ('listed', 'public')
    )
  );

create policy "subgroup_members_insert_own"
  on public.group_subgroup_members for insert
  with check (
    user_id = auth.uid()
    and exists (
      select 1
      from public.group_subgroups gs
      where gs.id = subgroup_id
        and (
          gs.visibility in ('listed', 'public')
          or gs.owner_id = auth.uid()
        )
    )
  );

create or replace function public.increment_subgroup_member_count()
returns trigger
language plpgsql
security definer
as $$
begin
  update public.group_subgroups
  set member_count = member_count + 1,
      updated_at = now()
  where id = new.subgroup_id;
  return new;
end;
$$;

drop trigger if exists group_subgroup_members_increment on public.group_subgroup_members;
create trigger group_subgroup_members_increment
  after insert on public.group_subgroup_members
  for each row execute function public.increment_subgroup_member_count();
