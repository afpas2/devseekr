import Header from '@/components/layout/Header';
import { FriendsList } from '@/components/friends/FriendsList';
import { FriendRequestCard } from '@/components/friends/FriendRequestCard';
import { AddFriendDialog } from '@/components/friends/AddFriendDialog';

const Friends = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <div className="flex-1 container py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Amigos</h1>
          
          <div className="space-y-6">
            <div className="bg-card border rounded-lg p-6">
              <AddFriendDialog />
            </div>
            
            <div className="bg-card border rounded-lg p-6">
              <FriendRequestCard />
            </div>
            
            <div className="bg-card border rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Os Meus Amigos</h2>
              <FriendsList />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Friends;
