-- Global founder lounge: one chat for every member on the platform

insert into public.groups (name, category, slug, description, min_rank, requires_founder_pro, member_count)
values (
  'Alle Gründer',
  'Gründer Lounge',
  'gruender-lounge',
  'Der globale Chat für alle Founder — branchenübergreifend, für jeden Mitglied.',
  'aspiring',
  false,
  0
)
on conflict (category) do update set
  name = excluded.name,
  slug = excluded.slug,
  description = excluded.description,
  min_rank = excluded.min_rank,
  requires_founder_pro = false,
  updated_at = now();

insert into public.group_members (group_id, user_id)
select g.id, u.id
from public.groups g
cross join auth.users u
where g.slug = 'gruender-lounge'
on conflict (group_id, user_id) do nothing;

create or replace function public.auto_join_global_lounge()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.group_members (group_id, user_id)
  select g.id, new.id
  from public.groups g
  where g.slug = 'gruender-lounge'
  on conflict (group_id, user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists profiles_auto_join_global_lounge on public.profiles;
create trigger profiles_auto_join_global_lounge
  after insert on public.profiles
  for each row
  execute function public.auto_join_global_lounge();
