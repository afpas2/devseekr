import { Phone, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
  const [initiatorName, setInitiatorName] = useState<string>('');

  useEffect(() => {
    const loadInitiatorName = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', initiatorId)
        .single();

      if (data) {
        setInitiatorName(data.full_name);
      }
    };

    loadInitiatorName();
  }, [initiatorId]);

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5">
      <Card className="w-80 shadow-lg border-primary">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Phone className="h-5 w-5 animate-pulse text-primary" />
            Chamada de Grupo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">
              {initiatorName || 'Alguém'} está a ligar...
            </p>
            <p className="text-sm font-medium">Projeto: {projectName}</p>
          </div>
          
          <div className="flex gap-2">
            <Button
              onClick={onAccept}
              className="flex-1 gap-2"
              variant="default"
            >
              <Phone className="h-4 w-4" />
              Aceitar
            </Button>
            <Button
              onClick={onDecline}
              variant="destructive"
              className="flex-1 gap-2"
            >
              <X className="h-4 w-4" />
              Recusar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}