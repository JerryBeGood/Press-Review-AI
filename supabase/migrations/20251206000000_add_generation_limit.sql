-- =====================================================
-- Migration: Add generation limit for generated press reviews
-- Created: 2025-12-06
-- Description: Enforces a lifetime limit of 5 successful generations per user
-- =====================================================

-- =====================================================
-- Function & Trigger: Enforce max 5 successful generations per user
-- =====================================================
-- Prevents users from creating more than 5 successful generated press reviews
-- Raises exception if limit would be exceeded

create or replace function check_generated_press_reviews_limit()
returns trigger as $$
declare
  successful_generations_count integer;
begin
  -- Count existing successful generations for this user
  select count(*) into successful_generations_count
  from generated_press_reviews
  where user_id = new.user_id
    and status = 'success';

  -- Enforce limit of 5 successful generations
  if successful_generations_count >= 5 then
    raise exception 'GENERATION_LIMIT_EXCEEDED';
  end if;
  
  return new;
end;
$$ language plpgsql;

-- Trigger: Check generation limit before insert
create trigger enforce_generated_press_reviews_limit
  before insert on generated_press_reviews
  for each row
  execute function check_generated_press_reviews_limit();

