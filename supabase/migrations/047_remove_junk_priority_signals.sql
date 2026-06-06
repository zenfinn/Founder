-- Remove test/junk messages that were showing up in Priority Signale.
update public.posts
set deleted_at = now()
where deleted_at is null
  and type = 'message'
  and lower(trim(content)) in ('ghggg', 'ghgghg', 'fftzfz');

delete from public.dm_messages
where lower(trim(content)) in ('ghggg', 'ghgghg', 'fftzfz');
