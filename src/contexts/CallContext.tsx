import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Call {
  id: string;
  project_id: string;
  initiated_by: string;
  status: 'active' | 'ended';
  started_at: string;
  ended_at?: string;
}

export interface CallParticipant {
  id: string;
  call_id: string;
  user_id: string;
  joined_at: string;
  left_at?: string;
  profile?: {
    username: string;
    avatar_url?: string;
    full_name: string;
  };
}

interface CallContextType {
  activeCall: Call | null;
  participants: CallParticipant[];
  isInCall: boolean;
  isMinimized: boolean;
  isMuted: boolean;
  currentUserId: string | null;
  projectName: string;
  startCall: (projectId: string) => Promise<void>;
  joinCall: (callId: string) => Promise<void>;
  leaveCall: () => Promise<void>;
  endCall: () => Promise<void>;
  toggleMinimize: () => void;
  toggleMute: () => void;
  setProjectName: (name: string) => void;
}

const CallContext = createContext<CallContextType | null>(null);

export function CallContextProvider({ children }: { children: ReactNode }) {
  const [activeCall, setActiveCall] = useState<Call | null>(null);
  const [participants, setParticipants] = useState<CallParticipant[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [projectName, setProjectName] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
      }
    };
    getCurrentUser();
  }, []);

  // Subscrever a mudanças quando está em chamada
  useEffect(() => {
    if (!activeCall) return;

    const channel = supabase
      .channel(`call-${activeCall.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'project_calls',
          filter: `id=eq.${activeCall.id}`,
        },
        (payload) => {
          if (payload.eventType === 'UPDATE') {
            const updated = payload.new as Call;
            if (updated.status === 'ended') {
              setActiveCall(null);
              setParticipants([]);
              toast({
                title: 'Chamada terminada',
                description: 'A chamada foi encerrada.',
              });
            }
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'project_call_participants',
          filter: `call_id=eq.${activeCall.id}`,
        },
        () => {
          loadParticipants(activeCall.id);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeCall?.id]);

  const loadParticipants = async (callId: string) => {
    const { data: participantsData, error } = await supabase
      .from('project_call_participants')
      .select('*')
      .eq('call_id', callId)
      .is('left_at', null);

    if (error) {
      console.error('Erro ao carregar participantes:', error);
      return;
    }

    if (participantsData && participantsData.length > 0) {
      const userIds = participantsData.map(p => p.user_id);
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, username, avatar_url, full_name')
        .in('id', userIds);

      const profilesMap = new Map(profilesData?.map(p => [p.id, p]));

      const participantsWithProfiles = participantsData.map(p => ({
        ...p,
        profile: profilesMap.get(p.user_id),
      }));

      setParticipants(participantsWithProfiles as CallParticipant[]);
    } else {
      setParticipants([]);
    }
  };

  const startCall = useCallback(async (projectId: string) => {
    if (!currentUserId) return;

    // Verificar se já existe chamada ativa
    const { data: existingCall } = await supabase
      .from('project_calls')
      .select('*')
      .eq('project_id', projectId)
      .eq('status', 'active')
      .single();

    if (existingCall) {
      // Entrar na chamada existente em vez de criar nova
      await joinCall(existingCall.id);
      return;
    }

    const { data, error } = await supabase
      .from('project_calls')
      .insert({
        project_id: projectId,
        initiated_by: currentUserId,
      })
      .select()
      .single();

    if (error) {
      toast({
        title: 'Erro ao iniciar chamada',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }

    await joinCall(data.id);
  }, [currentUserId, toast]);

  const joinCall = useCallback(async (callId: string) => {
    if (!currentUserId) return;

    // Verificar se já é participante
    const { data: existingParticipant } = await supabase
      .from('project_call_participants')
      .select('id')
      .eq('call_id', callId)
      .eq('user_id', currentUserId)
      .is('left_at', null)
      .single();

    if (existingParticipant) {
      // Já está na chamada, apenas carregar dados
      const { data: callData } = await supabase
        .from('project_calls')
        .select('*')
        .eq('id', callId)
        .single();
      
      if (callData) {
        setActiveCall(callData as Call);
        await loadParticipants(callId);
      }
      return;
    }

    const { error } = await supabase
      .from('project_call_participants')
      .insert({
        call_id: callId,
        user_id: currentUserId,
      });

    if (error) {
      toast({
        title: 'Erro ao entrar na chamada',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }

    const { data: callData } = await supabase
      .from('project_calls')
      .select('*')
      .eq('id', callId)
      .single();

    if (callData) {
      setActiveCall(callData as Call);
      await loadParticipants(callId);
      setIsMinimized(false);
      toast({
        title: 'Entrou na chamada',
        description: 'Conectado com sucesso!',
      });
    }
  }, [currentUserId, toast]);

  const leaveCall = useCallback(async () => {
    if (!activeCall || !currentUserId) return;

    const participant = participants.find(p => p.user_id === currentUserId);
    if (!participant) return;

    const { error } = await supabase
      .from('project_call_participants')
      .update({ left_at: new Date().toISOString() })
      .eq('id', participant.id);

    if (error) {
      toast({
        title: 'Erro ao sair da chamada',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }

    // Verificar se é o último participante
    const remainingParticipants = participants.filter(p => p.user_id !== currentUserId);
    if (remainingParticipants.length === 0) {
      // Encerrar chamada automaticamente
      await supabase
        .from('project_calls')
        .update({ status: 'ended', ended_at: new Date().toISOString() })
        .eq('id', activeCall.id);
    }

    setActiveCall(null);
    setParticipants([]);
    setIsMinimized(false);
    toast({
      title: 'Saiu da chamada',
    });
  }, [activeCall, currentUserId, participants, toast]);

  const endCall = useCallback(async () => {
    if (!activeCall || !currentUserId) return;

    if (activeCall.initiated_by !== currentUserId) {
      toast({
        title: 'Sem permissão',
        description: 'Apenas quem iniciou a chamada pode encerrá-la.',
        variant: 'destructive',
      });
      return;
    }

    const { error } = await supabase
      .from('project_calls')
      .update({ status: 'ended', ended_at: new Date().toISOString() })
      .eq('id', activeCall.id);

    if (error) {
      toast({
        title: 'Erro ao encerrar chamada',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }

    setActiveCall(null);
    setParticipants([]);
    setIsMinimized(false);
  }, [activeCall, currentUserId, toast]);

  const toggleMinimize = useCallback(() => {
    setIsMinimized(prev => !prev);
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted(prev => !prev);
  }, []);

  const isInCall = participants.some(p => p.user_id === currentUserId);

  return (
    <CallContext.Provider
      value={{
        activeCall,
        participants,
        isInCall,
        isMinimized,
        isMuted,
        currentUserId,
        projectName,
        startCall,
        joinCall,
        leaveCall,
        endCall,
        toggleMinimize,
        toggleMute,
        setProjectName,
      }}
    >
      {children}
    </CallContext.Provider>
  );
}

export function useCallContext() {
  const context = useContext(CallContext);
  if (!context) {
    throw new Error('useCallContext deve ser usado dentro de CallContextProvider');
  }
  return context;
}
