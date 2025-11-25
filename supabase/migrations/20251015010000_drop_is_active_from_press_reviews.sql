-- =====================================================
-- Migration: Remove is_active column from press_reviews
-- Created: 2025-10-15
-- Description: Drops is_active column, related index, trigger, and function
-- =====================================================

-- Drop trigger enforcing active press reviews limit if it exists
DROP TRIGGER IF EXISTS enforce_active_press_reviews_limit ON press_reviews;

-- Drop supporting function if it exists
DROP FUNCTION IF EXISTS check_active_press_reviews_limit();

-- Drop index that includes the is_active column if it exists
DROP INDEX IF EXISTS press_reviews_user_id_is_active_idx;

-- Finally, drop the is_active column itself (if present)
ALTER TABLE press_reviews
  DROP COLUMN IF EXISTS is_active;

-- =====================================================
-- Function & Trigger: Enforce max 5 press_reviews per user
-- =====================================================
-- The previous limit applied only to active reviews; now we enforce
-- a hard cap of 5 total press_reviews for each user.

create or replace function check_press_reviews_total_limit()
returns trigger as $$
declare
  reviews_count integer;
begin
  -- Count existing press_reviews for this user (excluding current row on update)
  select count(*) into reviews_count
  from press_reviews
  where user_id = new.user_id
    and id != coalesce(old.id, '00000000-0000-0000-0000-000000000000'::uuid);

  if reviews_count >= 5 then
    raise exception 'LIMIT_EXCEEDED';
  end if;

  return new;
end;
$$ language plpgsql;

-- Trigger: Check total press reviews limit on insert (and user_id change)
create trigger enforce_press_reviews_total_limit
  before insert or update of user_id on press_reviews
  for each row
  execute function check_press_reviews_total_limit();
