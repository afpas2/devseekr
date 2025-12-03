import { ReactNode, useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { IncomingCallPopup } from './IncomingCallPopup';
import { CallOverlay } from './CallOverlay';
import { CallContextProvider, useCallContext } from '@/contexts/CallContext';
import { useNavigate, useLocation } from 'react-router-dom';

interface Call {
  id: string;
  project_id: string;
  initiated_by: string;
}

function IncomingCallsManager() {
  const [incomingCalls, setIncomingCalls] = useState<Map<string, Call>>(new Map());
  const [projectNames, setProjectNames] = useState<Map<string, string>>(new Map());
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const channelsRef = useRef<ReturnType<typeof supabase.channel>[]>([]);
  const { joinCall, isInCall } = useCallContext();

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

    const loadUserProjects = async () => {
      // Limpar canais anteriores
      channelsRef.current.forEach(channel => {
        supabase.removeChannel(channel);
      });
      channelsRef.current = [];

      const { data: memberProjects } = await supabase
        .from('project_members')
        .select('project_id')
        .eq('user_id', currentUserId);

      const { data: ownedProjects } = await supabase
        .from('projects')
        .select('id')
        .eq('owner_id', currentUserId);

      const projectIds = new Set([
        ...(memberProjects?.map(p => p.project_id) || []),
        ...(ownedProjects?.map(p => p.id) || []),
      ]);

      if (projectIds.size === 0) return;

      // Carregar nomes dos projetos
      const { data: projects } = await supabase
        .from('projects')
        .select('id, name')
        .in('id', Array.from(projectIds));

      if (projects) {
        const names = new Map<string, string>();
        projects.forEach(p => names.set(p.id, p.name));
        setProjectNames(names);
      }

      // Criar um único canal para todos os projetos
      const channel = supabase
        .channel('global-calls-listener')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'project_calls',
          },
          (payload) => {
            const call = payload.new as Call;
            
            // Verificar se é projeto do utilizador
            if (!projectIds.has(call.project_id)) return;
            
            // Não mostrar se o utilizador iniciou a chamada
            if (call.initiated_by === currentUserId) return;

            // Não mostrar se já está na página do projeto
            if (location.pathname.includes(call.project_id)) return;

            // Não mostrar se já está numa chamada
            if (isInCall) return;

            setIncomingCalls(prev => {
              const newCalls = new Map(prev);
              newCalls.set(call.id, call);
              return newCalls;
            });

            // Auto-remover após 30 segundos
            setTimeout(() => {
              setIncomingCalls(prev => {
                const newCalls = new Map(prev);
                newCalls.delete(call.id);
                return newCalls;
              });
            }, 30000);
          }
        )
        .subscribe();

      channelsRef.current.push(channel);
    };

    loadUserProjects();

    return () => {
      channelsRef.current.forEach(channel => {
        supabase.removeChannel(channel);
      });
      channelsRef.current = [];
    };
  }, [currentUserId, location.pathname, isInCall]);

  const handleAcceptCall = async (call: Call) => {
    setIncomingCalls(prev => {
      const newCalls = new Map(prev);
      newCalls.delete(call.id);
      return newCalls;
    });
    
    await joinCall(call.id);
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
      {Array.from(incomingCalls.values()).map((call, index) => (
        <div
          key={call.id}
          style={{ bottom: `${24 + index * 200}px` }}
          className="fixed right-6 z-[60]"
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

export function GlobalCallProvider({ children }: { children: ReactNode }) {
  return (
    <CallContextProvider>
      {children}
      <CallOverlay />
      <IncomingCallsManager />
    </CallContextProvider>
  );
}
