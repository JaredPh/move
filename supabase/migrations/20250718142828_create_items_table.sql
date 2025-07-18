-- Create items table
CREATE TABLE IF NOT EXISTS public.items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    box_id INT REFERENCES public.boxes(id) ON DELETE SET NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    fragile BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    name TEXT,
    description TEXT
);

-- Create standalone items table
CREATE TABLE IF NOT EXISTS public.standalone_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    location_id UUID REFERENCES public.locations(id) ON DELETE SET NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    fragile BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    name TEXT,
    description TEXT
);


-- Enable Row Level Security (RLS) on standalone items table
ALTER TABLE public.standalone_items ENABLE ROW LEVEL SECURITY;

-- Enable Row Level Security (RLS) on items table
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;

-- Create policies for items table
CREATE POLICY "Users can view their own items" ON public.items
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own items" ON public.items
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own items" ON public.items
    FOR UPDATE USING (auth.uid() = user_id);

-- Create trigger to update updated_at on items table
CREATE OR REPLACE TRIGGER update_items_updated_at
    BEFORE UPDATE ON public.items
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- Enable Row Level Security (RLS) on standalone items table
ALTER TABLE public.standalone_items ENABLE ROW LEVEL SECURITY;

-- Create policies for standalone items table
CREATE POLICY "Users can view their own standalone items" ON public.standalone_items
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own standalone items" ON public.standalone_items
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own standalone items" ON public.standalone_items
    FOR UPDATE USING (auth.uid() = user_id);

-- Create trigger to update updated_at on standalone items table
CREATE OR REPLACE TRIGGER update_standalone_items_updated_at
    BEFORE UPDATE ON public.standalone_items
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();