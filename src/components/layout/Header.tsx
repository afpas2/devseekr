import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  LogOut, 
  MessageSquare, 
  Users, 
  Settings, 
  Crown,
  Sparkles
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import NotificationBell from '@/components/notifications/NotificationBell';
import { useFriendships } from '@/hooks/useFriendships';
import { useUserPlan } from '@/hooks/useUserPlan';
import logo from '@/assets/logo.png';
import { ThemeToggle } from '../ThemeToggle';

interface HeaderProps {
  showNotifications?: boolean;
  showMessages?: boolean;
}

const Header = ({ showNotifications = true, showMessages = true }: HeaderProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { pendingRequests } = useFriendships();
  const { plan } = useUserPlan();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-lg supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <div 
          className="flex items-center gap-3 cursor-pointer group"
          onClick={() => navigate('/dashboard')}
        >
          <img 
            src={logo} 
            alt="Devseekr" 
            className="w-9 h-9 rounded-xl shadow-sm group-hover:shadow-md transition-shadow" 
          />
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold font-display">Devseekr</h1>
            {plan === 'premium' && (
              <span className="badge-premium flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                PRO
              </span>
            )}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center gap-1">
          {showMessages && (
            <>
              <Button
                variant={isActive('/messages') ? 'secondary' : 'ghost'}
                size="icon"
                onClick={() => navigate('/messages')}
                className="relative"
              >
                <MessageSquare className="h-5 w-5" />
              </Button>
              <Button
                variant={isActive('/friends') ? 'secondary' : 'ghost'}
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
            variant={isActive('/pricing') ? 'secondary' : 'ghost'}
            size="icon"
            onClick={() => navigate('/pricing')}
            title="Planos"
            className={plan === 'freemium' ? 'text-warning hover:text-warning' : ''}
          >
            <Crown className="h-5 w-5" />
          </Button>
          
          <Button
            variant={isActive('/settings') ? 'secondary' : 'ghost'}
            size="icon"
            onClick={() => navigate('/settings')}
          >
            <Settings className="h-5 w-5" />
          </Button>
          
          <ThemeToggle />
          
          <div className="w-px h-6 bg-border mx-2" />
          
          <Button 
            variant="ghost" 
            size="sm"
            onClick={handleLogout}
            className="gap-2 text-muted-foreground hover:text-foreground"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Sair</span>
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;
