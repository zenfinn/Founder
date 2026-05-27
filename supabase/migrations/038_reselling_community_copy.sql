-- Reselling community copy + remove legacy duplicate group rows.

update public.groups
set
  name = 'Reselling',
  category = 'Reselling',
  slug = 'reselling',
  description = 'High-End Streetwear, Sneakers, Hardware & Collectibles: Sourcing, Authentifizierung, Margen und Verkaufsstrategien.',
  updated_at = now()
where slug = 'reselling'
   or category = 'Reselling'
   or (name ilike 'Reselling' and category in ('Reselling', 'BRANCHEN'));

delete from public.groups
where id in (
  select g.id
  from public.groups g
  where g.name ilike 'Reselling'
    and g.slug is distinct from 'reselling'
    and g.category is distinct from 'Reselling'
);

delete from public.groups g1
using public.groups g2
where g1.slug = g2.slug
  and g1.slug is not null
  and g1.id > g2.id;
