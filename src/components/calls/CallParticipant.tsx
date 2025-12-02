import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Mic, MicOff } from 'lucide-react';
import { CallParticipant as CallParticipantType } from '@/hooks/useProjectCalls';

interface CallParticipantProps {
  participant: CallParticipantType;
  isSpeaking?: boolean;
  isMuted?: boolean;
}

export function CallParticipant({ participant, isSpeaking, isMuted }: CallParticipantProps) {
  return (
    <div className="flex flex-col items-center gap-2 p-4">
      <div className={`relative ${isSpeaking ? 'ring-4 ring-primary animate-pulse' : ''} rounded-full`}>
        <Avatar className="h-24 w-24">
          <AvatarImage src={participant.profile?.avatar_url} />
          <AvatarFallback className="text-2xl">
            {participant.profile?.username?.[0]?.toUpperCase() || '?'}
          </AvatarFallback>
        </Avatar>
        
        {isMuted && (
          <div className="absolute bottom-0 right-0 bg-destructive text-destructive-foreground rounded-full p-1.5">
            <MicOff className="h-3 w-3" />
          </div>
        )}
        
        {!isMuted && isSpeaking && (
          <div className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-1.5">
            <Mic className="h-3 w-3" />
          </div>
        )}
      </div>
      
      <div className="text-center">
        <p className="font-medium">{participant.profile?.full_name}</p>
        <p className="text-sm text-muted-foreground">@{participant.profile?.username}</p>
      </div>
    </div>
  );
}