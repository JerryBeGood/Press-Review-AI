-- =====================================================
-- Migration: Disable RLS Policies
-- Created: 2025-10-13
-- Description: Disables all RLS policies created in initial schema
-- =====================================================

-- =====================================================
-- Disable policies for press_reviews table
-- =====================================================
drop policy if exists "Users can view their own press reviews" on press_reviews;
drop policy if exists "Users can create their own press reviews" on press_reviews;
drop policy if exists "Users can update their own press reviews" on press_reviews;
drop policy if exists "Users can delete their own press reviews" on press_reviews;

-- =====================================================
-- Disable policies for generated_press_reviews table
-- =====================================================
drop policy if exists "Users can view their own generated reviews" on generated_press_reviews;
drop policy if exists "Users can create their own generated reviews" on generated_press_reviews;
drop policy if exists "Users can update their own generated reviews" on generated_press_reviews;
drop policy if exists "Users can delete their own generated reviews" on generated_press_reviews;

-- =====================================================
-- Disable policies for generation_logs table
-- =====================================================
drop policy if exists "Users can view their own generation logs" on generation_logs;
drop policy if exists "Users can create their own generation logs" on generation_logs;
drop policy if exists "Users can update their own generation logs" on generation_logs;
drop policy if exists "Users can delete their own generation logs" on generation_logs;

-- =====================================================
-- Disable policies for ratings table
-- =====================================================
drop policy if exists "Users can view their own ratings" on ratings;
drop policy if exists "Users can create their own ratings" on ratings;
drop policy if exists "Users can update their own ratings" on ratings;
drop policy if exists "Users can delete their own ratings" on ratings;

-- =====================================================
-- End of migration
-- =====================================================

