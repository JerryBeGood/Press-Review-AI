-- Migration: Refactor generation process for agent-based workflow
-- This migration consolidates generation tracking and artifacts into generated_press_reviews table
-- and removes the separate generation_logs table

-- Step 1: Create a new ENUM type for detailed generation statuses
CREATE TYPE generation_status AS ENUM (
    'pending',
    'generating_queries',
    'researching_sources',
    'synthesizing_content',
    'success',
    'failed'
);

-- Step 2: Add new JSONB columns and error column before altering status
-- This ensures we don't lose data if the migration is interrupted
ALTER TABLE public.generated_press_reviews
ADD COLUMN generated_queries jsonb,
ADD COLUMN research_results jsonb,
ADD COLUMN analysis jsonb,
ADD COLUMN error text;

-- Step 3: Alter the status column to use the new ENUM type
-- First drop the default, then change type, then set new default
ALTER TABLE public.generated_press_reviews
ALTER COLUMN status DROP DEFAULT;

ALTER TABLE public.generated_press_reviews
ALTER COLUMN status TYPE generation_status 
USING (
    CASE status::text
        WHEN 'pending' THEN 'pending'::generation_status
        WHEN 'success' THEN 'success'::generation_status
        WHEN 'failed' THEN 'failed'::generation_status
        ELSE 'pending'::generation_status
    END
);

ALTER TABLE public.generated_press_reviews
ALTER COLUMN status SET DEFAULT 'pending'::generation_status;

-- Step 4: Drop the foreign key constraint to generation_logs
ALTER TABLE public.generated_press_reviews
DROP CONSTRAINT IF EXISTS fk_generation_log;

-- Step 5: Drop the generation_log_id column
ALTER TABLE public.generated_press_reviews
DROP COLUMN IF EXISTS generation_log_id;

-- Step 6: Drop the generation_logs table
DROP TABLE IF EXISTS public.generation_logs;

-- Step 7: Drop the old press_review_status ENUM (now unused)
DROP TYPE IF EXISTS press_review_status;

