-- Migration: Add webhook trigger for generated press reviews
-- This migration creates a trigger that sends a POST request to the generate-queries
-- edge function whenever a new record is created in the generated_press_reviews table.
-- The newly created row is passed as JSON payload.

-- Enable the http extension for making HTTP requests
create extension if not exists http with schema extensions;

-- =====================================================
-- Function: Send webhook for new generated press review
-- =====================================================
-- This function sends an HTTP POST request to the generate-queries edge function
-- when a new generated press review is created. It includes the new row as JSON payload.
create or replace function call_generate_queries_edge_function()
returns trigger as $$
declare
  payload jsonb;
  headers jsonb;
begin
  -- Build the payload with the new row data
  payload := jsonb_build_object(
    'generated_press_review_id', new.id
  );

  -- Build the headers including Authorization
  headers := jsonb_build_object(
    'Content-Type', 'application/json'
  );

  -- Make the HTTP POST request
  perform extensions.http_post(
    'http://host.docker.internal:54321/functions/v1/generate-queries',
    payload::text,
    headers::text
  );

  return new;
exception when others then
  raise warning 'Webhook request failed: %', sqlerrm;
  return new;
end;
$$ language plpgsql;

-- =====================================================
-- Trigger: Send webhook on new generated press review
-- =====================================================
-- This trigger fires after a new record is inserted into generated_press_reviews
-- and calls the webhook function to notify the generate-queries edge function
create trigger start_press_review_generation
  after insert on public.generated_press_reviews
  for each row
  execute function call_generate_queries_edge_function();
