-- Make address column required (NOT NULL)
ALTER TABLE public.locations 
ALTER COLUMN address SET NOT NULL;