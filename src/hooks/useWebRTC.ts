import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface SignalingMessage {
  type: 'offer' | 'answer' | 'ice-candidate';
  from: string;
  to?: string;
  data: any;
}

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

export function useWebRTC(callId: string | null, userId: string | null) {
  const [isMuted, setIsMuted] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());
  
  const peerConnections = useRef<Map<string, RTCPeerConnection>>(new Map());
  const localStream = useRef<MediaStream | null>(null);
  const signalingChannel = useRef<any>(null);

  useEffect(() => {
    if (!callId || !userId) return;

    initializeMedia();
    setupSignaling();

    return () => {
      cleanup();
    };
  }, [callId, userId]);

  const initializeMedia = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      localStream.current = stream;
    } catch (error) {
      console.error('Erro ao acessar microfone:', error);
    }
  };

  const setupSignaling = () => {
    if (!callId) return;

    signalingChannel.current = supabase
      .channel(`call-signaling-${callId}`)
      .on('broadcast', { event: 'signaling' }, async ({ payload }) => {
        const message = payload as SignalingMessage;

        if (message.to && message.to !== userId) return;
        if (message.from === userId) return;

        switch (message.type) {
          case 'offer':
            await handleOffer(message.from, message.data);
            break;
          case 'answer':
            await handleAnswer(message.from, message.data);
            break;
          case 'ice-candidate':
            await handleIceCandidate(message.from, message.data);
            break;
        }
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          // Criar ofertas para todos os participantes existentes
          await createOffers();
        }
      });
  };

  const createOffers = async () => {
    if (!callId || !userId) return;

    const { data: participants } = await supabase
      .from('project_call_participants')
      .select('user_id')
      .eq('call_id', callId)
      .is('left_at', null);

    if (!participants) return;

    for (const participant of participants) {
      if (participant.user_id !== userId) {
        await createPeerConnection(participant.user_id, true);
      }
    }
  };

  const createPeerConnection = async (remoteUserId: string, isInitiator: boolean) => {
    if (peerConnections.current.has(remoteUserId)) return;

    const pc = new RTCPeerConnection(ICE_SERVERS);
    peerConnections.current.set(remoteUserId, pc);

    // Adicionar stream local
    if (localStream.current) {
      localStream.current.getTracks().forEach(track => {
        pc.addTrack(track, localStream.current!);
      });
    }

    // Receber stream remoto
    pc.ontrack = (event) => {
      const [remoteStream] = event.streams;
      setRemoteStreams(prev => {
        const newStreams = new Map(prev);
        newStreams.set(remoteUserId, remoteStream);
        return newStreams;
      });
    };

    // ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        sendSignalingMessage({
          type: 'ice-candidate',
          from: userId!,
          to: remoteUserId,
          data: event.candidate,
        });
      }
    };

    // Criar oferta se for o iniciador
    if (isInitiator) {
      setIsConnecting(true);
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      
      sendSignalingMessage({
        type: 'offer',
        from: userId!,
        to: remoteUserId,
        data: offer,
      });
      
      setIsConnecting(false);
    }

    return pc;
  };

  const handleOffer = async (remoteUserId: string, offer: RTCSessionDescriptionInit) => {
    const pc = await createPeerConnection(remoteUserId, false);
    if (!pc) return;

    await pc.setRemoteDescription(new RTCSessionDescription(offer));
    
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    
    sendSignalingMessage({
      type: 'answer',
      from: userId!,
      to: remoteUserId,
      data: answer,
    });
  };

  const handleAnswer = async (remoteUserId: string, answer: RTCSessionDescriptionInit) => {
    const pc = peerConnections.current.get(remoteUserId);
    if (!pc) return;

    await pc.setRemoteDescription(new RTCSessionDescription(answer));
  };

  const handleIceCandidate = async (remoteUserId: string, candidate: RTCIceCandidateInit) => {
    const pc = peerConnections.current.get(remoteUserId);
    if (!pc) return;

    await pc.addIceCandidate(new RTCIceCandidate(candidate));
  };

  const sendSignalingMessage = (message: SignalingMessage) => {
    if (!signalingChannel.current) return;

    signalingChannel.current.send({
      type: 'broadcast',
      event: 'signaling',
      payload: message,
    });
  };

  const toggleMute = () => {
    if (!localStream.current) return;

    const audioTrack = localStream.current.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setIsMuted(!audioTrack.enabled);
    }
  };

  const cleanup = () => {
    // Parar stream local
    if (localStream.current) {
      localStream.current.getTracks().forEach(track => track.stop());
      localStream.current = null;
    }

    // Fechar peer connections
    peerConnections.current.forEach(pc => pc.close());
    peerConnections.current.clear();

    // Limpar signaling channel
    if (signalingChannel.current) {
      supabase.removeChannel(signalingChannel.current);
      signalingChannel.current = null;
    }

    setRemoteStreams(new Map());
  };

  return {
    isMuted,
    isConnecting,
    remoteStreams,
    toggleMute,
  };
}