import { Phone, PhoneCall } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCallContext } from '@/contexts/CallContext';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ProjectCallButtonProps {
  projectId: string;
  projectName: string;
}

export function ProjectCallButton({ projectId, projectName }: ProjectCallButtonProps) {
  const { startCall, joinCall, isInCall, activeCall, setProjectName } = useCallContext();
  const [projectActiveCall, setProjectActiveCall] = useState<{ id: string } | null>(null);

  useEffect(() => {
    setProjectName(projectName);
  }, [projectName, setProjectName]);

  useEffect(() => {
    // Verificar se existe chamada ativa no projeto
    const checkActiveCall = async () => {
      const { data } = await supabase
        .from('project_calls')
        .select('id')
        .eq('project_id', projectId)
        .eq('status', 'active')
        .single();

      setProjectActiveCall(data);
    };

    checkActiveCall();

    // Subscrever a mudanças
    const channel = supabase
      .channel(`project-call-button-${projectId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'project_calls',
          filter: `project_id=eq.${projectId}`,
        },
        () => {
          checkActiveCall();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId]);

  // Se já está nesta chamada, não mostrar botão
  if (isInCall && activeCall?.project_id === projectId) {
    return null;
  }

  const hasActiveCall = !!projectActiveCall;

  const handleClick = () => {
    if (hasActiveCall && projectActiveCall) {
      joinCall(projectActiveCall.id);
    } else {
      startCall(projectId);
    }
  };

  return (
    <Button
      onClick={handleClick}
      className="w-full gap-2"
      variant={hasActiveCall ? "default" : "outline"}
    >
      {hasActiveCall ? (
        <>
          <PhoneCall className="h-4 w-4" />
          Entrar na Chamada
        </>
      ) : (
        <>
          <Phone className="h-4 w-4" />
          Iniciar Chamada de Voz
        </>
      )}
    </Button>
  );
}
