-- =====================================================
-- Migration: Relax constraints for on-demand generation
-- Created: 2025-10-14
-- Description: Makes generated_at, generation_log_id and content nullable in generated_press_reviews; drops default now() on generated_at.
-- =====================================================

-- 1) Allow generated_at to be NULL and remove default
alter table generated_press_reviews
  alter column generated_at drop not null,
  alter column generated_at drop default;

-- 2) Make generation_log_id nullable (reverting previous NOT NULL constraint)
alter table generated_press_reviews
  alter column generation_log_id drop not null;

-- 3) Make content nullable until generation is complete
alter table generated_press_reviews
  alter column content drop not null;

-- =====================================================
-- End of migration
-- =====================================================
