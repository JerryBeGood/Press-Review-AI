-- =====================================================
-- Migration: Disable Row Level Security
-- Created: 2025-10-15
-- Description: Disables RLS for all tables in the database
-- =====================================================

-- =====================================================
-- Disable RLS for press_reviews table
-- =====================================================
alter table press_reviews disable row level security;

-- =====================================================
-- Disable RLS for generated_press_reviews table
-- =====================================================
alter table generated_press_reviews disable row level security;

-- =====================================================
-- Disable RLS for generation_logs table
-- =====================================================
alter table generation_logs disable row level security;

-- Note: ratings table was dropped in migration 20251014000000_drop_ratings_table.sql

-- =====================================================
-- End of migration
-- =====================================================
