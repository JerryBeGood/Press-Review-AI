-- =====================================================
-- Migration: Set generation_log_id as NOT NULL
-- Created: 2025-10-13
-- Description: Enforces generation_log_id to be NOT NULL in generated_press_reviews
-- =====================================================

-- Set generation_log_id column as NOT NULL
-- Note: This will fail if there are existing rows with NULL values
-- Ensure all existing rows have a valid generation_log_id before running this migration
alter table generated_press_reviews
  alter column generation_log_id set not null;

-- =====================================================
-- End of migration
-- =====================================================

