import { useState, useEffect } from 'react';
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

export function useProjectCalls(projectId: string | undefined) {
  const [activeCall, setActiveCall] = useState<Call | null>(null);
  const [participants, setParticipants] = useState<CallParticipant[]>([]);
  const [incomingCall, setIncomingCall] = useState<Call | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
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

  useEffect(() => {
    if (!projectId || !currentUserId) return;

    // Carregar chamada ativa
    loadActiveCall();

    // Subscrever a mudanças em chamadas
    const callsChannel = supabase
      .channel(`project-calls-${projectId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'project_calls',
          filter: `project_id=eq.${projectId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newCall = payload.new as Call;
            if (newCall.initiated_by !== currentUserId) {
              setIncomingCall(newCall);
            }
            loadActiveCall();
          } else if (payload.eventType === 'UPDATE') {
            loadActiveCall();
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'project_call_participants',
        },
        () => {
          loadParticipants();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(callsChannel);
    };
  }, [projectId, currentUserId]);

  const loadActiveCall = async () => {
    if (!projectId) return;

    const { data, error } = await supabase
      .from('project_calls')
      .select('*')
      .eq('project_id', projectId)
      .eq('status', 'active')
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Erro ao carregar chamada:', error);
      return;
    }

    setActiveCall(data as Call | null);
    if (data) {
      loadParticipants();
    } else {
      setParticipants([]);
    }
  };

  const loadParticipants = async () => {
    if (!activeCall) return;

    const { data: participantsData, error } = await supabase
      .from('project_call_participants')
      .select('*')
      .eq('call_id', activeCall.id)
      .is('left_at', null);

    if (error) {
      console.error('Erro ao carregar participantes:', error);
      return;
    }

    // Buscar perfis dos participantes
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

  const startCall = async () => {
    if (!projectId || !currentUserId) return;

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

    // Automaticamente entrar na chamada
    await joinCall(data.id);
  };

  const joinCall = async (callId: string) => {
    if (!currentUserId) return;

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

    setIncomingCall(null);
    toast({
      title: 'Entrou na chamada',
      description: 'Conectando áudio...',
    });
  };

  const leaveCall = async () => {
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

    toast({
      title: 'Saiu da chamada',
    });
  };

  const endCall = async () => {
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
  };

  const acceptIncoming = async () => {
    if (!incomingCall) return;
    await joinCall(incomingCall.id);
  };

  const declineIncoming = () => {
    setIncomingCall(null);
    toast({
      title: 'Chamada recusada',
    });
  };

  const isInCall = participants.some(p => p.user_id === currentUserId);

  return {
    activeCall,
    participants,
    incomingCall,
    isInCall,
    startCall,
    joinCall,
    leaveCall,
    endCall,
    acceptIncoming,
    declineIncoming,
  };
}