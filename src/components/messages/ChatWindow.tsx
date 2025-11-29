import { useEffect, useRef, useState } from 'react';
import { useMessages } from '@/hooks/useMessages';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';
import { pt } from 'date-fns/locale';
import { Loader2 } from 'lucide-react';
import MessageInput from './MessageInput';
import { supabase } from '@/integrations/supabase/client';

interface ChatWindowProps {
  conversationUserId: string;
  conversationUsername: string;
  conversationAvatar: string | null;
}

const ChatWindow = ({ conversationUserId, conversationUsername, conversationAvatar }: ChatWindowProps) => {
  const { messages, loading, sendMessage } = useMessages(conversationUserId);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [isOtherUserTyping, setIsOtherUserTyping] = useState(false);

  useEffect(() => {
    const getUserId = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setCurrentUserId(user.id);
    };
    getUserId();
  }, []);

  useEffect(() => {
    if (!currentUserId || !conversationUserId) return;

    // Create channel ID by sorting user IDs to ensure consistency
    const userIds = [currentUserId, conversationUserId].sort();
    const channelId = `typing:${userIds[0]}:${userIds[1]}`;
    
    const channel = supabase.channel(channelId)
      .on('broadcast', { event: 'typing' }, (payload: any) => {
        if (payload.payload.userId !== currentUserId) {
          setIsOtherUserTyping(payload.payload.isTyping);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId, conversationUserId]);

  useEffect(() => {
    // Scroll to bottom when messages change
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (content: string) => {
    await sendMessage(conversationUserId, content);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="border-b">
        <div className="p-4 flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={conversationAvatar || ''} />
            <AvatarFallback>
              {conversationUsername?.[0]?.toUpperCase() || '?'}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold">{conversationUsername}</p>
          </div>
        </div>
        {isOtherUserTyping && (
          <div className="px-4 pb-2 text-sm text-muted-foreground animate-pulse">
            {conversationUsername} está a escrever...
          </div>
        )}
      </div>

      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {messages.map((message) => {
            const isOwnMessage = message.sender_id === currentUserId;
            return (
              <div
                key={message.id}
                className={`flex gap-3 ${isOwnMessage ? 'flex-row-reverse' : ''}`}
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={message.sender?.avatar_url || ''} />
                  <AvatarFallback>
                    {message.sender?.username?.[0]?.toUpperCase() || '?'}
                  </AvatarFallback>
                </Avatar>
                <div className={`flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'}`}>
                  <div
                    className={`rounded-lg px-4 py-2 max-w-md ${
                      isOwnMessage
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDistanceToNow(new Date(message.created_at), {
                      addSuffix: true,
                      locale: pt,
                    })}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>

      <MessageInput 
        onSend={handleSendMessage}
        conversationUserId={conversationUserId}
        currentUserId={currentUserId}
      />
    </div>
  );
};

export default ChatWindow;
