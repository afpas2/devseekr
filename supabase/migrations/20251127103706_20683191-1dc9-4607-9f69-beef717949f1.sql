-- Adicionar campo looking_for_roles à tabela projects
ALTER TABLE projects ADD COLUMN looking_for_roles TEXT[];

-- Criar tabela de pedidos de entrada em projetos
CREATE TABLE project_join_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  message TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(project_id, user_id)
);

-- Criar índices para performance
CREATE INDEX idx_project_join_requests_project_id ON project_join_requests(project_id);
CREATE INDEX idx_project_join_requests_user_id ON project_join_requests(user_id);
CREATE INDEX idx_project_join_requests_status ON project_join_requests(status);

-- Enable RLS
ALTER TABLE project_join_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies para project_join_requests

-- Owners do projeto podem ver todos os pedidos do seu projeto
CREATE POLICY "Project owners can view join requests"
ON project_join_requests
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = project_join_requests.project_id
    AND projects.owner_id = auth.uid()
  )
);

-- Users podem ver os seus próprios pedidos
CREATE POLICY "Users can view their own join requests"
ON project_join_requests
FOR SELECT
USING (auth.uid() = user_id);

-- Users autenticados podem criar pedidos
CREATE POLICY "Authenticated users can create join requests"
ON project_join_requests
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Owners podem atualizar status dos pedidos (aceitar/rejeitar)
CREATE POLICY "Project owners can update join request status"
ON project_join_requests
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = project_join_requests.project_id
    AND projects.owner_id = auth.uid()
  )
);

-- Users podem deletar os seus próprios pedidos pendentes
CREATE POLICY "Users can delete their own pending requests"
ON project_join_requests
FOR DELETE
USING (
  auth.uid() = user_id 
  AND status = 'pending'
);

-- Ativar Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE project_join_requests;