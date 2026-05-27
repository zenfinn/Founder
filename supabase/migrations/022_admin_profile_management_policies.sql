-- Admins need backend access for live member metrics and member management screens.

create policy "profiles_select_admin"
  on public.profiles for select
  using (public.is_founder_admin());

create policy "profiles_update_admin"
  on public.profiles for update
  using (public.is_founder_admin())
  with check (public.is_founder_admin());
