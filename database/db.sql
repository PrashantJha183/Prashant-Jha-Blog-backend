/* =========================================================
   1. USER ROLES ENUM
   ---------------------------------------------------------
   This restricts roles to only allowed values.
   Prevents invalid roles like 'superadmin', 'guest123', etc.
========================================================= */

create type user_role as enum (
  'admin',
  'editor',
  'writer',
  'user'
);


/* =========================================================
   2. PROFILES TABLE (RBAC CORE)
   ---------------------------------------------------------
   - One row per authenticated user
   - Linked to Supabase auth.users
   - Role controls permissions across the system
   - Default role = 'user'
========================================================= */

create table profiles (
  id uuid references auth.users(id) on delete cascade,
  email text not null unique,
  role user_role not null default 'user',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  primary key (id)
);


/* =========================================================
   3. AUTO-CREATE PROFILE ON SIGNUP
   ---------------------------------------------------------
   - Trigger runs when a new auth user is created
   - Automatically inserts into profiles table
   - Ensures every user always has a role
========================================================= */

create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function handle_new_user();


/* =========================================================
   4. BLOGS TABLE
   ---------------------------------------------------------
   - Stores blog content
   - author_id links to profiles
   - status controls visibility
========================================================= */

create table blogs (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  content text not null,
  author_id uuid references profiles(id),
  status text check (status in ('draft', 'published')) default 'draft',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);


/* =========================================================
   5. BLOG LIKES TABLE
   ---------------------------------------------------------
   - Users can like a blog only once
   - Composite primary key enforces uniqueness
========================================================= */

create table blog_likes (
  user_id uuid references profiles(id) on delete cascade,
  blog_id uuid references blogs(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (user_id, blog_id)
);


/* =========================================================
   6. BLOG SAVES TABLE
   ---------------------------------------------------------
   - Users can save a blog only once
========================================================= */

create table blog_saves (
  user_id uuid references profiles(id) on delete cascade,
  blog_id uuid references blogs(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (user_id, blog_id)
);


/* =========================================================
   7. ENABLE ROW LEVEL SECURITY (RLS)
   ---------------------------------------------------------
   - Mandatory for Supabase security
   - Without RLS policies, access is blocked by default
========================================================= */

alter table profiles enable row level security;
alter table blogs enable row level security;
alter table blog_likes enable row level security;
alter table blog_saves enable row level security;


/* =========================================================
   8. PUBLIC READ ACCESS (PUBLISHED BLOGS ONLY)
   ---------------------------------------------------------
   - Anyone (even not logged in) can read published blogs
========================================================= */

create policy "Public can read published blogs"
on blogs
for select
using (status = 'published');


/* =========================================================
   9. BLOG CREATION PERMISSION
   ---------------------------------------------------------
   - Only writer, editor, admin can create blogs
========================================================= */

create policy "Writers editors admins can create blogs"
on blogs
for insert
with check (
  exists (
    select 1
    from profiles
    where id = auth.uid()
    and role in ('writer', 'editor', 'admin')
  )
);


/* =========================================================
   10. BLOG EDIT PERMISSION
   ---------------------------------------------------------
   - Only editor and admin can update blogs
========================================================= */

create policy "Editors admins can edit blogs"
on blogs
for update
using (
  exists (
    select 1
    from profiles
    where id = auth.uid()
    and role in ('editor', 'admin')
  )
);


/* =========================================================
   11. ROLE MANAGEMENT (ADMIN ONLY)
   ---------------------------------------------------------
   - Only admin can change roles
   - Prevents self-promotion attacks
========================================================= */

create policy "Only admin can update roles"
on profiles
for update
using (
  exists (
    select 1
    from profiles
    where id = auth.uid()
    and role = 'admin'
  )
);


/* =========================================================
   12. LIKES & SAVES (AUTHENTICATED USERS ONLY)
   ---------------------------------------------------------
   - Users can like/save only for themselves
========================================================= */

create policy "Users can like blogs"
on blog_likes
for insert
with check (auth.uid() = user_id);

create policy "Users can save blogs"
on blog_saves
for insert
with check (auth.uid() = user_id);



create table email_otps (
  email text primary key,
  otp_hash text not null,
  expires_at timestamptz not null,
  attempts int default 0
);


create policy "Service role can manage OTPs"
on email_otps
for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');


alter table email_otps
add constraint otp_attempt_limit
check (attempts <= 5);

create table refresh_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  token text not null,
  expires_at timestamptz not null,
  created_at timestamptz default now()
);


-- Allow backend (service role) to manage profiles
create policy "Service role can manage profiles"
on profiles
for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');


alter table profiles
drop constraint profiles_id_fkey;

alter table profiles
alter column id set default gen_random_uuid();

alter table profiles
alter column id set not null;

delete from profiles where id is null;

alter table profiles
add column name text;

/* =========================================================
   ADD MEDIA COLUMNS TO BLOGS TABLE
   ---------------------------------------------------------
   - images  : array of image URLs
   - videos  : array of video URLs
   - audios  : array of audio URLs
   - Optional fields (can be NULL)
========================================================= */

alter table blogs
add column if not exists images text[] default '{}';

alter table blogs
add column if not exists videos text[] default '{}';

alter table blogs
add column if not exists audios text[] default '{}';


-- Fast admin dashboard
create index if not exists idx_blogs_created_at
on blogs (created_at desc);

-- Fast author based queries
create index if not exists idx_blogs_author_id
on blogs (author_id);

-- Fast public blog feed
create index if not exists idx_blogs_status
on blogs (status);

create index if not exists idx_blogs_status_created
on blogs (status, created_at desc);


ALTER TABLE blogs
ADD COLUMN content_blocks JSONB NOT NULL DEFAULT '[]';

ALTER TABLE blogs
ADD COLUMN slug TEXT UNIQUE;

ALTER TABLE blogs ALTER COLUMN description DROP NOT NULL;

CREATE INDEX blogs_published_created_at_idx
ON blogs (status, created_at DESC);
