-- Showcases: Instagram-style project feed with upvotes and comments.

create table if not exists public.showcases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null check (char_length(trim(title)) between 1 and 120),
  description text not null check (char_length(description) <= 150),
  image_url text not null,
  website_url text,
  instagram_url text,
  tiktok_url text,
  linkedin_url text,
  upvotes integer not null default 0 check (upvotes >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.showcase_upvotes (
  user_id uuid not null references auth.users (id) on delete cascade,
  showcase_id uuid not null references public.showcases (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, showcase_id)
);

create table if not exists public.showcase_comments (
  id uuid primary key default gen_random_uuid(),
  showcase_id uuid not null references public.showcases (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  content text not null check (char_length(trim(content)) between 1 and 500),
  created_at timestamptz not null default now()
);

create index if not exists showcases_created_idx on public.showcases (created_at desc);
create index if not exists showcase_upvotes_showcase_idx on public.showcase_upvotes (showcase_id);
create index if not exists showcase_comments_showcase_idx on public.showcase_comments (showcase_id, created_at asc);

create or replace function public.refresh_showcase_upvotes(p_showcase_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.showcases s
  set upvotes = (
    select count(*)::integer from public.showcase_upvotes u where u.showcase_id = p_showcase_id
  )
  where s.id = p_showcase_id;
$$;

create or replace function public.on_showcase_upvote_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    perform public.refresh_showcase_upvotes(new.showcase_id);
    return new;
  elsif tg_op = 'DELETE' then
    perform public.refresh_showcase_upvotes(old.showcase_id);
    return old;
  end if;
  return null;
end;
$$;

drop trigger if exists showcase_upvotes_refresh on public.showcase_upvotes;
create trigger showcase_upvotes_refresh
  after insert or delete on public.showcase_upvotes
  for each row execute function public.on_showcase_upvote_change();

alter table public.showcases enable row level security;
alter table public.showcase_upvotes enable row level security;
alter table public.showcase_comments enable row level security;

create policy "showcases_select_all"
  on public.showcases for select
  using (true);

create policy "showcases_insert_own"
  on public.showcases for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "showcases_update_own"
  on public.showcases for update
  to authenticated
  using (auth.uid() = user_id or public.is_founder_admin())
  with check (auth.uid() = user_id or public.is_founder_admin());

create policy "showcases_delete_own"
  on public.showcases for delete
  to authenticated
  using (auth.uid() = user_id or public.is_founder_admin());

create policy "showcase_upvotes_select_all"
  on public.showcase_upvotes for select
  using (true);

create policy "showcase_upvotes_insert_own"
  on public.showcase_upvotes for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "showcase_upvotes_delete_own"
  on public.showcase_upvotes for delete
  to authenticated
  using (auth.uid() = user_id);

create policy "showcase_comments_select_all"
  on public.showcase_comments for select
  using (true);

create policy "showcase_comments_insert_own"
  on public.showcase_comments for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "showcase_comments_delete_own"
  on public.showcase_comments for delete
  to authenticated
  using (auth.uid() = user_id or public.is_founder_admin());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'showcase-images',
  'showcase-images',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = true,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "showcase_images_insert_own"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'showcase-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "showcase_images_update_own"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'showcase-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  )
  with check (
    bucket_id = 'showcase-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "showcase_images_delete_own"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'showcase-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "showcase_images_public_read"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'showcase-images');
