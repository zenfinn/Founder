-- Grant Founder Pro to matthias.schaefer2203@gmail.com

update public.profiles p
set
  founder_pro = true,
  founder_pro_since = coalesce(p.founder_pro_since, now()),
  plan = 'pro'
from auth.users u
where p.id = u.id
  and lower(u.email) = lower('matthias.schaefer2203@gmail.com');
