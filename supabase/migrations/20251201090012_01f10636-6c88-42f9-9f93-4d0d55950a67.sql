-- Create portfolio items table
CREATE TABLE user_portfolio_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('screenshot', 'video', 'link')),
  url TEXT NOT NULL,
  thumbnail_url TEXT,
  project_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS for portfolio items
ALTER TABLE user_portfolio_items ENABLE ROW LEVEL SECURITY;

-- Portfolio items are viewable by everyone
CREATE POLICY "Portfolio items são visíveis por todos"
  ON user_portfolio_items
  FOR SELECT
  USING (true);

-- Users can manage their own portfolio items
CREATE POLICY "Utilizadores podem gerir os seus próprios itens de portfolio"
  ON user_portfolio_items
  FOR ALL
  USING (auth.uid() = user_id);

-- Create reviews table
CREATE TABLE user_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reviewer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reviewed_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(reviewer_id, reviewed_id, project_id)
);

-- Enable RLS for reviews
ALTER TABLE user_reviews ENABLE ROW LEVEL SECURITY;

-- Reviews are viewable by everyone
CREATE POLICY "Reviews são visíveis por todos"
  ON user_reviews
  FOR SELECT
  USING (true);

-- Users can create reviews for people they worked with
CREATE POLICY "Utilizadores podem criar reviews para quem trabalhou com eles"
  ON user_reviews
  FOR INSERT
  WITH CHECK (
    auth.uid() = reviewer_id 
    AND reviewer_id != reviewed_id
    AND EXISTS (
      SELECT 1 FROM projects p
      INNER JOIN project_members pm1 ON p.id = pm1.project_id
      INNER JOIN project_members pm2 ON p.id = pm2.project_id
      WHERE p.status = 'concluido'
        AND pm1.user_id = reviewer_id
        AND pm2.user_id = reviewed_id
        AND p.id = user_reviews.project_id
    )
  );

-- Create portfolio-images storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('portfolio-images', 'portfolio-images', true);

-- Storage policies for portfolio-images
CREATE POLICY "Portfolio images são publicamente acessíveis"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'portfolio-images');

CREATE POLICY "Utilizadores podem fazer upload das suas próprias imagens de portfolio"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'portfolio-images' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Utilizadores podem atualizar as suas próprias imagens de portfolio"
  ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'portfolio-images' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Utilizadores podem eliminar as suas próprias imagens de portfolio"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'portfolio-images' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );