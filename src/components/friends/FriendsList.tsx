import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { MessageSquare, UserMinus } from 'lucide-react';
import { useFriendships } from '@/hooks/useFriendships';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface FriendData {
  id: string;
  friendshipId: string;
  username: string;
  full_name: string;
}

export const FriendsList = () => {
  const { friendships, loading, removeFriend } = useFriendships();
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [friendToRemove, setFriendToRemove] = useState<{ id: string; name: string } | null>(null);
  const [friendsData, setFriendsData] = useState<FriendData[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const loadFriendsData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const friends: FriendData[] = friendships.map(friendship => {
        const isRequester = friendship.requester_id === user.id;
        const friend = isRequester ? friendship.addressee : friendship.requester;
        
        return {
          id: friend?.id || '',
          friendshipId: friendship.id,
          username: friend?.username || '',
          full_name: friend?.full_name || ''
        };
      }).filter(f => f.id);

      setFriendsData(friends);
    };

    loadFriendsData();
  }, [friendships]);

  const handleMessage = async (friendId: string) => {
    navigate(`/messages/${friendId}`);
  };

  const confirmRemoveFriend = (friendshipId: string, friendName: string) => {
    setFriendToRemove({ id: friendshipId, name: friendName });
  };

  const handleRemoveFriend = async () => {
    if (!friendToRemove) return;
    
    setRemovingId(friendToRemove.id);
    try {
      const result = await removeFriend(friendToRemove.id);
      if (result.success) {
        toast.success('Amigo removido');
      } else {
        toast.error('Erro ao remover amigo');
      }
    } finally {
      setRemovingId(null);
      setFriendToRemove(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <p className="text-muted-foreground">A carregar amigos...</p>
      </div>
    );
  }

  if (friendsData.length === 0) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="text-center">
          <p className="text-muted-foreground mb-2">Ainda não tens amigos</p>
          <p className="text-sm text-muted-foreground">
            Adiciona amigos para começar a conversar!
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-2">
        {friendsData.map((friend) => (
          <div
            key={friend.friendshipId}
            className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors"
          >
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-gradient-primary text-primary-foreground">
                {friend.username.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{friend.full_name}</p>
              <p className="text-sm text-muted-foreground truncate">@{friend.username}</p>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="default"
                onClick={() => handleMessage(friend.id)}
              >
                <MessageSquare className="w-4 h-4 mr-1" />
                Mensagem
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => confirmRemoveFriend(friend.friendshipId, friend.full_name)}
                disabled={removingId === friend.friendshipId}
              >
                <UserMinus className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <AlertDialog open={!!friendToRemove} onOpenChange={() => setFriendToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover amigo?</AlertDialogTitle>
            <AlertDialogDescription>
              Tens a certeza que queres remover {friendToRemove?.name} dos teus amigos?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemoveFriend}>
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};