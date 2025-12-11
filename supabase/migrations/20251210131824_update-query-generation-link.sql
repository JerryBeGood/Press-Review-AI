alter table "public"."generated_press_reviews" enable row level security;

alter table "public"."press_reviews" enable row level security;

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.increment_generated_reviews_count()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
begin
  -- Increment counter for every generation attempt
  update profiles
  set generated_reviews_count = generated_reviews_count + 1
  where id = new.user_id;
  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.increment_scheduled_reviews_count()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
begin
  update profiles
  set scheduled_reviews_count = scheduled_reviews_count + 1
  where id = new.user_id;
  return new;
end;
$function$
;

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
    url := 'https://evdgtxndvfrphejojkkg.supabase.co/functions/v1/generate-queries',
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


