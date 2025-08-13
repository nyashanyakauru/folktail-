-- Create user_notes table for storing notes and key takeaways
CREATE TABLE public.user_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  folktale_id UUID NOT NULL,
  notes TEXT,
  key_takeaways TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, folktale_id)
);

-- Create reading_progress table for tracking reading completion
CREATE TABLE public.reading_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  folktale_id UUID NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, folktale_id)
);

-- Enable RLS on both tables
ALTER TABLE public.user_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reading_progress ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_notes
CREATE POLICY "Users can view their own notes" 
ON public.user_notes 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own notes" 
ON public.user_notes 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notes" 
ON public.user_notes 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notes" 
ON public.user_notes 
FOR DELETE 
USING (auth.uid() = user_id);

-- RLS policies for reading_progress
CREATE POLICY "Users can view their own reading progress" 
ON public.reading_progress 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own reading progress" 
ON public.reading_progress 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reading progress" 
ON public.reading_progress 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Add foreign key constraints
ALTER TABLE public.user_notes 
ADD CONSTRAINT user_notes_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.user_notes 
ADD CONSTRAINT user_notes_folktale_id_fkey 
FOREIGN KEY (folktale_id) REFERENCES public.folktales(id) ON DELETE CASCADE;

ALTER TABLE public.reading_progress 
ADD CONSTRAINT reading_progress_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.reading_progress 
ADD CONSTRAINT reading_progress_folktale_id_fkey 
FOREIGN KEY (folktale_id) REFERENCES public.folktales(id) ON DELETE CASCADE;

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates on user_notes
CREATE TRIGGER update_user_notes_updated_at
BEFORE UPDATE ON public.user_notes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();