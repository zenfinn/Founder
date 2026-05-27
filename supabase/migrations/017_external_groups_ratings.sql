-- External Discord/Telegram/WhatsApp groups and one-rating-per-user ratings.
create table if not exists public.external_groups (
  id uuid primary key default gen_random_uuid(),
  group_slug text not null,
  name text not null,
  description text not null,
  category text not null check (category in ('Discord', 'Telegram', 'WhatsApp')),
  member_count integer not null default 0,
  average_rating numeric(2,1) not null default 0,
  external_url text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  submitted_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.external_group_ratings (
  id uuid primary key default gen_random_uuid(),
  external_group_id uuid not null references public.external_groups(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (external_group_id, user_id)
);

alter table public.external_groups enable row level security;
alter table public.external_group_ratings enable row level security;

create policy "Approved external groups are public"
  on public.external_groups for select
  using (status = 'approved');

create policy "Authenticated users can suggest external groups"
  on public.external_groups for insert
  with check (auth.uid() = submitted_by);

create policy "Admins manage external groups"
  on public.external_groups for all
  using (exists (select 1 from public.founder_admins where user_id = auth.uid()))
  with check (exists (select 1 from public.founder_admins where user_id = auth.uid()));

create policy "Ratings are readable"
  on public.external_group_ratings for select
  using (true);

create policy "Authenticated users rate once per group"
  on public.external_group_ratings for insert
  with check (auth.uid() = user_id);

create policy "Users update their own ratings"
  on public.external_group_ratings for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Admins moderate ratings"
  on public.external_group_ratings for delete
  using (exists (select 1 from public.founder_admins where user_id = auth.uid()));

create or replace function public.refresh_external_group_rating()
returns trigger
language plpgsql
security definer
as $$
begin
  update public.external_groups
  set average_rating = (
    select coalesce(round(avg(rating)::numeric, 1), 0)
    from public.external_group_ratings
    where external_group_id = coalesce(new.external_group_id, old.external_group_id)
  ),
  updated_at = now()
  where id = coalesce(new.external_group_id, old.external_group_id);
  return coalesce(new, old);
end;
$$;

drop trigger if exists refresh_external_group_rating_insert on public.external_group_ratings;
create trigger refresh_external_group_rating_insert
after insert or update or delete on public.external_group_ratings
for each row execute function public.refresh_external_group_rating();

create index if not exists external_groups_slug_status_idx on public.external_groups (group_slug, status);
create index if not exists external_group_ratings_group_idx on public.external_group_ratings (external_group_id);
