import { Phone, PhoneOff } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface IncomingCallPopupProps {
  callId: string;
  projectName: string;
  initiatorId: string;
  onAccept: () => void;
  onDecline: () => void;
}

export function IncomingCallPopup({
  projectName,
  initiatorId,
  onAccept,
  onDecline,
}: IncomingCallPopupProps) {
  const [initiator, setInitiator] = useState<{
    full_name: string;
    avatar_url?: string;
    username: string;
  } | null>(null);

  useEffect(() => {
    const loadInitiator = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('full_name, avatar_url, username')
        .eq('id', initiatorId)
        .single();

      if (data) {
        setInitiator(data);
      }
    };

    loadInitiator();
  }, [initiatorId]);

  return (
    <Card className="w-80 shadow-2xl border-2 border-primary/50 animate-in slide-in-from-right-5 bg-card">
      <CardContent className="p-4">
        <div className="flex items-center gap-4 mb-4">
          <div className="relative">
            <Avatar className="h-14 w-14 ring-2 ring-primary ring-offset-2 ring-offset-background">
              <AvatarImage src={initiator?.avatar_url} />
              <AvatarFallback className="bg-primary/20 text-primary text-lg">
                {initiator?.username?.[0]?.toUpperCase() || '?'}
              </AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-1 -right-1 bg-primary rounded-full p-1 animate-pulse">
              <Phone className="h-3 w-3 text-primary-foreground" />
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            <p className="font-semibold truncate">
              {initiator?.full_name || 'A ligar...'}
            </p>
            <p className="text-sm text-muted-foreground truncate">
              {projectName}
            </p>
            <p className="text-xs text-primary animate-pulse">
              Chamada de voz...
            </p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button
            onClick={onAccept}
            className="flex-1 gap-2 bg-green-600 hover:bg-green-700"
          >
            <Phone className="h-4 w-4" />
            Aceitar
          </Button>
          <Button
            onClick={onDecline}
            variant="destructive"
            className="flex-1 gap-2"
          >
            <PhoneOff className="h-4 w-4" />
            Recusar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
