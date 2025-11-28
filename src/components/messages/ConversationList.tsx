import { useMessages } from '@/hooks/useMessages';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';
import { pt } from 'date-fns/locale';
import { Check, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';

interface ConversationListProps {
  selectedUserId?: string;
  onSelectConversation: (userId: string) => void;
}

const ConversationList = ({ selectedUserId, onSelectConversation }: ConversationListProps) => {
  const { conversations, loading, acceptConversation, rejectConversation } = useMessages();

  const handleAccept = async (userId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await acceptConversation(userId);
      toast.success('Conversa aceite!');
    } catch (error) {
      toast.error('Erro ao aceitar conversa');
    }
  };

  const handleReject = async (userId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await rejectConversation(userId);
      toast.success('Conversa recusada');
    } catch (error) {
      toast.error('Erro ao recusar conversa');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-muted-foreground text-center">
        <p className="text-sm">Sem conversas ainda</p>
        <p className="text-xs mt-2">Inicia uma nova conversa</p>
      </div>
    );
  }

  // Separate pending and accepted conversations
  const pendingConversations = conversations.filter(c => c.isPending);
  const activeConversations = conversations.filter(c => !c.isPending && c.status !== 'rejected');

  return (
    <ScrollArea className="h-full">
      <div className="flex flex-col">
        {pendingConversations.length > 0 && (
          <div className="border-b bg-muted/30">
            <p className="text-xs font-semibold text-muted-foreground px-4 py-2">
              PEDIDOS PENDENTES
            </p>
            {pendingConversations.map((conversation) => (
              <div
                key={conversation.userId}
                className="flex gap-3 p-4 border-b"
              >
                <Avatar className="h-12 w-12">
                  <AvatarImage src={conversation.avatar_url || ''} />
                  <AvatarFallback>
                    {conversation.username?.[0]?.toUpperCase() || '?'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{conversation.username}</p>
                  <p className="text-sm text-muted-foreground">
                    Quer iniciar uma conversa contigo
                  </p>
                  <div className="flex gap-2 mt-2">
                    <Button
                      size="sm"
                      onClick={(e) => handleAccept(conversation.userId, e)}
                    >
                      <Check className="w-4 h-4 mr-1" />
                      Aceitar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => handleReject(conversation.userId, e)}
                    >
                      <X className="w-4 h-4 mr-1" />
                      Recusar
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {activeConversations.map((conversation) => (
          <button
            key={conversation.userId}
            onClick={() => onSelectConversation(conversation.userId)}
            className={`flex gap-3 p-4 hover:bg-accent transition-colors text-left border-b ${
              selectedUserId === conversation.userId ? 'bg-accent' : ''
            }`}
          >
            <Avatar className="h-12 w-12">
              <AvatarImage src={conversation.avatar_url || ''} />
              <AvatarFallback>
                {conversation.username?.[0]?.toUpperCase() || '?'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-1">
                <p className="font-medium truncate">{conversation.username}</p>
                {conversation.unreadCount > 0 && (
                  <Badge variant="default" className="flex-shrink-0">
                    {conversation.unreadCount}
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground truncate">
                {conversation.lastMessage}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {formatDistanceToNow(new Date(conversation.lastMessageTime), {
                  addSuffix: true,
                  locale: pt,
                })}
              </p>
            </div>
          </button>
        ))}
      </div>
    </ScrollArea>
  );
};

export default ConversationList;
