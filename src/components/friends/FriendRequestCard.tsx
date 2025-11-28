import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Check, X } from 'lucide-react';
import { useFriendships } from '@/hooks/useFriendships';
import { toast } from 'sonner';
import { useState } from 'react';

export const FriendRequestCard = () => {
  const { pendingRequests, acceptFriendRequest, rejectFriendRequest } = useFriendships();
  const [processingId, setProcessingId] = useState<string | null>(null);

  const handleAccept = async (friendshipId: string, requesterId: string) => {
    setProcessingId(friendshipId);
    try {
      const result = await acceptFriendRequest(friendshipId, requesterId);
      if (result.success) {
        toast.success('Pedido de amizade aceite!');
      } else {
        toast.error('Erro ao aceitar pedido');
      }
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (friendshipId: string) => {
    setProcessingId(friendshipId);
    try {
      const result = await rejectFriendRequest(friendshipId);
      if (result.success) {
        toast.success('Pedido rejeitado');
      } else {
        toast.error('Erro ao rejeitar pedido');
      }
    } finally {
      setProcessingId(null);
    }
  };

  if (pendingRequests.length === 0) {
    return null;
  }

  return (
    <div className="border-b pb-4 mb-4">
      <h3 className="font-semibold mb-3">Pedidos de Amizade</h3>
      <div className="space-y-2">
        {pendingRequests.map((request) => {
          const requester = request.requester;
          if (!requester) return null;

          return (
            <div
              key={request.id}
              className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/50"
            >
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-gradient-primary text-primary-foreground">
                  {requester.username.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{requester.full_name}</p>
                <p className="text-sm text-muted-foreground truncate">@{requester.username}</p>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => handleAccept(request.id, requester.id)}
                  disabled={processingId === request.id}
                  className="bg-gradient-primary"
                >
                  <Check className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleReject(request.id)}
                  disabled={processingId === request.id}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};