-- Ensure Founder Pro subscription fields and Realtime profile updates exist.

alter table public.profiles
  add column if not exists founder_pro boolean not null default false,
  add column if not exists founder_pro_since timestamptz,
  add column if not exists stripe_customer_id text;

create index if not exists profiles_founder_pro_idx on public.profiles (founder_pro);
create index if not exists profiles_stripe_customer_idx on public.profiles (stripe_customer_id);

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'profiles'
  ) then
    alter publication supabase_realtime add table public.profiles;
  end if;
end $$;
