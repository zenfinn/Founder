-- Community memberships + platform owner bootstrap

create table if not exists public.group_members (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (group_id, user_id)
);

create index if not exists group_members_user_idx on public.group_members (user_id);
create index if not exists group_members_group_idx on public.group_members (group_id);

alter table public.group_members enable row level security;

drop policy if exists "group_members_select_own" on public.group_members;
create policy "group_members_select_own"
  on public.group_members
  for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "group_members_insert_own" on public.group_members;
create policy "group_members_insert_own"
  on public.group_members
  for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists "group_members_delete_own" on public.group_members;
create policy "group_members_delete_own"
  on public.group_members
  for delete
  to authenticated
  using (user_id = auth.uid());

-- Ensure Pro / plan columns exist (may not be applied yet on remote DB)
alter table public.profiles
  add column if not exists founder_pro boolean not null default false,
  add column if not exists founder_pro_since timestamptz,
  add column if not exists stripe_customer_id text,
  add column if not exists plan text not null default 'free',
  add column if not exists public_profile_enabled boolean not null default true,
  add column if not exists is_banned boolean not null default false;

create index if not exists profiles_founder_pro_idx on public.profiles (founder_pro);

-- Founder owner account – fully verified
update public.profiles p
set
  system_role = 'owner',
  founder_pro = true,
  founder_pro_since = coalesce(p.founder_pro_since, now()),
  plan = 'pro',
  current_rank = 'elite',
  public_profile_enabled = true,
  is_banned = false
from auth.users u
where p.id = u.id
  and lower(u.email) = lower('zndr.supply@gmail.com');

insert into public.founder_admins (user_id, role)
select u.id, 'owner'
from auth.users u
where lower(u.email) = lower('zndr.supply@gmail.com')
on conflict (user_id) do update set role = excluded.role;

-- Rank verification: approve all requests for owner account
update public.verification_requests vr
set
  status = 'approved',
  reviewed_at = coalesce(vr.reviewed_at, now()),
  assigned_rank = 'elite',
  requested_rank = coalesce(nullif(vr.requested_rank, ''), 'elite')
from auth.users u
where vr.user_id = u.id
  and lower(u.email) = lower('zndr.supply@gmail.com')
  and vr.status is distinct from 'approved';

insert into public.verification_requests (
  user_id,
  requested_rank,
  status,
  submitted_at,
  reviewed_at,
  assigned_rank
)
select
  u.id,
  'elite',
  'approved',
  now(),
  now(),
  'elite'
from auth.users u
where lower(u.email) = lower('zndr.supply@gmail.com')
  and not exists (
    select 1
    from public.verification_requests vr
    where vr.user_id = u.id
  );

-- Activity feed + community: authenticated users can read peer profile basics (avatar, name).
drop policy if exists "profiles_select_authenticated_community" on public.profiles;

create policy "profiles_select_authenticated_community"
  on public.profiles
  for select
  to authenticated
  using (coalesce(is_banned, false) = false);
