-- Migration: Increase generation limit from 5 to 10
-- Date: 2025-12-15

-- Update the check_generated_press_reviews_limit function to enforce limit of 10
create or replace function check_generated_press_reviews_limit()
returns trigger as $$
declare
  profile_generated_count integer;
begin
  -- Get current count from profiles
  select generated_reviews_count into profile_generated_count
  from profiles
  where id = new.user_id;
  
  -- Enforce limit of 10 generated reviews
  if profile_generated_count >= 10 then
    raise exception 'GENERATION_LIMIT_EXCEEDED';
  end if;
  
  return new;
end;
$$ language plpgsql;
