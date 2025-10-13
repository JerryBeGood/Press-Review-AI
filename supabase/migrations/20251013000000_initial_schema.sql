-- =====================================================
-- Migration: Initial Schema for Press Review AI
-- Created: 2025-10-13
-- Description: Creates core tables for press review management system
-- 
-- Tables affected:
--   - press_reviews: User's configured press reviews
--   - generated_press_reviews: Generated review instances
--   - ratings: User ratings for generated reviews
--   - generation_logs: Detailed generation process logs
--
-- Special notes:
--   - Implements RLS on all tables
--   - Enforces limit of 5 active press reviews per user
--   - Uses CASCADE deletion for data consistency
--   - Includes triggers for updated_at columns
-- =====================================================

-- Enable required extensions
-- pgcrypto is needed for gen_random_uuid() function
create extension if not exists pgcrypto;

-- =====================================================
-- Custom Types
-- =====================================================

-- Status enum for tracking generation process state
-- pending: generation queued but not started
-- success: generation completed successfully
-- failed: generation encountered an error
create type press_review_status as enum ('pending', 'success', 'failed');

-- =====================================================
-- Table: press_reviews
-- =====================================================
-- Stores user-configured press review topics and schedules
-- Each user can have up to 5 active press reviews
create table press_reviews (
  id uuid primary key default gen_random_uuid(),
  -- References auth.users managed by Supabase Auth
  user_id uuid not null references auth.users(id) on delete cascade,
  -- Topic/subject matter for the press review
  topic text not null,
  -- CRON format schedule for automatic generation
  schedule text not null,
  -- Flag to enable/disable automatic generation
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Index for querying user's active reviews
create index press_reviews_user_id_is_active_idx 
  on press_reviews(user_id, is_active);

-- Index for querying user's reviews by creation date
create index press_reviews_user_id_created_at_idx 
  on press_reviews(user_id, created_at desc);

-- Enable Row Level Security
alter table press_reviews enable row level security;

-- RLS Policy: Allow authenticated users to view their own press reviews
create policy "Users can view their own press reviews"
  on press_reviews
  for select
  to authenticated
  using (auth.uid() = user_id);

-- RLS Policy: Allow authenticated users to insert their own press reviews
create policy "Users can create their own press reviews"
  on press_reviews
  for insert
  to authenticated
  with check (auth.uid() = user_id);

-- RLS Policy: Allow authenticated users to update their own press reviews
create policy "Users can update their own press reviews"
  on press_reviews
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- RLS Policy: Allow authenticated users to delete their own press reviews
create policy "Users can delete their own press reviews"
  on press_reviews
  for delete
  to authenticated
  using (auth.uid() = user_id);

-- =====================================================
-- Function: Enforce max 5 active press reviews per user
-- =====================================================
-- Prevents users from creating more than 5 active press reviews
-- Raises exception if limit would be exceeded
create or replace function check_active_press_reviews_limit()
returns trigger as $$
declare
  active_count integer;
begin
  -- Only check if the review is being set to active
  if new.is_active then
    -- Count existing active reviews for this user
    select count(*) into active_count
    from press_reviews
    where user_id = new.user_id
      and is_active = true
      -- Exclude current record on update
      and id != coalesce(old.id, '00000000-0000-0000-0000-000000000000'::uuid);
    
    -- Enforce limit of 5 active reviews
    if active_count >= 5 then
      raise exception 'User cannot have more than 5 active press reviews';
    end if;
  end if;
  
  return new;
end;
$$ language plpgsql;

-- Trigger: Check active press reviews limit on insert/update
create trigger enforce_active_press_reviews_limit
  before insert or update on press_reviews
  for each row
  execute function check_active_press_reviews_limit();

-- =====================================================
-- Table: generated_press_reviews
-- =====================================================
-- Stores instances of generated press reviews
-- Each record represents one execution of a press review generation
create table generated_press_reviews (
  id uuid primary key default gen_random_uuid(),
  -- References the press review configuration
  press_review_id uuid not null references press_reviews(id) on delete cascade,
  -- Denormalized user_id for simplified RLS queries
  user_id uuid not null references auth.users(id) on delete cascade,
  -- Timestamp when generation was initiated
  generated_at timestamptz not null default now(),
  -- Current status of the generation process
  status press_review_status not null default 'pending',
  -- JSON content of the generated review
  content jsonb not null,
  -- Reference to detailed generation logs (populated after generation)
  generation_log_id uuid
);

-- Index for querying reviews by press_review_id and date
create index generated_press_reviews_press_review_id_generated_at_idx
  on generated_press_reviews(press_review_id, generated_at desc);

-- Index for filtering by status (useful for background jobs)
create index generated_press_reviews_status_idx
  on generated_press_reviews(status);

-- Index for user queries
create index generated_press_reviews_user_id_idx
  on generated_press_reviews(user_id);

-- Enable Row Level Security
alter table generated_press_reviews enable row level security;

-- RLS Policy: Allow authenticated users to view their own generated reviews
create policy "Users can view their own generated reviews"
  on generated_press_reviews
  for select
  to authenticated
  using (auth.uid() = user_id);

-- RLS Policy: Allow authenticated users to insert their own generated reviews
create policy "Users can create their own generated reviews"
  on generated_press_reviews
  for insert
  to authenticated
  with check (auth.uid() = user_id);

-- RLS Policy: Allow authenticated users to update their own generated reviews
create policy "Users can update their own generated reviews"
  on generated_press_reviews
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- RLS Policy: Allow authenticated users to delete their own generated reviews
create policy "Users can delete their own generated reviews"
  on generated_press_reviews
  for delete
  to authenticated
  using (auth.uid() = user_id);

-- =====================================================
-- Table: generation_logs
-- =====================================================
-- Stores detailed logs from the generation process
-- One-to-one relationship with generated_press_reviews
create table generation_logs (
  id uuid primary key default gen_random_uuid(),
  -- References the generated review this log belongs to
  generated_press_review_id uuid not null references generated_press_reviews(id) on delete cascade,
  -- Denormalized user_id for simplified RLS queries
  user_id uuid not null references auth.users(id) on delete cascade,
  -- JSONB structure containing detailed log information
  -- (timestamps, steps executed, errors, API calls, etc.)
  log_data jsonb not null,
  created_at timestamptz not null default now()
);

-- Index for querying logs by generated review
create index generation_logs_generated_press_review_id_idx
  on generation_logs(generated_press_review_id);

-- Index for user queries
create index generation_logs_user_id_idx
  on generation_logs(user_id);

-- Enable Row Level Security
alter table generation_logs enable row level security;

-- RLS Policy: Allow authenticated users to view their own generation logs
create policy "Users can view their own generation logs"
  on generation_logs
  for select
  to authenticated
  using (auth.uid() = user_id);

-- RLS Policy: Allow authenticated users to insert their own generation logs
create policy "Users can create their own generation logs"
  on generation_logs
  for insert
  to authenticated
  with check (auth.uid() = user_id);

-- RLS Policy: Allow authenticated users to update their own generation logs
create policy "Users can update their own generation logs"
  on generation_logs
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- RLS Policy: Allow authenticated users to delete their own generation logs
create policy "Users can delete their own generation logs"
  on generation_logs
  for delete
  to authenticated
  using (auth.uid() = user_id);

-- =====================================================
-- Add foreign key constraint after generation_logs exists
-- =====================================================
-- This creates the bidirectional relationship between
-- generated_press_reviews and generation_logs (1-to-1)
alter table generated_press_reviews
  add constraint fk_generation_log
  foreign key (generation_log_id)
  references generation_logs(id)
  on delete cascade;

-- =====================================================
-- Table: ratings
-- =====================================================
-- Stores user ratings (thumbs up/down) for generated reviews
-- Each user can rate a generated review only once
create table ratings (
  id uuid primary key default gen_random_uuid(),
  -- References the generated review being rated
  generated_press_review_id uuid not null references generated_press_reviews(id) on delete cascade,
  -- User who created the rating
  user_id uuid not null references auth.users(id) on delete cascade,
  -- Rating value: 1 for thumbs up, -1 for thumbs down
  rating smallint not null check (rating in (1, -1)),
  created_at timestamptz not null default now(),
  -- Ensure one rating per user per generated review
  unique(generated_press_review_id, user_id)
);

-- Index for querying ratings by user
create index ratings_user_id_idx
  on ratings(user_id);

-- Index for querying ratings by generated review
create index ratings_generated_press_review_id_idx
  on ratings(generated_press_review_id);

-- Enable Row Level Security
alter table ratings enable row level security;

-- RLS Policy: Allow authenticated users to view their own ratings
create policy "Users can view their own ratings"
  on ratings
  for select
  to authenticated
  using (auth.uid() = user_id);

-- RLS Policy: Allow authenticated users to insert their own ratings
create policy "Users can create their own ratings"
  on ratings
  for insert
  to authenticated
  with check (auth.uid() = user_id);

-- RLS Policy: Allow authenticated users to update their own ratings
create policy "Users can update their own ratings"
  on ratings
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- RLS Policy: Allow authenticated users to delete their own ratings
create policy "Users can delete their own ratings"
  on ratings
  for delete
  to authenticated
  using (auth.uid() = user_id);

-- =====================================================
-- Triggers: Auto-update updated_at timestamp
-- =====================================================
-- Generic function to update the updated_at column
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Trigger for press_reviews table
create trigger update_press_reviews_updated_at
  before update on press_reviews
  for each row
  execute function update_updated_at_column();

-- =====================================================
-- End of migration
-- =====================================================

