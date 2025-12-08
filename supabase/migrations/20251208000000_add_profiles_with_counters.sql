-- =====================================================
-- Migration: Add profiles table with quota counters
-- Created: 2025-12-08
-- Description: Replaces row counting system with incremental counters in profiles table
--              to prevent quota circumvention via resource deletion
-- =====================================================

-- =====================================================
-- Table: profiles
-- =====================================================
-- Stores user profiles with quota counters
-- Tracks scheduled and generated press reviews counts

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  scheduled_reviews_count integer not null default 0 check (scheduled_reviews_count >= 0),
  generated_reviews_count integer not null default 0 check (generated_reviews_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Enable RLS
alter table profiles enable row level security;

-- Policy: Users can only read their own profile
create policy "Users can read own profile"
  on profiles
  for select
  using (auth.uid() = id);

-- Index for faster lookups
create index if not exists profiles_user_id_idx on profiles(id);

-- =====================================================
-- Function: Auto-create profile for new users
-- =====================================================
-- Automatically creates a profile when a new user registers

create or replace function create_profile_for_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, scheduled_reviews_count, generated_reviews_count)
  values (new.id, 0, 0);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function create_profile_for_new_user();

-- =====================================================
-- Function: Auto-update profiles.updated_at
-- =====================================================

create or replace function update_profiles_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger profiles_updated_at
  before update on profiles
  for each row
  execute function update_profiles_updated_at();

-- =====================================================
-- Function: Increment scheduled_reviews_count on press_review insert
-- =====================================================

create or replace function increment_scheduled_reviews_count()
returns trigger as $$
begin
  -- Skip incrementing for excluded user
  if new.user_id = '23583b2c-4909-43a3-9c52-e4e9fed68383'::uuid then
    return new;
  end if;

  update profiles
  set scheduled_reviews_count = scheduled_reviews_count + 1
  where id = new.user_id;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_press_review_created
  after insert on press_reviews
  for each row
  execute function increment_scheduled_reviews_count();

-- =====================================================
-- Function: Increment generated_reviews_count on every generation attempt
-- =====================================================

create or replace function increment_generated_reviews_count()
returns trigger as $$
begin
  -- Skip incrementing for excluded user
  if new.user_id = '23583b2c-4909-43a3-9c52-e4e9fed68383'::uuid then
    return new;
  end if;

  -- Increment counter for every generation attempt
  update profiles
  set generated_reviews_count = generated_reviews_count + 1
  where id = new.user_id;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_generation_started
  after insert on generated_press_reviews
  for each row
  execute function increment_generated_reviews_count();

-- =====================================================
-- Function: Check press_reviews total limit (MODIFIED)
-- =====================================================
-- Modified to check counter in profiles instead of counting rows

create or replace function check_press_reviews_total_limit()
returns trigger as $$
declare
  profile_scheduled_count integer;
begin
  -- Get current count from profiles
  select scheduled_reviews_count into profile_scheduled_count
  from profiles
  where id = new.user_id;
  
  -- Enforce limit of 5 scheduled reviews
  if profile_scheduled_count >= 5 then
    raise exception 'LIMIT_EXCEEDED';
  end if;
  
  return new;
end;
$$ language plpgsql;

-- Drop old trigger if exists and create new one
drop trigger if exists enforce_press_reviews_total_limit on press_reviews;

create trigger enforce_press_reviews_total_limit
  before insert on press_reviews
  for each row
  execute function check_press_reviews_total_limit();

-- =====================================================
-- Function: Check generated_press_reviews limit (MODIFIED)
-- =====================================================
-- Modified to check counter in profiles instead of counting rows
-- Checks limit before every INSERT to prevent exceeding quota

create or replace function check_generated_press_reviews_limit()
returns trigger as $$
declare
  profile_generated_count integer;
begin
  -- Get current count from profiles
  select generated_reviews_count into profile_generated_count
  from profiles
  where id = new.user_id;
  
  -- Enforce limit of 5 generated reviews
  if profile_generated_count >= 5 then
    raise exception 'GENERATION_LIMIT_EXCEEDED';
  end if;
  
  return new;
end;
$$ language plpgsql;

-- Update trigger to work only on insert
drop trigger if exists enforce_generated_press_reviews_limit on generated_press_reviews;

create trigger enforce_generated_press_reviews_limit
  before insert on generated_press_reviews
  for each row
  execute function check_generated_press_reviews_limit();

-- =====================================================
-- Data Migration: Create profiles for existing users
-- =====================================================
-- Populate profiles table with existing users and their current counts

insert into profiles (id, scheduled_reviews_count, generated_reviews_count)
select 
  u.id,
  coalesce((select count(*) from press_reviews where user_id = u.id), 0) as scheduled_count,
  coalesce((select count(*) from generated_press_reviews where user_id = u.id and status = 'success'), 0) as generated_count
from auth.users u
on conflict (id) do nothing;

-- =====================================================
-- End of migration
-- =====================================================
