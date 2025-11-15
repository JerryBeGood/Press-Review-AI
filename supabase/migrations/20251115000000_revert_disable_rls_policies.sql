-- =====================================================
-- Migration: Revert Disable RLS Policies
-- Created: 2025-11-15
-- Description: Recreates RLS policies that were dropped in migration 20251013000001
-- Note: Excludes ratings table (dropped in migration 20251014000000)
-- =====================================================

-- =====================================================
-- Recreate policies for press_reviews table
-- =====================================================

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
-- Recreate policies for generated_press_reviews table
-- =====================================================

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
-- End of migration
-- =====================================================

