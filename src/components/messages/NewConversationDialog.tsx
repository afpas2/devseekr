import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MessageSquarePlus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface NewConversationDialogProps {
  onConversationCreated: (userId: string) => void;
}

export const NewConversationDialog = ({ onConversationCreated }: NewConversationDialogProps) => {
  const [open, setOpen] = useState(false);
  const [username, setUsername] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const handleStartConversation = async () => {
    if (!username.trim()) {
      toast.error('Por favor, insere um nome de utilizador');
      return;
    }

    setIsSearching(true);
    try {
      // Find user by username
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, username')
        .eq('username', username.trim())
        .single();

      if (error || !profiles) {
        toast.error('Utilizador não encontrado');
        return;
      }

      // Check if it's the current user
      const { data: { user } } = await supabase.auth.getUser();
      if (profiles.id === user?.id) {
        toast.error('Não podes enviar mensagens a ti mesmo');
        return;
      }

      if (!user) throw new Error('Not authenticated');

      // Create or get conversation
      const [userId1, userId2] = [user.id, profiles.id].sort();
      
      // Check if conversation already exists
      const { data: existingConv } = await supabase
        .from('conversations')
        .select('*')
        .eq('user1_id', userId1)
        .eq('user2_id', userId2)
        .single();

      if (existingConv) {
        if (existingConv.status === 'rejected') {
          toast.error('Esta conversa foi recusada anteriormente');
          return;
        }
        // Conversation exists, just open it
        onConversationCreated(profiles.id);
        setUsername('');
        setOpen(false);
        return;
      }

      // Create new conversation
      const { error: convError } = await supabase
        .from('conversations')
        .insert({
          user1_id: userId1,
          user2_id: userId2,
          status: 'pending',
        });

      if (convError) throw convError;

      toast.success('Conversa iniciada! Envia uma mensagem.');
      onConversationCreated(profiles.id);
      setUsername('');
      setOpen(false);
    } catch (error) {
      console.error('Error starting conversation:', error);
      toast.error('Erro ao iniciar conversa');
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full">
          <MessageSquarePlus className="w-4 h-4 mr-2" />
          Nova Conversa
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Iniciar Nova Conversa</DialogTitle>
          <DialogDescription>
            Procura um utilizador pelo nome de utilizador para iniciar uma conversa.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="username">Nome de Utilizador</Label>
            <Input
              id="username"
              placeholder="Ex: joaosilva"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleStartConversation();
                }
              }}
            />
          </div>
          <Button 
            onClick={handleStartConversation} 
            disabled={isSearching}
            className="w-full"
          >
            {isSearching ? 'A procurar...' : 'Iniciar Conversa'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
