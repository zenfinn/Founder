-- Fix profiles RLS so authenticated users can read/insert/update their own row.

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_insert_own" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;

create policy "profiles_select_own"
  on public.profiles
  for select
  to authenticated
  using (auth.uid() = id);

create policy "profiles_insert_own"
  on public.profiles
  for insert
  to authenticated
  with check (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles
  for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Public profile pages (/u/[username]) for enabled profiles.
drop policy if exists "profiles_select_public" on public.profiles;

create policy "profiles_select_public"
  on public.profiles
  for select
  to anon, authenticated
  using (public_profile_enabled = true and username is not null);
