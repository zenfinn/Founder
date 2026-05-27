-- Public profile avatars and profile sharing.

alter table public.profiles add column if not exists public_profile_enabled boolean not null default true;

insert into storage.buckets (id, name, public)
values ('profile-avatars', 'profile-avatars', true)
on conflict (id) do update set public = true;

create policy "profile_avatars_upload_own"
  on storage.objects for insert
  with check (
    bucket_id = 'profile-avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "profile_avatars_public_read"
  on storage.objects for select
  using (bucket_id = 'profile-avatars');
