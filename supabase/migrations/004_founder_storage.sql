-- Private bucket for sensitive verification documents.

insert into storage.buckets (id, name, public)
values ('founder-verification-documents', 'founder-verification-documents', false)
on conflict (id) do update set public = false;

create policy "verification_documents_upload_own_folder"
  on storage.objects for insert
  with check (
    bucket_id = 'founder-verification-documents'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "verification_documents_read_own_folder"
  on storage.objects for select
  using (
    bucket_id = 'founder-verification-documents'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "verification_documents_admin_read"
  on storage.objects for select
  using (
    bucket_id = 'founder-verification-documents'
    and public.is_founder_admin()
  );
