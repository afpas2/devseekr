-- Create project-images bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('project-images', 'project-images', true);

-- Create avatars bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true);

-- Policies for project-images bucket
CREATE POLICY "Anyone can view project images" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'project-images');

CREATE POLICY "Authenticated users can upload project images" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'project-images' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their own project images" 
ON storage.objects FOR UPDATE 
USING (bucket_id = 'project-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own project images" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'project-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Policies for avatars bucket
CREATE POLICY "Anyone can view avatars" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'avatars');

CREATE POLICY "Authenticated users can upload avatars" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their own avatar" 
ON storage.objects FOR UPDATE 
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own avatar" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);