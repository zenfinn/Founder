-- Remove seeded placeholder tools (example.com) superseded by real community posts.

delete from public.group_resources
where lower(external_url) in ('https://example.com', 'http://example.com');
