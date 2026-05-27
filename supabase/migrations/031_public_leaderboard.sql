-- Public profile stats + activity leaderboard (anon-safe via SECURITY DEFINER)

create or replace function public.get_profile_post_count(p_user_id uuid)
returns bigint
language sql
security definer
set search_path = public
stable
as $$
  select count(*)::bigint
  from public.posts
  where author_id = p_user_id
    and deleted_at is null;
$$;

create or replace function public.get_activity_leaderboard(p_limit integer default 20)
returns table (
  user_id uuid,
  display_name text,
  username text,
  avatar_url text,
  current_rank text,
  score bigint
)
language sql
security definer
set search_path = public
stable
as $$
  select
    p.id as user_id,
    coalesce(nullif(trim(p.display_name), ''), p.username, 'Founder') as display_name,
    p.username,
    p.avatar_url,
    p.current_rank,
    count(po.id)::bigint as score
  from public.posts po
  inner join public.profiles p on p.id = po.author_id
  where po.deleted_at is null
    and p.public_profile_enabled = true
    and p.username is not null
    and coalesce(p.is_banned, false) = false
  group by p.id, p.display_name, p.username, p.avatar_url, p.current_rank
  order by score desc, display_name asc
  limit greatest(1, least(coalesce(p_limit, 20), 50));
$$;

grant execute on function public.get_profile_post_count(uuid) to anon, authenticated;
grant execute on function public.get_activity_leaderboard(integer) to anon, authenticated;
