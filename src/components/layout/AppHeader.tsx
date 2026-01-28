import { useLocation } from 'react-router-dom';
import { SidebarTrigger } from '@/components/ui/sidebar';
import NotificationBell from '@/components/notifications/NotificationBell';
import { ThemeToggle } from '@/components/ThemeToggle';

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

const AppHeader = () => {
  const location = useLocation();

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
      return 'Detalhes do Projeto';
    }
    if (location.pathname.startsWith('/profile/')) {
      return 'Perfil';
    }
    
    return 'Dashboard';
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center justify-between h-16 px-6">
        {/* Left Side - Trigger + Page Title */}
        <div className="flex items-center gap-4">
          <SidebarTrigger className="-ml-1" />
          <h1 className="text-xl font-bold text-foreground">{getPageTitle()}</h1>
        </div>

        {/* Right Side - Notifications + Theme Toggle */}
        <div className="flex items-center gap-2">
          <NotificationBell />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
