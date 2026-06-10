-- Ensure every community has a stable slug (fixes tools not matching community pages)

update public.groups
set slug = 'reselling'
where slug is null and lower(category) = 'reselling';

update public.groups
set slug = 'dropshipping'
where slug is null and lower(category) = 'dropshipping';

update public.groups
set slug = 'e-commerce'
where slug is null and (lower(category) = 'e-commerce' or lower(name) like '%e-commerce%');

update public.groups
set slug = 'amazon-fba'
where slug is null and lower(category) like '%amazon%';

update public.groups
set slug = 'tiktok-creator'
where slug is null and lower(category) like '%tiktok creator%';

update public.groups
set slug = 'tiktok-shop'
where slug is null and lower(category) like '%tiktok shop%';

update public.groups
set slug = 'ki-creator'
where slug is null and lower(category) like '%ki creator%';

update public.groups
set slug = 'trading'
where slug is null and lower(category) = 'trading';

update public.groups
set slug = 'memecoin-trading'
where slug is null and lower(category) like '%memecoin%';

update public.groups
set slug = 'youtube-automation'
where slug is null and lower(category) like '%youtube%';

update public.groups
set slug = 'digital-business'
where slug is null and lower(category) like '%digital business%';

update public.groups
set slug = 'real-estate'
where slug is null and (lower(category) like '%real estate%' or lower(category) like '%immobilien%');

update public.groups
set slug = 'traditional-services'
where slug is null and (lower(category) like '%traditional%' or lower(category) like '%klassische%');

update public.groups
set slug = 'web-design'
where slug is null and lower(category) like '%web design%';

update public.groups
set slug = 'founder-pro'
where slug is null and (lower(category) like '%founder pro%' or lower(name) like '%founder pro%');

update public.groups
set slug = 'gruender-lounge'
where slug is null and lower(category) like '%gründer lounge%';

-- Re-link resource posts that point at duplicate rows to the canonical slug row
with canonical as (
  select distinct on (coalesce(slug, lower(category)))
    id,
    coalesce(slug, lower(category)) as key
  from public.groups
  order by coalesce(slug, lower(category)), member_count desc nulls last, created_at asc
)
update public.posts p
set group_id = c.id
from public.groups g
join canonical c on c.key = coalesce(g.slug, lower(g.category))
where p.group_id = g.id
  and p.type = 'resource'
  and p.group_id is distinct from c.id;
