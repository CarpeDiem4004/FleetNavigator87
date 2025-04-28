import React, { ReactNode } from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/context/AuthContext';
import { 
  Building2, 
  Car,
  Wrench,
  CircleDollarSign,
  ReceiptText,
  Truck,
  Users,
  Fuel,
  BarChart4,
  MenuIcon,
  X,
  LogOut,
  AlertCircle,
  ShieldCheck,
  FileText,
  MessageSquare,
  Package,
  Boxes,
  CreditCard
} from 'lucide-react';
import backgroundImage from '../../assets/background.jpeg';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface AppLayoutProps {
  children: ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [postosExpanded, setPostosExpanded] = React.useState(false);
  const [cartaoExpanded, setCartaoExpanded] = React.useState(false);
  
  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: 'Logout bem-sucedido',
        description: 'Você foi desconectado do sistema',
      });
    } catch (error) {
      toast({
        title: 'Erro ao fazer logout',
        description: 'Houve um problema ao tentar desconectar',
        variant: 'destructive',
      });
    }
  };

  // Links de navegação
  const navLinks = [
    { href: '/', label: 'Dashboard', icon: BarChart4 },
    { href: '/fleet-management', label: 'Gestão de Frota', icon: Truck },
    { href: '/vehicles', label: 'Veículos', icon: Car },
    // { href: '/maintenance', label: 'Manutenções', icon: Wrench },
    { href: '/tires', label: 'Pneus', icon: CircleDollarSign },
    // Cartão de Abastecimento com Posto Remédios como submenu
    { 
      href: '#', 
      label: 'Cartão',
      icon: CreditCard,
      hasSubmenu: true,
      expanded: cartaoExpanded,
      toggle: () => setCartaoExpanded(!cartaoExpanded),
      submenu: [
        { href: '/fuel-card', label: 'Solicitações de Cartão' },
        { href: '/posto-remedios', label: 'Posto Remédios' },
      ]
    },
    { 
      href: '#', 
      label: 'Abastecimento',
      icon: Fuel,
      hasSubmenu: true,
      expanded: postosExpanded,
      toggle: () => setPostosExpanded(!postosExpanded),
      submenu: [
        { href: '/posto/osasco_v2', label: 'Posto Osasco V2' },
        { href: '/posto/guarulhos_v2', label: 'Posto Alair V2' },
        { href: '/posto/campinas_v2', label: 'Posto Campinas V2' },
        { href: '/posto/abc_v2', label: 'Posto ABC V2' },
        { href: '/posto/socorro_v2', label: 'Posto Socorro V2' },
        { href: '/posto/sorocaba_v2', label: 'Posto Sorocaba V2' },
        { href: '/postos/historico-geral', label: 'Histórico Geral' },
        { href: '/postos/historico-patio', label: 'Histórico Pátio' },
        { href: '/postos/visao-geral', label: 'Visão Geral dos Postos' },
      ]
    },
    { href: '/fines', label: 'Multas', icon: ReceiptText },
    { href: '/line-hall-shopee', label: 'Line Hall', icon: Truck },
    { href: '/drivers', label: 'Motoristas', icon: Users },
    { href: '/manutencao', label: 'Solicitações de Manutenção', icon: FileText },
    { href: '/tratativa-manutencao', label: 'Tratativas de Manutenção', icon: Wrench },
    { href: '/accidents', label: 'Sinistros e Roubos', icon: AlertCircle },
    { href: '/work-safety', label: 'Segurança do Trabalho', icon: ShieldCheck },
    { href: '/users', label: 'Usuários', icon: Users },
    { href: '/bases', label: 'Bases', icon: Building2 },
    { href: '/solicitacoes', label: 'Solicitações da Base', icon: MessageSquare },
  ];

  // Expandir automaticamente Abastecimento se estivermos em uma página de posto
  React.useEffect(() => {
    if ((location.startsWith('/postos') || location.startsWith('/posto/')) && !postosExpanded) {
      setPostosExpanded(true);
    }
  }, [location, postosExpanded]);
  
  // Expandir automaticamente Cartão se estivermos em uma página relacionada
  React.useEffect(() => {
    if ((location.startsWith('/fuel-card') || location.startsWith('/posto-remedios')) && !cartaoExpanded) {
      setCartaoExpanded(true);
    }
  }, [location, cartaoExpanded]);

  // Verificar se o link está ativo
  const isActive = (href: string) => {
    if (href === '/') {
      return location === '/';
    }
    return location.startsWith(href);
  };

  const Sidebar = () => (
    <div className={cn("h-full flex flex-col bg-card border-r overflow-y-auto")}>
      <div className="flex items-center justify-between p-4 border-b">
        <div>
          <a 
            href="/"
            onClick={(e) => {
              e.preventDefault();
              window.history.pushState(null, "", "/");
              window.dispatchEvent(new PopStateEvent("popstate"));
            }}
            className="flex items-center gap-2"
          >
            <Truck className="h-6 w-6 text-primary" />
            <span className="font-bold text-lg">Frota</span>
          </a>
        </div>
        {isMobile && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        )}
      </div>
      
      <nav className="flex-1 p-2">
        <ul className="space-y-1">
          {navLinks.map((link) => (
            <li key={link.label}>
              {link.hasSubmenu ? (
                <div>
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full justify-start gap-2 font-normal",
                      isActive(link.href) && "bg-accent text-accent-foreground font-medium"
                    )}
                    onClick={link.toggle}
                  >
                    <link.icon className="h-4 w-4" />
                    {link.label}
                    <svg
                      className={cn("ml-auto h-4 w-4 transition-transform", link.expanded && "rotate-90")}
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="m9 18 6-6-6-6" />
                    </svg>
                  </Button>
                  {link.expanded && (
                    <ul className="mt-1 ml-4 space-y-1 border-l pl-2">
                      {link.submenu?.map((subLink) => (
                        <li key={subLink.label}>
                          <div>
                            <a 
                              href={subLink.href}
                              onClick={(e) => {
                                e.preventDefault();
                                window.history.pushState(null, "", subLink.href);
                                window.dispatchEvent(new PopStateEvent("popstate"));
                                if (isMobile) {
                                  setSidebarOpen(false);
                                }
                              }}
                              className={cn(
                                "block py-1.5 px-2 text-sm rounded-md hover:bg-accent",
                                isActive(subLink.href) && "bg-accent font-medium text-accent-foreground"
                              )}
                            >
                              {subLink.label}
                            </a>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ) : (
                <div>
                  <a 
                    href={link.href}
                    onClick={(e) => {
                      e.preventDefault();
                      window.history.pushState(null, "", link.href);
                      window.dispatchEvent(new PopStateEvent("popstate"));
                      if (isMobile) {
                        setSidebarOpen(false);
                      }
                    }}
                    className={cn(
                      "flex items-center gap-2 py-2 px-3 rounded-md hover:bg-accent",
                      isActive(link.href) && "bg-accent text-accent-foreground font-medium"
                    )}
                  >
                    <link.icon className="h-4 w-4" />
                    <span>{link.label}</span>
                  </a>
                </div>
              )}
            </li>
          ))}
        </ul>
      </nav>
      
      <div className="p-4 border-t mt-auto">
        {user && (
          <div className="flex flex-col gap-2">
            <div className="flex flex-col">
              <span className="font-medium">{user.name}</span>
              <span className="text-xs text-muted-foreground">{user.email}</span>
            </div>
            <Button variant="outline" size="sm" onClick={handleLogout} className="w-full gap-2">
              <LogOut className="h-4 w-4" />
              Sair
            </Button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-background">
      {/* Camada de fundo branca com transparência */}
      <div 
        className="fixed inset-0 pointer-events-none opacity-30"
        style={{ 
          backgroundImage: `url(${backgroundImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      ></div>
      
      {/* Sidebar para desktop */}
      {!isMobile && (
        <div className="w-64 hidden md:block z-10">
          <Sidebar />
        </div>
      )}
      
      {/* Conteúdo principal */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative z-10">
        {/* Header para mobile */}
        {isMobile && (
          <header className="border-b bg-card p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MenuIcon className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0 w-64">
                  <Sidebar />
                </SheetContent>
              </Sheet>
              <div>
                <a 
                  href="/"
                  onClick={(e) => {
                    e.preventDefault();
                    window.history.pushState(null, "", "/");
                    window.dispatchEvent(new PopStateEvent("popstate"));
                    setSidebarOpen(false);
                  }}
                  className="flex items-center gap-2"
                >
                  <Truck className="h-5 w-5 text-primary" />
                  <span className="font-bold">Sistema de Gestão de Frotas</span>
                </a>
              </div>
            </div>
          </header>
        )}
        
        {/* Conteúdo da página */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AppLayout;