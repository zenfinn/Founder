-- Run in Supabase SQL editor (or via CLI).
create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  gmail_message_id text unique,
  vendor text not null,
  amount numeric not null default 0,
  currency text not null default 'EUR',
  date text not null,
  subject text,
  category text default 'Gmail Scan',
  receipt_found boolean not null default true,
  vat_receipt_missing boolean not null default false,
  support_email text not null default '',
  sender text,
  created_at timestamptz not null default now()
);

alter table public.invoices enable row level security;

create policy "Allow anon read invoices"
  on public.invoices for select
  using (true);

create policy "Allow anon insert invoices"
  on public.invoices for insert
  with check (true);

create policy "Allow anon update invoices"
  on public.invoices for update
  using (true)
  with check (true);
