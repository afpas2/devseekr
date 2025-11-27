import { Button } from '@/components/ui/button';
import { LogOut, MessageSquare, Compass } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import NotificationBell from '@/components/notifications/NotificationBell';

interface HeaderProps {
  showNotifications?: boolean;
  showMessages?: boolean;
}

const Header = ({ showNotifications = true, showMessages = true }: HeaderProps) => {
  const navigate = useNavigate();

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
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">G</span>
            </div>
            <h1 className="text-xl font-bold">GameDev Team Finder</h1>
          </div>
          
          <nav className="flex items-center gap-2">
            <Button
              variant="ghost"
              onClick={() => navigate('/explore-projects')}
              className="gap-2"
            >
              <Compass className="h-4 w-4" />
              Explorar
            </Button>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          {showMessages && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/messages')}
            >
              <MessageSquare className="h-5 w-5" />
            </Button>
          )}
          {showNotifications && <NotificationBell />}
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
