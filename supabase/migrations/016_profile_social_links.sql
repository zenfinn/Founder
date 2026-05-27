-- Social links for public Founder profiles.
alter table public.profiles
  add column if not exists instagram_url text,
  add column if not exists tiktok_url text,
  add column if not exists linkedin_url text,
  add column if not exists website_url text,
  add column if not exists twitter_url text;

create index if not exists profiles_username_public_idx
  on public.profiles (username)
  where public_profile_enabled = true;
