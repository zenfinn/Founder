-- Profiles (1:1 with auth.users). New users: 30-day Pro trial via trial_started_at (app logic).
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  plan text not null default 'basic' check (plan in ('basic', 'pro')),
  trial_started_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, plan, trial_started_at)
  values (new.id, 'basic', now())
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_receipto on auth.users;
create trigger on_auth_user_created_receipto
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Invoices: SaaS / AI fields
alter table public.invoices add column if not exists is_pro_feature boolean not null default false;
alter table public.invoices add column if not exists ai_status text default 'pending';
alter table public.invoices add column if not exists support_email text default '';
