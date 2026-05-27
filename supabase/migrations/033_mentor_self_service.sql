-- Mentors can create/update their own profile (Builder+ enforced in app).

drop policy if exists "mentors_read_approved" on public.mentors;

create policy "mentors_select_visible_or_own"
  on public.mentors
  for select
  using (is_approved = true or user_id = auth.uid() or public.is_founder_admin());

create policy "mentors_insert_own"
  on public.mentors
  for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "mentors_update_own"
  on public.mentors
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
