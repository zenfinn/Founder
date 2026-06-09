-- Remove pre-launch waitlist gate
drop policy if exists "waitlist_insert_anyone" on public.waitlist_signups;
drop table if exists public.waitlist_signups;
