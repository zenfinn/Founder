-- Full group + resource access for matthias.schaefer2203@gmail.com

update public.profiles p
set
  founder_pro = true,
  founder_pro_since = coalesce(p.founder_pro_since, now()),
  plan = 'pro',
  current_rank = 'elite',
  public_profile_enabled = true,
  is_banned = false
from auth.users u
where p.id = u.id
  and lower(u.email) = lower('matthias.schaefer2203@gmail.com');

update public.verification_requests vr
set
  status = 'approved',
  reviewed_at = coalesce(vr.reviewed_at, now()),
  assigned_rank = 'elite',
  requested_rank = coalesce(nullif(vr.requested_rank, ''), 'elite')
from auth.users u
where vr.user_id = u.id
  and lower(u.email) = lower('matthias.schaefer2203@gmail.com')
  and vr.status is distinct from 'approved';

insert into public.verification_requests (
  user_id,
  requested_rank,
  status,
  submitted_at,
  reviewed_at,
  assigned_rank
)
select
  u.id,
  'elite',
  'approved',
  now(),
  now(),
  'elite'
from auth.users u
where lower(u.email) = lower('matthias.schaefer2203@gmail.com')
  and not exists (
    select 1
    from public.verification_requests vr
    where vr.user_id = u.id
  );

insert into public.group_members (group_id, user_id)
select g.id, u.id
from public.groups g
cross join auth.users u
where lower(u.email) = lower('matthias.schaefer2203@gmail.com')
on conflict (group_id, user_id) do nothing;
