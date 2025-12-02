import { useEffect, useRef, useState } from 'react';
import { useMessages } from '@/hooks/useMessages';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';
import { pt } from 'date-fns/locale';
import { Loader2, Check, CheckCheck } from 'lucide-react';
import MessageInput from './MessageInput';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';

interface ChatWindowProps {
  conversationUserId: string;
  conversationUsername: string;
  conversationAvatar: string | null;
}

const ChatWindow = ({ conversationUserId, conversationUsername, conversationAvatar }: ChatWindowProps) => {
  const { messages, loading, sendMessage } = useMessages(conversationUserId);
  const { isUserOnline } = useOnlineStatus();
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
          <Link to={`/profile/${conversationUserId}`}>
            <div className="relative">
              <Avatar className="h-10 w-10 cursor-pointer hover:opacity-80 transition-opacity">
                <AvatarImage src={conversationAvatar || ''} />
                <AvatarFallback>
                  {conversationUsername?.[0]?.toUpperCase() || '?'}
                </AvatarFallback>
              </Avatar>
              <div
                className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-background ${
                  isUserOnline(conversationUserId) ? 'bg-green-500 animate-pulse' : 'bg-muted-foreground'
                }`}
              />
            </div>
          </Link>
          <div>
            <Link to={`/profile/${conversationUserId}`} className="hover:underline">
              <p className="font-semibold">{conversationUsername}</p>
            </Link>
            <p className="text-xs text-muted-foreground">
              {isUserOnline(conversationUserId) ? (
                <span className="text-green-600 font-medium">Online</span>
              ) : (
                'Offline'
              )}
            </p>
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
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(message.created_at), {
                        addSuffix: true,
                        locale: pt,
                      })}
                    </p>
                    {isOwnMessage && (
                      <div>
                        {message.read ? (
                          <CheckCheck className="w-4 h-4 text-blue-500" />
                        ) : (
                          <Check className="w-4 h-4 text-muted-foreground" />
                        )}
                      </div>
                    )}
                  </div>
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
