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
import { UserPlus } from 'lucide-react';
import { useFriendships } from '@/hooks/useFriendships';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const AddFriendDialog = () => {
  const [open, setOpen] = useState(false);
  const [username, setUsername] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const { sendFriendRequest } = useFriendships();

  const handleAddFriend = async () => {
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
        toast.error('Não podes adicionar-te a ti mesmo');
        return;
      }

      // Send friend request
      const result = await sendFriendRequest(profiles.id);
      if (result.success) {
        toast.success('Pedido de amizade enviado!');
        setUsername('');
        setOpen(false);
      } else {
        if (result.error?.includes('duplicate')) {
          toast.error('Já enviaste um pedido a este utilizador');
        } else {
          toast.error('Erro ao enviar pedido de amizade');
        }
      }
    } catch (error) {
      console.error('Error adding friend:', error);
      toast.error('Erro ao adicionar amigo');
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full">
          <UserPlus className="w-4 h-4 mr-2" />
          Adicionar Amigo
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adicionar Amigo</DialogTitle>
          <DialogDescription>
            Procura um utilizador pelo nome de utilizador para enviar um pedido de amizade.
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
                  handleAddFriend();
                }
              }}
            />
          </div>
          <Button 
            onClick={handleAddFriend} 
            disabled={isSearching}
            className="w-full"
          >
            {isSearching ? 'A procurar...' : 'Enviar Pedido'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};