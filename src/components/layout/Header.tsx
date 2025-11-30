import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LogOut, MessageSquare, Users, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import NotificationBell from '@/components/notifications/NotificationBell';
import { useFriendships } from '@/hooks/useFriendships';
import logo from '@/assets/logo.png';

interface HeaderProps {
  showNotifications?: boolean;
  showMessages?: boolean;
}

const Header = ({ showNotifications = true, showMessages = true }: HeaderProps) => {
  const navigate = useNavigate();
  const { pendingRequests } = useFriendships();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-6">
          <div 
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => navigate('/dashboard')}
          >
            <img src={logo} alt="Devseekr" className="w-8 h-8 rounded-lg" />
            <h1 className="text-xl font-bold">Devseekr</h1>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {showMessages && (
            <>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/messages')}
              >
                <MessageSquare className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/friends')}
                className="relative"
              >
                <Users className="h-5 w-5" />
                {pendingRequests.length > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                  >
                    {pendingRequests.length > 9 ? '9+' : pendingRequests.length}
                  </Badge>
                )}
              </Button>
            </>
          )}
          {showNotifications && <NotificationBell />}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/settings')}
          >
            <Settings className="h-5 w-5" />
          </Button>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Sair
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;
