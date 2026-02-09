import { useLocation, useNavigate } from 'react-router-dom';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import NotificationBell from '@/components/notifications/NotificationBell';
import { ThemeToggle } from '@/components/ThemeToggle';
import { ArrowLeft, LayoutDashboard } from 'lucide-react';
import logoImage from '@/assets/logo.png';

interface AppHeaderProps {
  hideToggle?: boolean;
}

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/projects': 'Meus Projetos',
  '/projects/new': 'Novo Projeto',
  '/messages': 'Mensagens',
  '/friends': 'Amigos',
  '/explore-projects': 'Explorar Projetos',
  '/settings': 'Definições',
  '/pricing': 'Planos',
};

const AppHeader = ({ hideToggle = false }: AppHeaderProps) => {
  const location = useLocation();
  const navigate = useNavigate();

  const getPageTitle = () => {
    // Check exact match first
    if (pageTitles[location.pathname]) {
      return pageTitles[location.pathname];
    }
    
    // Check for dynamic routes
    if (location.pathname.startsWith('/projects/') && location.pathname !== '/projects/new') {
      if (location.pathname.includes('/review')) {
        return 'Avaliar Equipa';
      }
      return null; // No title for project detail page - we show logo instead
    }
    if (location.pathname.startsWith('/profile/')) {
      return 'Perfil';
    }
    
    return 'Dashboard';
  };

  const pageTitle = getPageTitle();
  const isProjectPage = hideToggle;

  return (
    <header className="sticky top-0 z-40 border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center justify-between h-16 px-6">
        {/* Left Side */}
        <div className="flex items-center gap-4">
          {isProjectPage ? (
            <>
              {/* Back to Dashboard button for project pages */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/dashboard')}
                className="gap-2 text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Voltar</span>
              </Button>
              
              {/* Logo as separator */}
              <div className="h-6 w-px bg-border" />
              
              <img 
                src={logoImage} 
                alt="DevSeekr" 
                className="h-8 w-auto cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => navigate('/dashboard')}
              />
            </>
          ) : (
            <>
              <SidebarTrigger className="-ml-1" />
              {pageTitle && (
                <h1 className="text-xl font-bold text-foreground">{pageTitle}</h1>
              )}
            </>
          )}
        </div>

        {/* Right Side - Notifications + Theme Toggle */}
        <div className="flex items-center gap-2">
          {isProjectPage && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/dashboard')}
              className="gap-2 hidden md:flex"
            >
              <LayoutDashboard className="w-4 h-4" />
              Dashboard
            </Button>
          )}
          <NotificationBell />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
