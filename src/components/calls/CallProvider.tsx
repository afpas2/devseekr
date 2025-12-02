import { ReactNode, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { IncomingCallPopup } from './IncomingCallPopup';
import { useNavigate, useLocation } from 'react-router-dom';

interface Call {
  id: string;
  project_id: string;
  initiated_by: string;
}

interface Project {
  name: string;
}

export function CallProvider({ children }: { children: ReactNode }) {
  const [incomingCalls, setIncomingCalls] = useState<Map<string, Call>>(new Map());
  const [projectNames, setProjectNames] = useState<Map<string, string>>(new Map());
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
      }
    };
    getCurrentUser();
  }, []);

  useEffect(() => {
    if (!currentUserId) return;

    // Buscar projetos do utilizador
    const loadUserProjects = async () => {
      const { data: memberProjects } = await supabase
        .from('project_members')
        .select('project_id')
        .eq('user_id', currentUserId);

      const { data: ownedProjects } = await supabase
        .from('projects')
        .select('id')
        .eq('owner_id', currentUserId);

      const projectIds = [
        ...(memberProjects?.map(p => p.project_id) || []),
        ...(ownedProjects?.map(p => p.id) || []),
      ];

      // Carregar nomes dos projetos
      if (projectIds.length > 0) {
        const { data: projects } = await supabase
          .from('projects')
          .select('id, name')
          .in('id', projectIds);

        if (projects) {
          const names = new Map<string, string>();
          projects.forEach((p: Project & { id: string }) => names.set(p.id, p.name));
          setProjectNames(names);
        }

        // Subscrever a chamadas em todos os projetos do utilizador
        projectIds.forEach(projectId => {
          const channel = supabase
            .channel(`global-calls-${projectId}`)
            .on(
              'postgres_changes',
              {
                event: 'INSERT',
                schema: 'public',
                table: 'project_calls',
                filter: `project_id=eq.${projectId}`,
              },
              (payload) => {
                const call = payload.new as Call;
                
                // Não mostrar se o utilizador iniciou a chamada
                if (call.initiated_by === currentUserId) return;

                // Não mostrar se já está na página do projeto
                if (location.pathname.includes(call.project_id)) return;

                setIncomingCalls(prev => {
                  const newCalls = new Map(prev);
                  newCalls.set(call.id, call);
                  return newCalls;
                });
              }
            )
            .subscribe();

          return () => {
            supabase.removeChannel(channel);
          };
        });
      }
    };

    loadUserProjects();
  }, [currentUserId, location.pathname]);

  const handleAcceptCall = (call: Call) => {
    setIncomingCalls(prev => {
      const newCalls = new Map(prev);
      newCalls.delete(call.id);
      return newCalls;
    });
    navigate(`/projects/${call.project_id}`);
  };

  const handleDeclineCall = (callId: string) => {
    setIncomingCalls(prev => {
      const newCalls = new Map(prev);
      newCalls.delete(callId);
      return newCalls;
    });
  };

  return (
    <>
      {children}
      
      {Array.from(incomingCalls.values()).map((call, index) => (
        <div
          key={call.id}
          style={{ bottom: `${6 + index * 180}px` }}
          className="fixed right-6"
        >
          <IncomingCallPopup
            callId={call.id}
            projectName={projectNames.get(call.project_id) || 'Projeto'}
            initiatorId={call.initiated_by}
            onAccept={() => handleAcceptCall(call)}
            onDecline={() => handleDeclineCall(call.id)}
          />
        </div>
      ))}
    </>
  );
}