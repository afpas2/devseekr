import { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import AppSidebar from './AppSidebar';
import AppHeader from './AppHeader';

interface AppLayoutProps {
  children: ReactNode;
}

const AppLayout = ({ children }: AppLayoutProps) => {
  const location = useLocation();
  
  // Check if we're on a project detail page (but not /projects or /projects/new)
  const isProjectPage = /^\/projects\/[a-zA-Z0-9-]+$/.test(location.pathname) || 
                        location.pathname.includes('/projects/') && location.pathname.includes('/review');

  // Full-width layout for project pages (immersive work mode)
  if (isProjectPage) {
    return (
      <div className="min-h-screen flex flex-col w-full">
        <AppHeader hideToggle />
        <main className="flex-1 bg-muted/30">
          {children}
        </main>
      </div>
    );
  }

  // Standard sidebar layout for other pages
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <SidebarInset className="flex-1 flex flex-col">
          <AppHeader />
          <main className="flex-1 bg-muted/30">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default AppLayout;
