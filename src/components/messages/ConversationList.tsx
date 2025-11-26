import { useMessages } from '@/hooks/useMessages';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';
import { pt } from 'date-fns/locale';
import { Loader2 } from 'lucide-react';

interface ConversationListProps {
  selectedUserId?: string;
  onSelectConversation: (userId: string) => void;
}

const ConversationList = ({ selectedUserId, onSelectConversation }: ConversationListProps) => {
  const { conversations, loading } = useMessages();

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
        <p className="text-xs mt-2">Envie uma mensagem para começar</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="flex flex-col">
        {conversations.map((conversation) => (
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
