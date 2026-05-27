-- Founder Pro is optional and does not affect verified rank.

alter table public.channels add column if not exists requires_founder_pro boolean not null default false;

insert into public.channels (slug, name, category, description, min_rank, requires_founder_pro)
values (
  'founder-pro',
  'Founder Pro Lounge',
  'PREMIUM',
  'Premium-Channel für exklusive Ressourcen, frühe Event-Zugänge und Pro-Diskussionen.',
  'starter',
  true
)
on conflict (slug) do update set
  name = excluded.name,
  category = excluded.category,
  description = excluded.description,
  min_rank = excluded.min_rank,
  requires_founder_pro = excluded.requires_founder_pro;
