-- Create boxes table
CREATE TABLE IF NOT EXISTS public.boxes (
    id SERIAL PRIMARY KEY,
    location_id UUID REFERENCES public.locations(id) ON DELETE SET NULL,
    open BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    size TEXT,
    fragile BOOLEAN DEFAULT FALSE
);

-- Enable Row Level Security (RLS) on boxes table
ALTER TABLE public.boxes ENABLE ROW LEVEL SECURITY;

-- Create policies for boxes table
-- Users can view boxes that belong to their locations
CREATE POLICY "Users can view boxes in their locations" ON public.boxes
    FOR SELECT USING (
        location_id IS NULL OR 
        location_id IN (SELECT id FROM public.locations WHERE user_id = auth.uid())
    );

-- Users can insert boxes into their locations
CREATE POLICY "Users can insert boxes into their locations" ON public.boxes
    FOR INSERT WITH CHECK (
        location_id IS NULL OR 
        location_id IN (SELECT id FROM public.locations WHERE user_id = auth.uid())
    );

-- Users can update boxes in their locations
CREATE POLICY "Users can update boxes in their locations" ON public.boxes
    FOR UPDATE USING (
        location_id IS NULL OR 
        location_id IN (SELECT id FROM public.locations WHERE user_id = auth.uid())
    );

-- Users can delete boxes in their locations
CREATE POLICY "Users can delete boxes in their locations" ON public.boxes
    FOR DELETE USING (
        location_id IS NULL OR 
        location_id IN (SELECT id FROM public.locations WHERE user_id = auth.uid())
    );

-- Create trigger to update updated_at on boxes table
CREATE OR REPLACE TRIGGER update_boxes_updated_at
    BEFORE UPDATE ON public.boxes
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();