-- Create music storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'music', 
  'music', 
  true, 
  52428800, -- 50MB limit
  ARRAY['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/m4a']
);

-- Create RLS policies for music bucket
CREATE POLICY "Anyone can view music files" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'music');

CREATE POLICY "Users can upload music files" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'music' AND 
  auth.uid() IS NOT NULL
);

CREATE POLICY "Users can update their own music files" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'music' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own music files" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'music' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Create table to store music metadata
CREATE TABLE public.user_music (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  artist TEXT,
  file_path TEXT NOT NULL,
  file_size BIGINT,
  duration INTEGER, -- in seconds
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on user_music table
ALTER TABLE public.user_music ENABLE ROW LEVEL SECURITY;

-- Create policies for user_music table
CREATE POLICY "Users can view all music" 
ON public.user_music 
FOR SELECT 
USING (true);

CREATE POLICY "Users can upload their own music" 
ON public.user_music 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own music" 
ON public.user_music 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own music" 
ON public.user_music 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_user_music_updated_at
BEFORE UPDATE ON public.user_music
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();