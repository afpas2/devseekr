-- Add RPG-style fields to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS level TEXT DEFAULT 'Beginner';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS class TEXT;

-- Add methodology field to projects table
ALTER TABLE projects ADD COLUMN IF NOT EXISTS methodology TEXT DEFAULT 'Casual';