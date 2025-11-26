-- =====================================================
-- Migration: Prevent duplicate press review topics per user
-- Created: 2025-10-15
-- Description: Adds trigger to ensure a user cannot have multiple press_reviews with the same topic (case-insensitive)
-- =====================================================

-- =====================================================
-- Function: prevent_duplicate_press_review_topic
-- =====================================================
-- Raises an exception if a user already has a press review with the same topic (case-insensitive)
create or replace function prevent_duplicate_press_review_topic()
returns trigger as $$
declare
  existing_count integer;
begin
  -- Count existing press reviews with the same topic for this user (case-insensitive)
  select count(*) into existing_count
  from press_reviews
  where user_id = new.user_id
    and lower(topic) = lower(new.topic)
    -- Exclude current record when updating
    and id != coalesce(old.id, '00000000-0000-0000-0000-000000000000'::uuid);

  if existing_count > 0 then
    raise exception 'DUPLICATE_TOPIC';
  end if;

  return new;
end;
$$ language plpgsql;

-- =====================================================
-- Trigger: prevent_duplicate_topic_on_press_reviews
-- =====================================================
create trigger prevent_duplicate_topic_on_press_reviews
  before insert or update on press_reviews
  for each row
  execute function prevent_duplicate_press_review_topic();
