import { useState } from 'react';
import { useParams } from 'react-router-dom';
import Header from '@/components/layout/Header';
import ConversationList from '@/components/messages/ConversationList';
import ChatWindow from '@/components/messages/ChatWindow';
import { FriendsList } from '@/components/friends/FriendsList';
import { FriendRequestCard } from '@/components/friends/FriendRequestCard';
import { AddFriendDialog } from '@/components/friends/AddFriendDialog';
import { useMessages } from '@/hooks/useMessages';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageSquare, Users } from 'lucide-react';

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
            <Tabs defaultValue="conversations" className="h-full flex flex-col">
              <div className="border-b p-4 bg-muted/50">
                <TabsList className="w-full grid grid-cols-2">
                  <TabsTrigger value="conversations" className="gap-2">
                    <MessageSquare className="w-4 h-4" />
                    Conversas
                  </TabsTrigger>
                  <TabsTrigger value="friends" className="gap-2">
                    <Users className="w-4 h-4" />
                    Amigos
                  </TabsTrigger>
                </TabsList>
              </div>
              
              <TabsContent value="conversations" className="flex-1 overflow-auto m-0">
                <ConversationList
                  selectedUserId={selectedUserId}
                  onSelectConversation={setSelectedUserId}
                />
              </TabsContent>
              
              <TabsContent value="friends" className="flex-1 overflow-auto m-0 p-4">
                <div className="space-y-4">
                  <AddFriendDialog />
                  <FriendRequestCard />
                  <FriendsList />
                </div>
              </TabsContent>
            </Tabs>
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
