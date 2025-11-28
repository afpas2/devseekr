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
  status?: 'pending' | 'accepted' | 'rejected';
  isPending?: boolean;
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
          // Check conversation status first
          const [userId1, userId2] = [user.id, conversationUserId].sort();
          const { data: conversation } = await supabase
            .from('conversations')
            .select('status')
            .eq('user1_id', userId1)
            .eq('user2_id', userId2)
            .single();

          // Only load messages if conversation is accepted or pending (to show for sender)
          if (conversation?.status === 'rejected') {
            setMessages([]);
            setLoading(false);
            return;
          }

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
          // Load all conversations with their status
          const { data: conversationsData, error: convError } = await supabase
            .from('conversations')
            .select('*')
            .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`);

          if (convError) throw convError;

          // Load all messages
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
          
          // First, add conversations from conversations table
          conversationsData?.forEach((conv) => {
            const otherUserId = conv.user1_id === user.id ? conv.user2_id : conv.user1_id;
            const isPendingForMe = conv.status === 'pending' && (
              // It's pending if I'm the recipient (user2 in sorted order means I received it)
              (conv.user1_id < conv.user2_id && user.id === conv.user2_id) ||
              (conv.user1_id > conv.user2_id && user.id === conv.user1_id)
            );
            
            conversationsMap.set(otherUserId, {
              userId: otherUserId,
              username: 'Unknown',
              avatar_url: null,
              lastMessage: isPendingForMe ? 'Pedido de conversa pendente' : 'Sem mensagens',
              lastMessageTime: conv.created_at || new Date().toISOString(),
              unreadCount: 0,
              status: conv.status as 'pending' | 'accepted' | 'rejected',
              isPending: isPendingForMe,
            });
          });

          // Then update with message data
          data?.forEach((msg) => {
            const otherUserId = msg.sender_id === user.id ? msg.recipient_id : msg.sender_id;
            const otherUser = msg.sender_id === user.id ? msg.recipient : msg.sender;
            
            const existing = conversationsMap.get(otherUserId);
            if (existing && existing.status === 'rejected') return; // Skip rejected conversations
            
            if (!conversationsMap.has(otherUserId)) {
              conversationsMap.set(otherUserId, {
                userId: otherUserId,
                username: otherUser?.username || 'Unknown',
                avatar_url: otherUser?.avatar_url || null,
                lastMessage: msg.content,
                lastMessageTime: msg.created_at,
                unreadCount: msg.recipient_id === user.id && !msg.read ? 1 : 0,
                status: 'accepted',
                isPending: false,
              });
            } else {
              const conv = conversationsMap.get(otherUserId)!;
              conv.username = otherUser?.username || conv.username;
              conv.avatar_url = otherUser?.avatar_url || conv.avatar_url;
              if (!conv.isPending) {
                conv.lastMessage = msg.content;
                conv.lastMessageTime = msg.created_at;
              }
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
    const messagesChannel = supabase
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

    const conversationsChannel = supabase
      .channel('conversations-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
        },
        () => {
          loadData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(conversationsChannel);
    };
  }, [conversationUserId]);

  const sendMessage = async (recipientId: string, content: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Check conversation status
      const [userId1, userId2] = [user.id, recipientId].sort();
      const { data: conversation } = await supabase
        .from('conversations')
        .select('status')
        .eq('user1_id', userId1)
        .eq('user2_id', userId2)
        .single();

      if (conversation?.status === 'rejected') {
        throw new Error('Esta conversa foi recusada');
      }

      // If first message, create conversation and accept it automatically
      if (!conversation) {
        await supabase.from('conversations').insert({
          user1_id: userId1,
          user2_id: userId2,
          status: 'pending',
        });
      } else if (conversation.status === 'pending') {
        // If sender is sending another message, auto-accept
        const isSender = (userId1 === user.id && userId2 === recipientId) || 
                        (userId2 === user.id && userId1 === recipientId);
        if (isSender && userId1 === user.id) {
          // Don't auto-accept, let recipient decide
        }
      }

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

  const acceptConversation = async (otherUserId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const [userId1, userId2] = [user.id, otherUserId].sort();
      
      const { error } = await supabase
        .from('conversations')
        .update({ status: 'accepted' })
        .eq('user1_id', userId1)
        .eq('user2_id', userId2);

      if (error) throw error;
    } catch (error) {
      console.error('Error accepting conversation:', error);
      throw error;
    }
  };

  const rejectConversation = async (otherUserId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const [userId1, userId2] = [user.id, otherUserId].sort();
      
      const { error } = await supabase
        .from('conversations')
        .update({ status: 'rejected' })
        .eq('user1_id', userId1)
        .eq('user2_id', userId2);

      if (error) throw error;
    } catch (error) {
      console.error('Error rejecting conversation:', error);
      throw error;
    }
  };

  return {
    messages,
    conversations,
    loading,
    sendMessage,
    acceptConversation,
    rejectConversation,
  };
};
