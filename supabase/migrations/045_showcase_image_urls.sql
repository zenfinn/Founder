-- Up to 3 images per showcase (carousel). image_url stays the primary/cover image.

alter table public.showcases
  add column if not exists image_urls jsonb not null default '[]'::jsonb;

update public.showcases
set image_urls = jsonb_build_array(image_url)
where image_url is not null
  and trim(image_url) <> ''
  and (image_urls = '[]'::jsonb or image_urls is null);

alter table public.showcases
  add constraint showcases_image_urls_max_three
  check (jsonb_array_length(image_urls) <= 3);
