import React, { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { 
  LayoutDashboard, 
  Truck, 
  Wrench, 
  DiscAlbum, 
  Fuel, 
  FileWarning, 
  MapPin, 
  Users,
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useMediaQuery } from '../../hooks/use-media-query';

interface MainLayoutSimpleProps {
  children: React.ReactNode;
}

interface NavItemProps {
  href: string;
  icon: React.ReactNode;
  title: string;
  isActive: boolean;
  onClick?: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ href, icon, title, isActive, onClick }) => {
  return (
    <Link href={href}>
      <a
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary",
          isActive ? "bg-muted font-medium text-primary" : "text-muted-foreground"
        )}
        onClick={onClick}
      >
        {icon}
        <span>{title}</span>
      </a>
    </Link>
  );
};

const MainLayoutSimple: React.FC<MainLayoutSimpleProps> = ({ children }) => {
  const [location] = useLocation();
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const closeSidebar = () => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  const navItems = [
    { href: '/', icon: <LayoutDashboard className="h-5 w-5" />, title: 'Dashboard' },
    { href: '/vehicles', icon: <Truck className="h-5 w-5" />, title: 'Veículos' },
    { href: '/maintenance', icon: <Wrench className="h-5 w-5" />, title: 'Manutenções' },
    { href: '/tires', icon: <DiscAlbum className="h-5 w-5" />, title: 'Pneus' },
    { href: '/refueling', icon: <Fuel className="h-5 w-5" />, title: 'Abastecimentos' },
    { href: '/fines', icon: <FileWarning className="h-5 w-5" />, title: 'Multas' },
    { href: '/line-hall', icon: <MapPin className="h-5 w-5" />, title: 'Linhas' },
    { href: '/users', icon: <Users className="h-5 w-5" />, title: 'Usuários' },
  ];

  return (
    <div className="flex min-h-screen">
      {/* Mobile sidebar toggle */}
      {isMobile && (
        <div className="fixed top-4 left-4 z-50">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="rounded-full"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      )}

      {/* Sidebar */}
      <div 
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 border-r bg-background transition-transform duration-300 ease-in-out",
          isMobile && !sidebarOpen ? "-translate-x-full" : "translate-x-0"
        )}
      >
        <div className="flex h-full flex-col">
          <div className="flex h-16 items-center border-b px-6">
            <div className="flex items-center gap-2">
              <Truck className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold">MuricionFleet</span>
            </div>
            {isMobile && (
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setSidebarOpen(false)}
                className="ml-auto"
              >
                <X className="h-5 w-5" />
              </Button>
            )}
          </div>
          <div className="flex-1 overflow-auto py-4 px-3">
            <nav className="flex flex-col gap-1">
              {navItems.map((item) => (
                <NavItem
                  key={item.href}
                  href={item.href}
                  icon={item.icon}
                  title={item.title}
                  isActive={location === item.href}
                  onClick={closeSidebar}
                />
              ))}
            </nav>
          </div>
          <div className="border-t p-3">
            <Button variant="outline" className="w-full justify-start" onClick={() => {
              window.location.href = '/login';
            }}>
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <main 
        className={cn(
          "flex-1 transition-all duration-300 ease-in-out",
          !isMobile && "ml-64"
        )}
      >
        <div className="container mx-auto py-6 px-4 md:py-10">
          {children}
        </div>
      </main>
      
      {/* Overlay for mobile */}
      {isMobile && sidebarOpen && (
        <div 
          className="fixed inset-0 z-30 bg-black/50" 
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default MainLayoutSimple;