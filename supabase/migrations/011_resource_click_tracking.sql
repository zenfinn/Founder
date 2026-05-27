-- Partner resource click tracking for admin analytics.

create table if not exists public.resource_clicks (
  id uuid primary key default gen_random_uuid(),
  resource_id text not null,
  user_id uuid references auth.users (id) on delete set null,
  target_url text not null,
  referrer text,
  created_at timestamptz not null default now()
);

alter table public.resource_clicks enable row level security;

create policy "resource_clicks_insert_any_member"
  on public.resource_clicks for insert
  with check (auth.uid() = user_id or user_id is null);

create policy "resource_clicks_admin_read"
  on public.resource_clicks for select
  using (public.is_founder_admin());

create index if not exists resource_clicks_resource_created_idx
  on public.resource_clicks (resource_id, created_at desc);
