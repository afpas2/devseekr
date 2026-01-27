import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Search } from 'lucide-react';
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
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');

  const getPageTitle = () => {
    // Check exact match first
    if (pageTitles[location.pathname]) {
      return pageTitles[location.pathname];
    }
    
    // Check for dynamic routes
    if (location.pathname.startsWith('/projects/') && location.pathname !== '/projects/new') {
      return 'Detalhes do Projeto';
    }
    if (location.pathname.startsWith('/profile/')) {
      return 'Perfil';
    }
    
    return 'Dashboard';
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/explore-projects?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center justify-between h-16 px-6">
        {/* Left Side - Trigger + Page Title */}
        <div className="flex items-center gap-4">
          <SidebarTrigger className="-ml-1" />
          <h1 className="text-xl font-bold text-foreground">{getPageTitle()}</h1>
        </div>

        {/* Center - Search Bar */}
        <form onSubmit={handleSearch} className="hidden md:block flex-1 max-w-md mx-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Pesquisar projetos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-muted/50 border-transparent focus:border-primary/20 focus:bg-background"
            />
          </div>
        </form>

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
