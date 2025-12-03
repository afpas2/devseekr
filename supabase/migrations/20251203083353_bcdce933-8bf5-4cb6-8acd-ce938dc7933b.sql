-- Limpar chamadas fantasma (terminar todas as chamadas ativas)
UPDATE project_calls SET status = 'ended', ended_at = now() WHERE status = 'active';