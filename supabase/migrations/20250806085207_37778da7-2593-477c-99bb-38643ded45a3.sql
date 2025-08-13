-- Create policy to allow everyone to read folktales (public data)
CREATE POLICY "Allow public read access to folktales" 
ON public.folktales 
FOR SELECT 
USING (true);

-- Create policies for favorites table (user-specific data)
CREATE POLICY "Users can view their own favorites" 
ON public.favorites 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own favorites" 
ON public.favorites 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own favorites" 
ON public.favorites 
FOR DELETE 
USING (auth.uid() = user_id);