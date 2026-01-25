import { useState } from 'react';
import { useParams } from 'react-router-dom';
import ConversationList from '@/components/messages/ConversationList';
import ChatWindow from '@/components/messages/ChatWindow';
import { NewConversationDialog } from '@/components/messages/NewConversationDialog';
import { useMessages } from '@/hooks/useMessages';
import { MessageCircle, Inbox } from 'lucide-react';

const Messages = () => {
  const { conversationId } = useParams();
  const [selectedUserId, setSelectedUserId] = useState<string | undefined>(conversationId);
  const { conversations } = useMessages();

  const selectedConversation = conversations.find(c => c.userId === selectedUserId);

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
            {selectedUserId && selectedConversation ? (
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
