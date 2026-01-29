-- Add stamina/application tracking fields to profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS applications_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_application_reset TIMESTAMPTZ DEFAULT now();

-- Add policy to allow users to update their own applications count
CREATE POLICY "Users can update their own application count" 
ON profiles 
FOR UPDATE 
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);