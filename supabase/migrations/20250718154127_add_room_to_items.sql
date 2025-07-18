-- Add room column to items table
-- Room can be: kitchen, lounge, balcony, bedroom, office, bathroom, hallway, storage
-- NULL represents "unknown" room
ALTER TABLE public.items 
ADD COLUMN room TEXT CHECK (room IN ('kitchen', 'lounge', 'balcony', 'bedroom', 'office', 'bathroom', 'hallway', 'storage'));