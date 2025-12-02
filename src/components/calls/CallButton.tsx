import { Phone, PhoneCall } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CallButtonProps {
  hasActiveCall: boolean;
  isInCall: boolean;
  onStartCall: () => void;
  onJoinCall: () => void;
}

export function CallButton({ hasActiveCall, isInCall, onStartCall, onJoinCall }: CallButtonProps) {
  if (isInCall) {
    return null; // Não mostrar botão se já está na chamada
  }

  return (
    <Button
      onClick={hasActiveCall ? onJoinCall : onStartCall}
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