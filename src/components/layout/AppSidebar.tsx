import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  LayoutDashboard,
  FolderKanban,
  MessageSquare,
  Users,
  Compass,
  Sparkles,
  Crown,
  User,
  Settings,
  LogOut,
  ChevronUp,
} from 'lucide-react';
import { useUserPlan } from '@/hooks/useUserPlan';
import { useFriendships } from '@/hooks/useFriendships';
import logo from '@/assets/logo.png';

const AppSidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const { plan } = useUserPlan();
  const { pendingRequests } = useFriendships();
  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<{ username: string; avatar_url: string | null } | null>(null);
  const [popoverOpen, setPopoverOpen] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUserId(session.user.id);
        const { data } = await supabase
          .from('profiles')
          .select('username, avatar_url')
          .eq('id', session.user.id)
          .maybeSingle();
        
        if (data) {
          setProfile(data);
        }
      }
    };

    loadProfile();
  }, []);

  const menuItems = [
    { 
      title: 'Dashboard', 
      url: '/dashboard', 
      icon: LayoutDashboard 
    },
    { 
      title: 'Meus Projetos', 
      url: '/projects', 
      icon: FolderKanban 
    },
    { 
      title: 'Explorar', 
      url: '/explore-projects', 
      icon: Compass 
    },
    { 
      title: 'Mensagens', 
      url: '/messages', 
      icon: MessageSquare 
    },
    { 
      title: 'Amigos', 
      url: '/friends', 
      icon: Users,
      badge: pendingRequests.length > 0 ? pendingRequests.length : undefined
    },
  ];

  const isActive = (path: string) => {
    if (path.includes('/profile/')) {
      return location.pathname.startsWith('/profile/');
    }
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const handleLogout = async () => {
    setPopoverOpen(false);
    await supabase.auth.signOut();
    navigate('/auth');
  };

  const handleNavigate = (path: string) => {
    setPopoverOpen(false);
    navigate(path);
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-border/50">
      <SidebarHeader className="p-3">
        <div 
          className="flex items-center gap-2 cursor-pointer group"
          onClick={() => navigate('/dashboard')}
        >
          <img 
            src={logo} 
            alt="Devseekr" 
            className="w-8 h-8 rounded-xl shadow-sm group-hover:shadow-md transition-shadow flex-shrink-0" 
          />
          {!collapsed && (
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold font-display">Devseekr</span>
              {plan === 'premium' && (
                <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0 text-xs px-1.5">
                  <Sparkles className="w-3 h-3 mr-0.5" />
                  PRO
                </Badge>
              )}
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    onClick={() => navigate(item.url)}
                    isActive={isActive(item.url)}
                    tooltip={item.title}
                    className={`
                      relative transition-all duration-200
                      ${isActive(item.url) 
                        ? 'bg-primary/15 text-primary font-medium shadow-sm before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:h-6 before:w-1 before:bg-primary before:rounded-r-full' 
                        : 'hover:bg-muted/80 hover:translate-x-0.5'
                      }
                    `}
                  >
                    <item.icon className="w-5 h-5" />
                    {!collapsed && <span>{item.title}</span>}
                    {item.badge && !collapsed && (
                      <Badge 
                        variant="destructive" 
                        className="ml-auto h-5 w-5 flex items-center justify-center p-0 text-xs"
                      >
                        {item.badge > 9 ? '9+' : item.badge}
                      </Badge>
                    )}
                    {item.badge && collapsed && (
                      <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center">
                        {item.badge > 9 ? '9+' : item.badge}
                      </span>
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Planos Link */}
        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  onClick={() => navigate('/pricing')}
                  tooltip="Planos"
                  className={`
                    ${plan === 'freemium' ? 'text-amber-600 hover:text-amber-700' : ''}
                    ${isActive('/pricing') ? 'bg-primary/10' : 'hover:bg-muted'}
                  `}
                >
                  <Crown className="w-5 h-5" />
                  {!collapsed && <span>Planos</span>}
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* User Profile Section - Fixed at Bottom */}
      <SidebarFooter className="p-2 border-t border-border/50">
        <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
          <PopoverTrigger asChild>
            <button
              className={`
                w-full flex items-center gap-3 p-2 rounded-lg transition-all
                hover:bg-muted/80 bg-muted/50
                ${collapsed ? 'justify-center' : ''}
              `}
            >
              <Avatar className="h-9 w-9 flex-shrink-0">
                <AvatarImage src={profile?.avatar_url || ''} alt={profile?.username} />
                <AvatarFallback className="bg-primary/10 text-primary text-sm">
                  {profile?.username?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              {!collapsed && (
                <>
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-sm font-medium truncate">{profile?.username || 'Utilizador'}</p>
                    <p className="text-xs text-muted-foreground">
                      {plan === 'premium' ? 'Premium' : 'Free'}
                    </p>
                  </div>
                  <ChevronUp className="w-4 h-4 text-muted-foreground" />
                </>
              )}
            </button>
          </PopoverTrigger>
          <PopoverContent 
            side={collapsed ? 'right' : 'top'} 
            align="start"
            className="w-56 p-2"
          >
            <div className="space-y-1">
              <button
                onClick={() => handleNavigate(userId ? `/profile/${userId}` : '/dashboard')}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md hover:bg-muted transition-colors"
              >
                <User className="w-4 h-4" />
                Ver Perfil
              </button>
              <button
                onClick={() => handleNavigate('/settings')}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md hover:bg-muted transition-colors"
              >
                <Settings className="w-4 h-4" />
                Definições
              </button>
              <div className="border-t border-border my-1" />
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md hover:bg-destructive/10 text-destructive transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sair
              </button>
            </div>
          </PopoverContent>
        </Popover>
      </SidebarFooter>
    </Sidebar>
  );
};

export default AppSidebar;
