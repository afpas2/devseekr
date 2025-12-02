import { Phone, Mic, MicOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CallParticipant } from './CallParticipant';
import { CallParticipant as CallParticipantType } from '@/hooks/useProjectCalls';
import { useWebRTC } from '@/hooks/useWebRTC';

interface ActiveCallViewProps {
  callId: string;
  userId: string;
  participants: CallParticipantType[];
  onLeave: () => void;
}

export function ActiveCallView({ callId, userId, participants, onLeave }: ActiveCallViewProps) {
  const { isMuted, isConnecting, toggleMute } = useWebRTC(callId, userId);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Phone className="h-5 w-5 text-primary" />
          Chamada em Curso
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {isConnecting && (
          <div className="text-center text-sm text-muted-foreground">
            Conectando áudio...
          </div>
        )}
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {participants.map((participant) => (
            <CallParticipant
              key={participant.id}
              participant={participant}
              isMuted={participant.user_id === userId && isMuted}
            />
          ))}
        </div>

        <div className="flex gap-2 justify-center pt-4 border-t">
          <Button
            onClick={toggleMute}
            variant={isMuted ? "destructive" : "outline"}
            className="gap-2"
          >
            {isMuted ? (
              <>
                <MicOff className="h-4 w-4" />
                Desativar Mudo
              </>
            ) : (
              <>
                <Mic className="h-4 w-4" />
                Silenciar
              </>
            )}
          </Button>
          
          <Button
            onClick={onLeave}
            variant="destructive"
            className="gap-2"
          >
            <Phone className="h-4 w-4" />
            Sair da Chamada
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}