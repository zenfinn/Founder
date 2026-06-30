-- Meetup planner: host context on event submissions + public read for approved meetups.

alter table public.event_submissions
  add column if not exists host_info text;

comment on column public.event_submissions.host_info is
  'Kurzinfo zum Host (Wer organisiert, Hintergrund, Kontakt-Hinweise).';

drop policy if exists "event_submissions_select_approved" on public.event_submissions;
create policy "event_submissions_select_approved"
  on public.event_submissions
  for select
  to authenticated
  using (status = 'approved');
