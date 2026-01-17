import Header from '@/components/layout/Header';
import { FriendsList } from '@/components/friends/FriendsList';
import { FriendRequestCard } from '@/components/friends/FriendRequestCard';
import { AddFriendDialog } from '@/components/friends/AddFriendDialog';
import { Users, UserPlus, Bell } from 'lucide-react';

const Friends = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-muted/30 to-background">
      <Header />
      
      <div className="flex-1 container py-8">
        <div className="max-w-4xl mx-auto">
          {/* Page Header */}
          <div className="mb-8 animate-fade-in">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/10 to-secondary/10">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <h1 className="text-3xl font-bold bg-gradient-hero bg-clip-text text-transparent">Amigos</h1>
            </div>
            <p className="text-muted-foreground ml-14">
              Gere as tuas conexões e pedidos de amizade
            </p>
          </div>
          
          <div className="grid gap-6">
            {/* Add Friend Section */}
            <div className="group bg-card border border-border/50 rounded-xl p-6 hover:border-primary/20 hover:shadow-md transition-all duration-300 animate-fade-in">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5">
                  <UserPlus className="w-4 h-4 text-primary" />
                </div>
                <h2 className="text-lg font-semibold">Adicionar Amigo</h2>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Procura utilizadores pelo nome de utilizador e envia um pedido de amizade.
              </p>
              <AddFriendDialog />
            </div>
            
            {/* Friend Requests Section */}
            <div className="group bg-card border border-border/50 rounded-xl p-6 hover:border-primary/20 hover:shadow-md transition-all duration-300 animate-fade-in" style={{ animationDelay: '0.1s' }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-gradient-to-br from-amber-500/10 to-amber-500/5">
                  <Bell className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                </div>
                <h2 className="text-lg font-semibold">Pedidos Pendentes</h2>
              </div>
              <FriendRequestCard />
            </div>
            
            {/* Friends List Section */}
            <div className="group bg-card border border-border/50 rounded-xl p-6 hover:border-primary/20 hover:shadow-md transition-all duration-300 animate-fade-in" style={{ animationDelay: '0.2s' }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-gradient-to-br from-green-500/10 to-green-500/5">
                  <Users className="w-4 h-4 text-green-600 dark:text-green-400" />
                </div>
                <h2 className="text-lg font-semibold">Os Meus Amigos</h2>
              </div>
              <FriendsList />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Friends;
