-- Migration: Secure edge function trigger with service role authentication
-- This migration updates the trigger to use pg_net extension with hardcoded
-- credentials for local development environment.

-- Enable the pg_net extension for making HTTP requests (recommended approach)
create extension if not exists pg_net with schema extensions;

-- =====================================================
-- Configuration: Set database settings for local development
-- =====================================================
-- TODO: BEFORE PRODUCTION DEPLOYMENT
-- These values must be updated with production credentials:
-- 1. Replace service_role_key with the production service role key
-- 2. Replace supabase_url with production URL (https://your-project-ref.supabase.co)
-- Run these commands in production database after deployment:
--   ALTER DATABASE postgres SET app.settings.service_role_key = 'production-key-here';
--   ALTER DATABASE postgres SET app.settings.supabase_url = 'https://your-project-ref.supabase.co';
--   SELECT pg_reload_conf();

-- =====================================================
-- Function: Send authenticated webhook for new generated press review
-- =====================================================
-- This function sends an authenticated HTTP POST request to the generate-queries
-- edge function using hardcoded values for local development.
create or replace function call_generate_queries_edge_function()
returns trigger as $$
declare
  request_id bigint;
  edge_func_auth_key text;
begin
  select decrypted_secret into edge_func_auth_key
  from vault.decrypted_secrets
  where name = 'EDGE_FUNC_AUTH_KEY'
  limit 1;

  -- Make the authenticated HTTP POST request using pg_net
  select net.http_post(
    url := 'http://host.docker.internal:54321/functions/v1/generate-queries',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || edge_func_auth_key
    ),
    body := jsonb_build_object(
      'generated_press_review_id', new.id
    )
  ) into request_id;

  raise log 'Triggered generate-queries edge function for press review %, request_id: %', new.id, request_id;

  return new;
exception when others then
  raise warning 'Webhook request failed for press review %: %', new.id, sqlerrm;
  return new;
end;
$$ language plpgsql security definer;

-- Grant necessary permissions for the trigger function
grant execute on function call_generate_queries_edge_function() to postgres;
grant execute on function call_generate_queries_edge_function() to service_role;

-- Note: The trigger itself already exists from the previous migration
-- If you need to recreate it:
-- drop trigger if exists start_press_review_generation on public.generated_press_reviews;
-- create trigger start_press_review_generation
--   after insert on public.generated_press_reviews
--   for each row
--   execute function call_generate_queries_edge_function();
