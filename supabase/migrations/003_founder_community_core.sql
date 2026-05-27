-- Founder Community MVP core schema.
-- Run after the existing Receipto migrations when turning this project into Founder.

create extension if not exists pgcrypto;

create table if not exists public.founder_admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  role text not null default 'admin' check (role in ('admin', 'owner')),
  created_at timestamptz not null default now()
);

alter table public.founder_admins enable row level security;

create or replace function public.is_founder_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.founder_admins
    where user_id = auth.uid()
  );
$$;

alter table public.profiles add column if not exists username text unique;
alter table public.profiles add column if not exists display_name text;
alter table public.profiles add column if not exists avatar_url text;
alter table public.profiles add column if not exists company_name text;
alter table public.profiles add column if not exists industry text;
alter table public.profiles add column if not exists location text;
alter table public.profiles add column if not exists bio text;
alter table public.profiles add column if not exists website_url text;
alter table public.profiles add column if not exists linkedin_url text;
alter table public.profiles add column if not exists instagram_url text;
alter table public.profiles add column if not exists current_rank text not null default 'aspiring'
  check (current_rank in ('aspiring', 'starter', 'builder', 'scaler', 'elite'));
alter table public.profiles add column if not exists system_role text not null default 'member'
  check (system_role in ('member', 'moderator', 'admin', 'owner'));
alter table public.profiles add column if not exists is_banned boolean not null default false;
alter table public.profiles add column if not exists updated_at timestamptz not null default now();

create table if not exists public.verification_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  requested_rank text not null check (requested_rank in ('starter', 'builder', 'scaler', 'elite')),
  status text not null default 'pending' check (status in ('draft', 'pending', 'approved', 'rejected', 'expired')),
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users (id) on delete set null,
  assigned_rank text check (assigned_rank in ('aspiring', 'starter', 'builder', 'scaler', 'elite')),
  rejection_reason text,
  next_review_due_at timestamptz
);

alter table public.verification_requests enable row level security;

create table if not exists public.verification_documents (
  id uuid primary key default gen_random_uuid(),
  verification_request_id uuid not null references public.verification_requests (id) on delete cascade,
  document_type text not null check (
    document_type in (
      'business_registration',
      'bwa',
      'tax_assessment',
      'commercial_register',
      'annual_financial_statement'
    )
  ),
  storage_path text not null,
  file_name text not null,
  mime_type text,
  uploaded_at timestamptz not null default now()
);

alter table public.verification_documents enable row level security;

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  stripe_customer_id text,
  stripe_subscription_id text unique,
  plan text not null default 'free',
  status text not null default 'inactive',
  billing_interval text check (billing_interval in ('month', 'year')),
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.subscriptions enable row level security;

create table if not exists public.channels (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  category text not null,
  description text,
  min_rank text not null default 'aspiring' check (min_rank in ('aspiring', 'starter', 'builder', 'scaler', 'elite')),
  is_private boolean not null default false,
  is_archived boolean not null default false,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.channels enable row level security;

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  channel_id uuid not null references public.channels (id) on delete cascade,
  author_id uuid not null references auth.users (id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

alter table public.posts enable row level security;

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  description text,
  starts_at timestamptz not null,
  ends_at timestamptz,
  location_type text not null default 'online' check (location_type in ('online', 'offline', 'hybrid')),
  location_text text,
  online_url text,
  min_rank text not null default 'aspiring' check (min_rank in ('aspiring', 'starter', 'builder', 'scaler', 'elite')),
  price_cents integer not null default 0,
  capacity integer,
  status text not null default 'draft' check (status in ('draft', 'published', 'cancelled', 'completed')),
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.events enable row level security;

create table if not exists public.event_registrations (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  status text not null default 'registered' check (status in ('registered', 'waitlisted', 'cancelled')),
  registered_at timestamptz not null default now(),
  unique (event_id, user_id)
);

alter table public.event_registrations enable row level security;

create table if not exists public.admin_action_logs (
  id uuid primary key default gen_random_uuid(),
  admin_user_id uuid references auth.users (id) on delete set null,
  target_user_id uuid references auth.users (id) on delete set null,
  action text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.admin_action_logs enable row level security;

create policy "founder_admins_select_admins"
  on public.founder_admins for select
  using (public.is_founder_admin());

create policy "verification_requests_select_own_or_admin"
  on public.verification_requests for select
  using (auth.uid() = user_id or public.is_founder_admin());

create policy "verification_requests_insert_own"
  on public.verification_requests for insert
  with check (auth.uid() = user_id);

create policy "verification_requests_update_admin"
  on public.verification_requests for update
  using (public.is_founder_admin())
  with check (public.is_founder_admin());

create policy "verification_documents_select_own_or_admin"
  on public.verification_documents for select
  using (
    public.is_founder_admin()
    or exists (
      select 1 from public.verification_requests vr
      where vr.id = verification_request_id and vr.user_id = auth.uid()
    )
  );

create policy "verification_documents_insert_own"
  on public.verification_documents for insert
  with check (
    exists (
      select 1 from public.verification_requests vr
      where vr.id = verification_request_id and vr.user_id = auth.uid()
    )
  );

create policy "subscriptions_select_own_or_admin"
  on public.subscriptions for select
  using (auth.uid() = user_id or public.is_founder_admin());

create policy "subscriptions_admin_all"
  on public.subscriptions for all
  using (public.is_founder_admin())
  with check (public.is_founder_admin());

create policy "channels_select_members"
  on public.channels for select
  using (auth.uid() is not null and is_archived = false);

create policy "channels_admin_all"
  on public.channels for all
  using (public.is_founder_admin())
  with check (public.is_founder_admin());

create policy "posts_select_members"
  on public.posts for select
  using (auth.uid() is not null and deleted_at is null);

create policy "posts_insert_members"
  on public.posts for insert
  with check (auth.uid() = author_id);

create policy "posts_update_own"
  on public.posts for update
  using (auth.uid() = author_id and deleted_at is null)
  with check (auth.uid() = author_id);

create policy "events_select_published_members"
  on public.events for select
  using (auth.uid() is not null and status = 'published');

create policy "events_admin_all"
  on public.events for all
  using (public.is_founder_admin())
  with check (public.is_founder_admin());

create policy "event_registrations_select_own_or_admin"
  on public.event_registrations for select
  using (auth.uid() = user_id or public.is_founder_admin());

create policy "event_registrations_insert_own"
  on public.event_registrations for insert
  with check (auth.uid() = user_id);

create policy "admin_action_logs_select_admin"
  on public.admin_action_logs for select
  using (public.is_founder_admin());

insert into public.channels (slug, name, category, description, min_rank)
values
  ('ankuendigungen', 'Ankuendigungen', 'INFO', 'Offizielle Updates der Founder Community.', 'aspiring'),
  ('regeln', 'Regeln', 'INFO', 'Community-Regeln und Erwartungen.', 'aspiring'),
  ('willkommen', 'Willkommen', 'ONBOARDING', 'Erste Schritte fuer neue Mitglieder.', 'aspiring'),
  ('vorstellen', 'Vorstellen', 'ONBOARDING', 'Stelle dich und dein Unternehmen vor.', 'aspiring'),
  ('allgemein', 'Allgemein', 'COMMUNITY', 'Austausch fuer alle Mitglieder.', 'aspiring'),
  ('wins-erfolge', 'Wins & Erfolge', 'COMMUNITY', 'Teile Fortschritte, Deals und Meilensteine.', 'aspiring'),
  ('e-commerce', 'E-Commerce', 'BRANCHEN', 'Austausch fuer E-Commerce Unternehmer.', 'aspiring'),
  ('steuer-recht', 'Steuer & Recht', 'WISSEN', 'Wissen, Vorlagen und Fragen fuer Builder+.', 'builder'),
  ('strategie-talks', 'Strategie Talks', 'PREMIUM', 'Strategische Diskussionen fuer Scaler+.', 'scaler'),
  ('elite-mastermind', 'Elite Mastermind', 'ELITE', 'Geschlossener Bereich fuer Elite Unternehmer.', 'elite')
on conflict (slug) do nothing;
