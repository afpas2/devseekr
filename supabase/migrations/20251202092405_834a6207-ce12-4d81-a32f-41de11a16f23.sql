-- Criar tabela de chamadas de projeto
CREATE TABLE project_calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  initiated_by UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'ended')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ
);

-- Criar tabela de participantes de chamadas
CREATE TABLE project_call_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id UUID NOT NULL REFERENCES project_calls(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  left_at TIMESTAMPTZ,
  UNIQUE(call_id, user_id)
);

-- Índices para performance
CREATE INDEX idx_project_calls_project_id ON project_calls(project_id);
CREATE INDEX idx_project_calls_status ON project_calls(status);
CREATE INDEX idx_project_call_participants_call_id ON project_call_participants(call_id);
CREATE INDEX idx_project_call_participants_user_id ON project_call_participants(user_id);

-- Habilitar RLS
ALTER TABLE project_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_call_participants ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para project_calls
-- Membros do projeto podem ver chamadas do projeto
CREATE POLICY "Membros podem ver chamadas do projeto"
  ON project_calls
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = project_calls.project_id
        AND project_members.user_id = auth.uid()
    ) OR EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_calls.project_id
        AND projects.owner_id = auth.uid()
    )
  );

-- Membros podem criar chamadas
CREATE POLICY "Membros podem criar chamadas"
  ON project_calls
  FOR INSERT
  WITH CHECK (
    auth.uid() = initiated_by AND (
      EXISTS (
        SELECT 1 FROM project_members
        WHERE project_members.project_id = project_calls.project_id
          AND project_members.user_id = auth.uid()
      ) OR EXISTS (
        SELECT 1 FROM projects
        WHERE projects.id = project_calls.project_id
          AND projects.owner_id = auth.uid()
      )
    )
  );

-- Quem iniciou pode atualizar status da chamada
CREATE POLICY "Iniciador pode atualizar chamada"
  ON project_calls
  FOR UPDATE
  USING (auth.uid() = initiated_by);

-- Políticas RLS para project_call_participants
-- Membros do projeto podem ver participantes
CREATE POLICY "Membros podem ver participantes"
  ON project_call_participants
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM project_calls pc
      JOIN project_members pm ON pc.project_id = pm.project_id
      WHERE pc.id = project_call_participants.call_id
        AND pm.user_id = auth.uid()
    ) OR EXISTS (
      SELECT 1 FROM project_calls pc
      JOIN projects p ON pc.project_id = p.id
      WHERE pc.id = project_call_participants.call_id
        AND p.owner_id = auth.uid()
    )
  );

-- Utilizadores podem entrar em chamadas
CREATE POLICY "Utilizadores podem entrar em chamadas"
  ON project_call_participants
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM project_calls pc
      WHERE pc.id = project_call_participants.call_id
        AND pc.status = 'active'
        AND (
          EXISTS (
            SELECT 1 FROM project_members
            WHERE project_members.project_id = pc.project_id
              AND project_members.user_id = auth.uid()
          ) OR EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = pc.project_id
              AND projects.owner_id = auth.uid()
          )
        )
    )
  );

-- Utilizadores podem atualizar sua própria participação
CREATE POLICY "Utilizadores podem atualizar sua participação"
  ON project_call_participants
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Habilitar realtime para as tabelas
ALTER PUBLICATION supabase_realtime ADD TABLE project_calls;
ALTER PUBLICATION supabase_realtime ADD TABLE project_call_participants;