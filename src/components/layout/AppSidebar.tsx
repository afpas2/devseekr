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
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  LayoutDashboard,
  FolderKanban,
  MessageSquare,
  Users,
  User,
  Settings,
  Compass,
  Sparkles,
  LogOut,
  Crown,
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

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setUserId(session.user.id);
      }
    });
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
    { 
      title: 'Perfil', 
      url: userId ? `/profile/${userId}` : '/dashboard', 
      icon: User 
    },
  ];

  const isActive = (path: string) => {
    if (path.includes('/profile/')) {
      return location.pathname.startsWith('/profile/');
    }
    return location.pathname === path;
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-border/50">
      <SidebarHeader className="p-4">
        <div 
          className="flex items-center gap-3 cursor-pointer group"
          onClick={() => navigate('/dashboard')}
        >
          <img 
            src={logo} 
            alt="Devseekr" 
            className="w-10 h-10 rounded-xl shadow-sm group-hover:shadow-md transition-shadow flex-shrink-0" 
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
                        ? 'bg-primary/10 text-primary font-medium' 
                        : 'hover:bg-muted'
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
      </SidebarContent>

      <SidebarFooter className="p-2 space-y-1">
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
          <SidebarMenuItem>
            <SidebarMenuButton 
              onClick={() => navigate('/settings')}
              tooltip="Definições"
              className={isActive('/settings') ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted'}
            >
              <Settings className="w-5 h-5" />
              {!collapsed && <span>Definições</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton 
              onClick={handleLogout}
              tooltip="Sair"
              className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            >
              <LogOut className="w-5 h-5" />
              {!collapsed && <span>Sair</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
};

export default AppSidebar;
