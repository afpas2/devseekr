-- FASE 1: CORREÇÕES DE SEGURANÇA CRÍTICAS

-- 1. Remover políticas perigosas da tabela user_subscriptions
-- Estas políticas permitem que utilizadores modifiquem as suas próprias subscriptions
DROP POLICY IF EXISTS "Users can insert their own subscription" ON user_subscriptions;
DROP POLICY IF EXISTS "Users can update their own subscription" ON user_subscriptions;

-- Manter apenas a política SELECT (utilizadores podem ver a sua subscription)
-- A política "Users can view their own subscription" já existe e está correta

-- 2. Corrigir política INSERT de notifications (prevenir spam)
-- Remover a política atual que permite qualquer INSERT
DROP POLICY IF EXISTS "System can create notifications" ON notifications;

-- Criar política mais restritiva: apenas o sender pode criar notificações
-- e não pode enviar para si próprio
CREATE POLICY "Users can create notifications with valid sender"
ON notifications FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL AND
  (sender_id IS NULL OR auth.uid() = sender_id) AND
  auth.uid() <> recipient_id
);

-- 3. Adicionar política DELETE para project_invitations
-- Permite que owners de projetos eliminem convites
CREATE POLICY "Project owners can delete invitations"
ON project_invitations FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = project_invitations.project_id
    AND projects.owner_id = auth.uid()
  )
);