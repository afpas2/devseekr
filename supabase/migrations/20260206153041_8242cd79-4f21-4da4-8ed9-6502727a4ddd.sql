-- Security Fix: Restrict profiles table to authenticated users only
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON profiles;
CREATE POLICY "Profiles are viewable by authenticated users"
ON profiles FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Security Fix: Restrict reviews table to authenticated users only
DROP POLICY IF EXISTS "Anyone can view reviews" ON reviews;
CREATE POLICY "Reviews are viewable by authenticated users"
ON reviews FOR SELECT
USING (auth.uid() IS NOT NULL);