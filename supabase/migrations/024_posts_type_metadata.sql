-- Unified native group content in `posts`: message, resource, win.

alter table public.posts add column if not exists type text not null default 'message';
alter table public.posts drop constraint if exists posts_type_check;
alter table public.posts add constraint posts_type_check
  check (type in ('message', 'resource', 'win'));

alter table public.posts add column if not exists metadata jsonb not null default '{}'::jsonb;

create index if not exists posts_group_type_created_idx
  on public.posts (group_id, type, created_at desc)
  where group_id is not null;

create or replace function public.cast_resource_vote(
  resource_id uuid,
  vote_type text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  voter_id uuid := auth.uid();
  post_row public.posts%rowtype;
  next_metadata jsonb;
  votes jsonb;
  previous_vote text;
  upvotes integer := 0;
  downvotes integer := 0;
  vote_key text;
  vote_value text;
begin
  if voter_id is null then
    raise exception 'Not authenticated';
  end if;

  if vote_type not in ('up', 'down') then
    raise exception 'Invalid vote type';
  end if;

  select * into post_row
  from public.posts
  where id = resource_id
    and type = 'resource'
    and deleted_at is null;

  if not found then
    raise exception 'Resource not found';
  end if;

  next_metadata := coalesce(post_row.metadata, '{}'::jsonb);
  votes := coalesce(next_metadata->'votes', '{}'::jsonb);
  previous_vote := votes->>voter_id::text;

  if previous_vote = vote_type then
    votes := votes - voter_id::text;
  else
    votes := jsonb_set(votes, array[voter_id::text], to_jsonb(vote_type), true);
  end if;

  for vote_key, vote_value in select * from jsonb_each_text(votes) loop
    if vote_value = 'up' then
      upvotes := upvotes + 1;
    elsif vote_value = 'down' then
      downvotes := downvotes + 1;
    end if;
  end loop;

  next_metadata := next_metadata || jsonb_build_object('votes', votes, 'upvotes', upvotes, 'downvotes', downvotes);

  update public.posts as p
  set metadata = next_metadata, updated_at = now()
  where p.id = resource_id;

  return resource_id;
end;
$$;

grant execute on function public.cast_resource_vote(uuid, text) to authenticated;

create or replace view public.messages as
select
  id,
  channel_id,
  group_id,
  author_id as user_id,
  content,
  type,
  metadata,
  created_at,
  updated_at,
  deleted_at
from public.posts
where type = 'message';
