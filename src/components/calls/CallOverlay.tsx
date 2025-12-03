import { Phone, Mic, MicOff, Minimize2, Maximize2, X, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useCallContext } from '@/contexts/CallContext';
import { cn } from '@/lib/utils';

export function CallOverlay() {
  const {
    activeCall,
    participants,
    isInCall,
    isMinimized,
    isMuted,
    currentUserId,
    projectName,
    leaveCall,
    toggleMinimize,
    toggleMute,
  } = useCallContext();

  if (!activeCall || !isInCall) return null;

  // Vista minimizada
  if (isMinimized) {
    return (
      <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5">
        <div className="bg-card border border-border rounded-2xl shadow-lg p-3 flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <Phone className="h-5 w-5 text-primary animate-pulse" />
            </div>
            <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {participants.length}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              size="icon"
              variant={isMuted ? "destructive" : "ghost"}
              className="h-8 w-8"
              onClick={toggleMute}
            >
              {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </Button>
            
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              onClick={toggleMinimize}
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
            
            <Button
              size="icon"
              variant="destructive"
              className="h-8 w-8"
              onClick={leaveCall}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Vista expandida
  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm animate-in fade-in">
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <Phone className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold">Chamada em Curso</h2>
              <p className="text-sm text-muted-foreground">{projectName || 'Projeto'}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              {participants.length}
            </div>
            <Button
              size="icon"
              variant="ghost"
              onClick={toggleMinimize}
            >
              <Minimize2 className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Participantes */}
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 max-w-4xl">
            {participants.map((participant) => {
              const isCurrentUser = participant.user_id === currentUserId;
              const participantMuted = isCurrentUser && isMuted;
              
              return (
                <div
                  key={participant.id}
                  className={cn(
                    "flex flex-col items-center gap-3 p-6 rounded-2xl bg-card border border-border transition-all",
                    participantMuted && "opacity-60"
                  )}
                >
                  <div className="relative">
                    <Avatar className="h-20 w-20 ring-4 ring-primary/20">
                      <AvatarImage src={participant.profile?.avatar_url} />
                      <AvatarFallback className="text-2xl bg-muted">
                        {participant.profile?.username?.[0]?.toUpperCase() || '?'}
                      </AvatarFallback>
                    </Avatar>
                    
                    {participantMuted && (
                      <div className="absolute bottom-0 right-0 bg-destructive text-destructive-foreground rounded-full p-1.5">
                        <MicOff className="h-3 w-3" />
                      </div>
                    )}
                  </div>
                  
                  <div className="text-center">
                    <p className="font-medium">
                      {participant.profile?.full_name}
                      {isCurrentUser && <span className="text-muted-foreground"> (Tu)</span>}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      @{participant.profile?.username}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Controlos */}
        <div className="p-6 border-t border-border">
          <div className="flex items-center justify-center gap-4">
            <Button
              size="lg"
              variant={isMuted ? "destructive" : "outline"}
              className="gap-2 rounded-full px-6"
              onClick={toggleMute}
            >
              {isMuted ? (
                <>
                  <MicOff className="h-5 w-5" />
                  Ativar Microfone
                </>
              ) : (
                <>
                  <Mic className="h-5 w-5" />
                  Silenciar
                </>
              )}
            </Button>
            
            <Button
              size="lg"
              variant="destructive"
              className="gap-2 rounded-full px-6"
              onClick={leaveCall}
            >
              <Phone className="h-5 w-5" />
              Sair da Chamada
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
