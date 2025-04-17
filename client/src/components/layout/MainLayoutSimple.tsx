import React, { useState, useEffect } from 'react';
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
  X,
  Building2,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { useBasePermission } from '@/hooks/use-base-permission';
import { BaseInfo } from '@/components/permission/BaseInfo';
import { POSTOS_INFO } from '@/constants/postos';

// Hook interno para substituir o useMediaQuery
function useResponsiveDisplay(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) {
      setMatches(media.matches);
    }

    const listener = () => setMatches(media.matches);
    media.addEventListener('change', listener);

    return () => media.removeEventListener('change', listener);
  }, [matches, query]);

  return matches;
}

interface MainLayoutSimpleProps {
  children: React.ReactNode;
}

interface NavItemProps {
  href: string;
  icon: React.ReactNode;
  title: string;
  isActive: boolean;
  onClick?: () => void;
  hasSubmenu?: boolean;
}

interface NavSubmenuProps {
  title: string;
  icon: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  isActive?: boolean;
}

const NavSubmenu: React.FC<NavSubmenuProps> = ({ 
  title, 
  icon, 
  isOpen, 
  onToggle, 
  children,
  isActive
}) => {
  return (
    <div className="flex flex-col">
      <button
        onClick={onToggle}
        className={cn(
          "flex items-center justify-between gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary w-full text-left",
          isActive ? "bg-muted font-medium text-primary" : "text-muted-foreground"
        )}
      >
        <div className="flex items-center gap-3">
          {icon}
          <span>{title}</span>
        </div>
        {isOpen ? (
          <ChevronDown className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
      </button>
      
      {isOpen && (
        <div className="ml-7 mt-1 border-l pl-3 space-y-1">
          {children}
        </div>
      )}
    </div>
  );
};

const NavItem: React.FC<NavItemProps> = ({ href, icon, title, isActive, onClick, hasSubmenu }) => {
  if (hasSubmenu) {
    return null; // Renderizado separadamente
  }
  
  return (
    <Link 
      href={href}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary",
        isActive ? "bg-muted font-medium text-primary" : "text-muted-foreground"
      )}
    >
      {icon}
      <span>{title}</span>
    </Link>
  );
};

const MainLayoutSimple: React.FC<MainLayoutSimpleProps> = ({ children }) => {
  const [location] = useLocation();
  const isMobile = useResponsiveDisplay("(max-width: 768px)");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [postosSubmenuOpen, setPostosSubmenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const { hasPermission } = useBasePermission();

  const closeSidebar = () => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  };
  
  const handleLogout = async () => {
    try {
      await logout();
      window.location.href = '/login';
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  // Função para verificar se a localização atual é um posto
  const isCurrentLocationPosto = () => {
    return location.startsWith('/posto/');
  };

  // Função para obter o ID do posto atual da URL
  const getCurrentPostoId = () => {
    if (isCurrentLocationPosto()) {
      return location.replace('/posto/', '');
    }
    return null;
  };
  
  // Toggle para o submenu de postos
  const togglePostosSubmenu = () => {
    setPostosSubmenuOpen(!postosSubmenuOpen);
  };

  // Todos os itens de navegação possíveis
  const allNavItems = [
    { href: '/', icon: <LayoutDashboard className="h-5 w-5" />, title: 'Dashboard' },
    { href: '/vehicles', icon: <Truck className="h-5 w-5" />, title: 'Veículos' },
    { href: '/maintenance', icon: <Wrench className="h-5 w-5" />, title: 'Manutenções' },
    { href: '/tires', icon: <DiscAlbum className="h-5 w-5" />, title: 'Pneus' },
    { 
      href: '/refueling', 
      icon: <Fuel className="h-5 w-5" />, 
      title: 'Abastecimentos',
      hasSubmenu: true  // Indica que este item tem submenu
    },
    { href: '/fines', icon: <FileWarning className="h-5 w-5" />, title: 'Multas' },
    { href: '/line-hall', icon: <MapPin className="h-5 w-5" />, title: 'Line Hall' },
    { href: '/fleet-management', icon: <Truck className="h-5 w-5" />, title: 'Gestão de Frota' },
    { href: '/users', icon: <Users className="h-5 w-5" />, title: 'Usuários' },
  ];

  // Filtra os itens de navegação com base nas permissões do usuário
  const navItems = allNavItems.filter(item => hasPermission(item.href));

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
          <div className="border-t p-3 space-y-3">
            {/* Informações da Base do Usuário */}
            <div className="p-2 rounded bg-muted">
              <BaseInfo />
              {user && (
                <div className="mt-1 text-xs text-muted-foreground">
                  {user.name} ({user.role})
                </div>
              )}
            </div>
            
            {/* Botão de Logout */}
            <Button variant="outline" className="w-full justify-start" onClick={handleLogout}>
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