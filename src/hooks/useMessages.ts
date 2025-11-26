import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  created_at: string;
  read: boolean;
  sender?: {
    username: string;
    avatar_url: string | null;
  };
  recipient?: {
    username: string;
    avatar_url: string | null;
  };
}

interface Conversation {
  userId: string;
  username: string;
  avatar_url: string | null;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
}

export const useMessages = (conversationUserId?: string) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        if (conversationUserId) {
          // Load messages for specific conversation
          const { data, error } = await supabase
            .from('messages')
            .select(`
              *,
              sender:profiles!messages_sender_id_fkey(username, avatar_url),
              recipient:profiles!messages_recipient_id_fkey(username, avatar_url)
            `)
            .or(`and(sender_id.eq.${user.id},recipient_id.eq.${conversationUserId}),and(sender_id.eq.${conversationUserId},recipient_id.eq.${user.id})`)
            .order('created_at', { ascending: true });

          if (error) throw error;
          setMessages(data || []);

          // Mark messages as read
          await supabase
            .from('messages')
            .update({ read: true })
            .eq('recipient_id', user.id)
            .eq('sender_id', conversationUserId)
            .eq('read', false);
        } else {
          // Load all conversations
          const { data, error } = await supabase
            .from('messages')
            .select(`
              *,
              sender:profiles!messages_sender_id_fkey(username, avatar_url),
              recipient:profiles!messages_recipient_id_fkey(username, avatar_url)
            `)
            .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
            .order('created_at', { ascending: false });

          if (error) throw error;

          // Group messages by conversation
          const conversationsMap = new Map<string, Conversation>();
          
          data?.forEach((msg) => {
            const otherUserId = msg.sender_id === user.id ? msg.recipient_id : msg.sender_id;
            const otherUser = msg.sender_id === user.id ? msg.recipient : msg.sender;
            
            if (!conversationsMap.has(otherUserId)) {
              conversationsMap.set(otherUserId, {
                userId: otherUserId,
                username: otherUser?.username || 'Unknown',
                avatar_url: otherUser?.avatar_url || null,
                lastMessage: msg.content,
                lastMessageTime: msg.created_at,
                unreadCount: msg.recipient_id === user.id && !msg.read ? 1 : 0,
              });
            } else {
              const conv = conversationsMap.get(otherUserId)!;
              if (msg.recipient_id === user.id && !msg.read) {
                conv.unreadCount += 1;
              }
            }
          });

          setConversations(Array.from(conversationsMap.values()));
        }
      } catch (error) {
        console.error('Error loading messages:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();

    // Subscribe to realtime changes
    const channel = supabase
      .channel('messages-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
        },
        () => {
          loadData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationUserId]);

  const sendMessage = async (recipientId: string, content: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          recipient_id: recipientId,
          content,
        });

      if (error) throw error;

      // Create notification
      await supabase.from('notifications').insert({
        recipient_id: recipientId,
        type: 'message_received',
        message: 'Enviou uma nova mensagem',
        sender_id: user.id,
      });
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  };

  return {
    messages,
    conversations,
    loading,
    sendMessage,
  };
};
