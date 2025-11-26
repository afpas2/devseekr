import { useState } from 'react';
import { useParams } from 'react-router-dom';
import Header from '@/components/layout/Header';
import ConversationList from '@/components/messages/ConversationList';
import ChatWindow from '@/components/messages/ChatWindow';
import { useMessages } from '@/hooks/useMessages';

const Messages = () => {
  const { conversationId } = useParams();
  const [selectedUserId, setSelectedUserId] = useState<string | undefined>(conversationId);
  const { conversations } = useMessages();

  const selectedConversation = conversations.find(c => c.userId === selectedUserId);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <div className="flex-1 container py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[calc(100vh-12rem)]">
          <div className="md:col-span-1 border rounded-lg overflow-hidden bg-card">
            <div className="border-b p-4 bg-muted/50">
              <h2 className="font-semibold">Conversas</h2>
            </div>
            <ConversationList
              selectedUserId={selectedUserId}
              onSelectConversation={setSelectedUserId}
            />
          </div>

          <div className="md:col-span-2 border rounded-lg overflow-hidden bg-card">
            {selectedUserId && selectedConversation ? (
              <ChatWindow
                conversationUserId={selectedUserId}
                conversationUsername={selectedConversation.username}
                conversationAvatar={selectedConversation.avatar_url}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <div className="text-center">
                  <p className="text-lg mb-2">Selecione uma conversa</p>
                  <p className="text-sm">Escolha uma conversa da lista para começar</p>
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
