-- Remove fragile column from boxes table
-- The fragile status will now be derived from the items in the box
ALTER TABLE public.boxes 
DROP COLUMN IF EXISTS fragile;