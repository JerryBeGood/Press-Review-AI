-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Function 1: Insert a new generation record for a press review
-- This function will be called by the cron job
CREATE OR REPLACE FUNCTION public.create_generation_for_review(review_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.generated_press_reviews (press_review_id)
  VALUES (review_id);
END;
$$;

-- Function 2: Schedule or update a cron job for a press review
-- This function creates a new cron job or updates an existing one
CREATE OR REPLACE FUNCTION public.schedule_press_review(review_id uuid, schedule_expression text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- First, try to unschedule if a job with this name already exists
  -- This allows us to update the schedule
  PERFORM cron.unschedule(review_id::text);
  
  -- Schedule the new cron job
  PERFORM cron.schedule(
    review_id::text,                                           -- job_name (unique identifier)
    schedule_expression,                                        -- schedule (cron expression)
    $sql$SELECT public.create_generation_for_review($sql$ || quote_literal(review_id) || $sql$::uuid)$sql$  -- command
  );
EXCEPTION
  WHEN OTHERS THEN
    -- If unschedule fails (job doesn't exist), just schedule the new job
    PERFORM cron.schedule(
      review_id::text,
      schedule_expression,
      $sql$SELECT public.create_generation_for_review($sql$ || quote_literal(review_id) || $sql$::uuid)$sql$
    );
END;
$$;

-- Function 3: Unschedule a cron job for a press review
-- This function removes the cron job when a press review is deleted
CREATE OR REPLACE FUNCTION public.unschedule_press_review(review_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM cron.unschedule(review_id::text);
EXCEPTION
  WHEN OTHERS THEN
    -- If the job doesn't exist, that's fine - no error needed
    NULL;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.create_generation_for_review(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.schedule_press_review(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.unschedule_press_review(uuid) TO authenticated;

