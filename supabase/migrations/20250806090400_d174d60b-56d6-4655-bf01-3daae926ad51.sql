-- Check what foreign key constraint "favorites_id_fkey" references
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu 
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY';

-- Drop the problematic constraint and recreate proper ones
ALTER TABLE public.favorites DROP CONSTRAINT IF EXISTS favorites_id_fkey;

-- Add correct foreign key constraints
ALTER TABLE public.favorites 
ADD CONSTRAINT favorites_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.favorites 
ADD CONSTRAINT favorites_folktale_id_fkey 
FOREIGN KEY (folktale_id) REFERENCES public.folktales(id) ON DELETE CASCADE;