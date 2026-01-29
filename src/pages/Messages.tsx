import { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import ConversationList from '@/components/messages/ConversationList';
import ChatWindow from '@/components/messages/ChatWindow';
import { NewConversationDialog } from '@/components/messages/NewConversationDialog';
import { useMessages } from '@/hooks/useMessages';
import { supabase } from '@/integrations/supabase/client';
import { MessageCircle, Inbox, Loader2 } from 'lucide-react';

const Messages = () => {
  const { conversationId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const userIdFromQuery = searchParams.get('user');
  
  const [selectedUserId, setSelectedUserId] = useState<string | undefined>(conversationId);
  const [isCreatingConversation, setIsCreatingConversation] = useState(false);
  const { conversations, refetch } = useMessages();

  const selectedConversation = conversations.find(c => c.userId === selectedUserId);

  const handleOpenOrCreateConversation = useCallback(async (targetUserId: string) => {
    setIsCreatingConversation(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || user.id === targetUserId) {
        setIsCreatingConversation(false);
        return;
      }

      // Sort IDs for consistent lookup
      const [userId1, userId2] = [user.id, targetUserId].sort();

      // Check if conversation already exists
      const { data: existing } = await supabase
        .from('conversations')
        .select('id, status')
        .eq('user1_id', userId1)
        .eq('user2_id', userId2)
        .single();

      if (!existing) {
        // Create new conversation
        await supabase.from('conversations').insert({
          user1_id: userId1,
          user2_id: userId2,
          status: 'pending',
        });
        
        // Refetch to update the conversation list
        await refetch();
      }

      setSelectedUserId(targetUserId);
      
      // Clear the query param from URL
      navigate('/messages', { replace: true });
    } catch (error) {
      console.error('Error creating conversation:', error);
    } finally {
      setIsCreatingConversation(false);
    }
  }, [navigate, refetch]);

  // Handle user query param on mount or when it changes
  useEffect(() => {
    if (userIdFromQuery && !isCreatingConversation) {
      handleOpenOrCreateConversation(userIdFromQuery);
    }
  }, [userIdFromQuery, handleOpenOrCreateConversation, isCreatingConversation]);

  // Update selection when conversationId param changes
  useEffect(() => {
    if (conversationId) {
      setSelectedUserId(conversationId);
    }
  }, [conversationId]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="flex-1 container py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[calc(100vh-12rem)]">
          {/* Conversation Sidebar */}
          <div className="md:col-span-1 border border-border/50 rounded-xl overflow-hidden bg-card flex flex-col shadow-sm animate-fade-in">
            <div className="border-b border-border/50 p-4 bg-gradient-to-br from-muted/50 to-transparent">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="p-2 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5">
                  <MessageCircle className="w-4 h-4 text-primary" />
                </div>
                <h2 className="font-semibold text-lg">Mensagens</h2>
              </div>
              <NewConversationDialog onConversationCreated={setSelectedUserId} />
            </div>
            
            <div className="flex-1 overflow-hidden">
              <ConversationList
                selectedUserId={selectedUserId}
                onSelectConversation={setSelectedUserId}
              />
            </div>
          </div>

          {/* Chat Window */}
          <div className="md:col-span-2 border border-border/50 rounded-xl overflow-hidden bg-card shadow-sm animate-fade-in" style={{ animationDelay: '0.1s' }}>
            {isCreatingConversation ? (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <div className="text-center">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
                  <p className="text-sm">A preparar conversa...</p>
                </div>
              </div>
            ) : selectedUserId && selectedConversation ? (
              <ChatWindow
                conversationUserId={selectedUserId}
                conversationUsername={selectedConversation.username}
                conversationAvatar={selectedConversation.avatar_url}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <div className="text-center">
                  <div className="p-6 rounded-full bg-muted/50 inline-flex mb-4">
                    <Inbox className="w-12 h-12 text-muted-foreground/50" />
                  </div>
                  <p className="text-lg font-medium mb-2">Seleciona uma conversa</p>
                  <p className="text-sm text-muted-foreground">
                    Escolhe uma conversa da lista ou inicia uma nova
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Messages;
