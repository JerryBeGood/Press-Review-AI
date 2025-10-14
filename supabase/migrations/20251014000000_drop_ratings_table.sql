-- =====================================================
-- Migration: Drop ratings table
-- Created: 2025-10-14
-- Description: Removes the ratings table as per updated PRD
-- =====================================================

-- Drop the ratings table
-- CASCADE will automatically drop dependent objects (indexes, constraints)
drop table if exists ratings cascade;

-- =====================================================
-- End of migration
-- =====================================================

