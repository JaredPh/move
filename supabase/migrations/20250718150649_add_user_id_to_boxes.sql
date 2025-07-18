-- Add user_id column to boxes table
ALTER TABLE public.boxes 
ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Update existing boxes to have the user_id from their location
UPDATE public.boxes 
SET user_id = locations.user_id
FROM public.locations 
WHERE boxes.location_id = locations.id;

-- Make user_id required (NOT NULL)
ALTER TABLE public.boxes 
ALTER COLUMN user_id SET NOT NULL;

-- Drop existing RLS policies
DROP POLICY IF EXISTS "Users can view boxes in their locations" ON public.boxes;
DROP POLICY IF EXISTS "Users can insert boxes into their locations" ON public.boxes;
DROP POLICY IF EXISTS "Users can update boxes in their locations" ON public.boxes;
DROP POLICY IF EXISTS "Users can delete boxes in their locations" ON public.boxes;

-- Create new RLS policies based on user_id
-- Users can view their own boxes
CREATE POLICY "Users can view their own boxes" ON public.boxes
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own boxes
CREATE POLICY "Users can insert their own boxes" ON public.boxes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own boxes
CREATE POLICY "Users can update their own boxes" ON public.boxes
    FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own boxes
CREATE POLICY "Users can delete their own boxes" ON public.boxes
    FOR DELETE USING (auth.uid() = user_id);