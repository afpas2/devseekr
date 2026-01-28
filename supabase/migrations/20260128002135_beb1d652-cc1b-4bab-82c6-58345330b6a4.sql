-- Drop the old user_reviews table
DROP TABLE IF EXISTS user_reviews;

-- Create new reviews table with comprehensive structure
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reviewee_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rating_overall INTEGER NOT NULL CHECK (rating_overall >= 1 AND rating_overall <= 5),
  metrics JSONB DEFAULT '{}',
  would_work_again BOOLEAN,
  recommend BOOLEAN,
  role_played TEXT,
  commitment_level TEXT,
  comment TEXT,
  flags JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  
  -- Prevent duplicate reviews
  UNIQUE(project_id, reviewer_id, reviewee_id)
);

-- Enable RLS
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can create reviews for completed projects" ON reviews
  FOR INSERT WITH CHECK (
    auth.uid() = reviewer_id 
    AND reviewer_id != reviewee_id
    AND EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_id 
      AND p.status = 'concluido'
    )
    AND (
      EXISTS (
        SELECT 1 FROM project_members pm 
        WHERE pm.project_id = reviews.project_id 
        AND pm.user_id = auth.uid()
      )
      OR EXISTS (
        SELECT 1 FROM projects p 
        WHERE p.id = reviews.project_id 
        AND p.owner_id = auth.uid()
      )
    )
  );

CREATE POLICY "Anyone can view reviews" ON reviews
  FOR SELECT USING (true);