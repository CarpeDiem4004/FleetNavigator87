import React from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/context/AuthContext';
import { useBasePermission } from '@/hooks/use-base-permission';

// Interface para os itens de navegação
interface NavItem {
  name: string;
  href: string;
  icon: any; // Lucide icons são ForwardRefExoticComponent
  highlight?: boolean;
}

// Icons
import { 
  Truck, 
  Gauge, 
  Wrench, 
  CircleDot, 
  Fuel, 
  AlertTriangle, 
  TrafficCone, 
  Warehouse, 
  Users, 
  LogOut,
  ClipboardList,
  BarChart4,
  Activity,
  Timer,
  ChevronsDown,
  ShieldAlert,
  PackageOpen,
  Waypoints
} from 'lucide-react';

interface SidebarProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ open, setOpen }) => {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const { hasPermission } = useBasePermission();

  if (!user) {
    return null;
  }
  
  // Menu fixo para Aline
  if (user.email === "aline@muricionfleet.com" || user.id === 35) {
    // Forçando menu fixo para Aline
    const alineMenu = [
      { name: 'Dashboard', href: '/', icon: Gauge },
      { name: 'Gestão de Frotas', href: '/fleet-management', icon: Truck },
      { 
        name: 'LINE HALL SHOPEE', 
        href: '/linehall-shopee', 
        icon: Waypoints,
        highlight: true 
      }
    ];
    
    console.log("MENU FIXO PARA ALINE APLICADO");
    
    const closeSidebar = () => {
      if (window.innerWidth < 768) {
        setOpen(false);
      }
    };

    return (
      <div
        className={`${
          open ? 'block' : 'hidden'
        } md:flex md:flex-shrink-0 transition-all duration-300 fixed md:relative inset-0 z-40 md:z-auto`}
      >
        <div className="flex flex-col w-64 bg-primary-800 text-white shadow-lg">
          {/* Logo */}
          <div className="flex items-center justify-center h-16 border-b border-primary-900">
            <h1 className="text-xl font-bold tracking-tight">
              <Truck className="inline-block mr-2" size={20} />
              FleetManager
            </h1>
          </div>

          {/* Navigation */}
          <div className="overflow-y-auto">
            <nav className="flex-1 py-4">
              <div className="space-y-1 px-2">
                {alineMenu.map((item) => {
                  const isActive = location === item.href;
                  const Icon = item.icon;
                  
                  // Verifica se o item deve ser destacado
                  const isHighlighted = 'highlight' in item && item.highlight === true;
                  
                  return (
                    <Link 
                      key={item.name} 
                      href={item.href} 
                      onClick={closeSidebar}
                      className={`flex items-center px-4 py-3 rounded-md group transition-colors duration-200 ${
                        isActive 
                          ? 'text-white bg-primary-900' 
                          : isHighlighted
                            ? 'text-white bg-primary-600 hover:bg-primary-500 font-bold border border-white' 
                            : 'text-primary-100 hover:bg-primary-700'
                      }`}
                    >
                      <Icon className={`w-6 ${isHighlighted ? 'animate-pulse' : ''}`} size={isHighlighted ? 22 : 18} />
                      <span className={`ml-3 ${isHighlighted ? 'font-bold text-lg' : ''}`}>{item.name}</span>
                      {isHighlighted && <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-green-200 text-green-800">NOVO</span>}
                    </Link>
                  );
                })}
              </div>
            </nav>
          </div>

          {/* User profile */}
          <div className="border-t border-primary-900 p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-9 w-9 rounded-full bg-primary-700 flex items-center justify-center text-sm font-medium">
                  {user.name?.charAt(0) || user.email?.charAt(0) || 'U'}
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-white">{user.name || user.email}</p>
                <p className="text-xs text-primary-300">{user.email}</p>
              </div>
              <button
                onClick={logout}
                className="ml-auto text-primary-300 hover:text-white"
                aria-label="Sign out"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Menu normal para todos os outros usuários
  const allNavItems: NavItem[] = [
    { name: 'Dashboard', href: '/', icon: Gauge },
    { name: 'Gestão de Frota', href: '/fleet-management', icon: Truck },
    { name: 'LINE HALL SHOPEE', href: '/linehall-shopee', icon: Waypoints, highlight: true },
    { name: 'Veículos', href: '/vehicles', icon: Truck },
    { name: 'Manutenções', href: '/maintenance', icon: Wrench },
    { name: 'Pneus', href: '/tires', icon: CircleDot },
    { name: 'Abastecimentos', href: '/refueling', icon: Fuel },
    { name: 'Multas', href: '/fines', icon: AlertTriangle },
    { name: 'Sinistros e Roubos', href: '/accidents', icon: TrafficCone },
    { name: 'Segurança do Trabalho', href: '/work-safety', icon: ShieldAlert },
    { name: 'Usuários', href: '/users', icon: Users },
    { name: 'Bases', href: '/bases', icon: Warehouse },
  ];

  // Filtrando itens de navegação baseado nas permissões do usuário
  const navItems = allNavItems.filter(item => hasPermission(item.href));

  const closeSidebar = () => {
    if (window.innerWidth < 768) {
      setOpen(false);
    }
  };

  return (
    <div
      className={`${
        open ? 'block' : 'hidden'
      } md:flex md:flex-shrink-0 transition-all duration-300 fixed md:relative inset-0 z-40 md:z-auto`}
    >
      <div className="flex flex-col w-64 bg-primary-800 text-white shadow-lg">
        {/* Logo */}
        <div className="flex items-center justify-center h-16 border-b border-primary-900">
          <h1 className="text-xl font-bold tracking-tight">
            <Truck className="inline-block mr-2" size={20} />
            FleetManager
          </h1>
        </div>

        {/* Navigation */}
        <div className="overflow-y-auto">
          <nav className="flex-1 py-4">
            <div className="space-y-1 px-2">
              {navItems.map((item) => {
                const isActive = location === item.href;
                const Icon = item.icon;
                
                // Verifica se o item deve ser destacado
                const isHighlighted = 'highlight' in item && item.highlight === true;
                
                return (
                  <Link 
                    key={item.name} 
                    href={item.href} 
                    onClick={closeSidebar}
                    className={`flex items-center px-4 py-3 rounded-md group transition-colors duration-200 ${
                      isActive 
                        ? 'text-white bg-primary-900' 
                        : isHighlighted
                          ? 'text-white bg-primary-600 hover:bg-primary-500 font-bold border border-white' 
                          : 'text-primary-100 hover:bg-primary-700'
                    }`}
                  >
                    <Icon className={`w-6 ${isHighlighted ? 'animate-pulse' : ''}`} size={isHighlighted ? 22 : 18} />
                    <span className={`ml-3 ${isHighlighted ? 'font-bold text-lg' : ''}`}>{item.name}</span>
                    {isHighlighted && <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-green-200 text-green-800">NOVO</span>}
                  </Link>
                );
              })}
            </div>
          </nav>
        </div>

        {/* User profile */}
        <div className="border-t border-primary-900 p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-9 w-9 rounded-full bg-primary-700 flex items-center justify-center text-sm font-medium">
                {user.name?.charAt(0) || user.email?.charAt(0) || 'U'}
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-white">{user.name || user.email}</p>
              <p className="text-xs text-primary-300">{user.email}</p>
            </div>
            <button
              onClick={logout}
              className="ml-auto text-primary-300 hover:text-white"
              aria-label="Sign out"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
