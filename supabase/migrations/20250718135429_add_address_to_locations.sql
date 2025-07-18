-- Add address column to locations table
ALTER TABLE public.locations 
ADD COLUMN address TEXT;