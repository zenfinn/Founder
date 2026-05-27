-- Fix infinite RLS recursion between group_subgroups and group_subgroup_members.

create or replace function public.is_subgroup_member(p_subgroup_id uuid, p_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.group_subgroup_members
    where subgroup_id = p_subgroup_id
      and user_id = p_user_id
  );
$$;

create or replace function public.is_subgroup_listed_or_public(p_subgroup_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.group_subgroups
    where id = p_subgroup_id
      and visibility in ('listed', 'public')
  );
$$;

create or replace function public.can_join_subgroup(p_subgroup_id uuid, p_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.group_subgroups
    where id = p_subgroup_id
      and (
        visibility in ('listed', 'public')
        or owner_id = p_user_id
      )
  );
$$;

grant execute on function public.is_subgroup_member(uuid, uuid) to authenticated;
grant execute on function public.is_subgroup_listed_or_public(uuid) to authenticated;
grant execute on function public.can_join_subgroup(uuid, uuid) to authenticated;

drop policy if exists "subgroups_select_visible_or_member" on public.group_subgroups;
drop policy if exists "subgroup_members_select_own_or_visible" on public.group_subgroup_members;
drop policy if exists "subgroup_members_insert_own" on public.group_subgroup_members;

create policy "subgroups_select_visible_or_member"
  on public.group_subgroups
  for select
  to authenticated
  using (
    visibility in ('listed', 'public')
    or owner_id = auth.uid()
    or public.is_subgroup_member(id, auth.uid())
  );

create policy "subgroup_members_select_own_or_visible"
  on public.group_subgroup_members
  for select
  to authenticated
  using (
    user_id = auth.uid()
    or public.is_subgroup_listed_or_public(subgroup_id)
    or public.is_subgroup_member(subgroup_id, auth.uid())
  );

create policy "subgroup_members_insert_own"
  on public.group_subgroup_members
  for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and public.can_join_subgroup(subgroup_id, auth.uid())
  );
