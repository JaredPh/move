-- Remove description column from items table
ALTER TABLE public.items 
DROP COLUMN IF EXISTS description;