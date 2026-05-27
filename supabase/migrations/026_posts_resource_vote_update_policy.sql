-- Allow any signed-in member to update vote metadata on resource posts (client-side voting in lib/groups.js).

create policy "posts_update_resource_votes"
  on public.posts for update
  using (auth.uid() is not null and type = 'resource' and deleted_at is null)
  with check (type = 'resource' and deleted_at is null);
