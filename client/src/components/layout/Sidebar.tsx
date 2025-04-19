import React from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/context/AuthContext';
import { useBasePermission } from '@/hooks/use-base-permission';

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
  
  // Lista completa de itens de navegação disponíveis
  const allNavItems = [
    { name: 'Dashboard', href: '/', icon: Gauge },
    { name: 'Veículos', href: '/vehicles', icon: Truck },
    { name: 'Manutenções', href: '/maintenance', icon: Wrench },
    { name: 'Pneus', href: '/tires', icon: CircleDot },
    { name: 'Abastecimentos', href: '/refueling', icon: Fuel },
    { name: 'Multas', href: '/fines', icon: AlertTriangle },
    // Line Hall Shopee - nova implementação
    { name: 'LINE HALL SHOPEE', href: '/linehall-shopee', icon: Waypoints },
    { name: 'Bases', href: '/bases', icon: Warehouse },
    { name: 'Usuários', href: '/users', icon: Users },
  ];

  // Itens específicos para Gestão de Frotas
  const fleetManagementItems = [
    { name: 'Gestão de Frotas', href: '/fleet-management', icon: Truck },
    { name: 'Sistema de Manutenção', href: '/fleet-management/maintenance', icon: Wrench },
    { name: 'Oficinas Credenciadas', href: '/fleet-management/workshops', icon: ClipboardList },
    { name: 'Análise da Operação', href: '/fleet-management/operational-analysis', icon: BarChart4 },
    { name: 'Visão Geral da Frota', href: '/fleet-management/fleet-overview', icon: Activity },
    { name: 'Veículos Parados', href: '/fleet-management/downtime-analysis', icon: ChevronsDown },
    { name: 'Segurança do Trabalho', href: '/work-safety', icon: ShieldAlert },
    { name: 'LINE HALL SHOPEE', href: '/linehall-shopee', icon: Waypoints },
  ];
  
  // Itens específicos para Line Hall
  const lineHallItems = [
    { name: 'Dashboard', href: '/', icon: Gauge },
    { name: 'LINE HALL SHOPEE', href: '/linehall-shopee', icon: Waypoints },
  ];
  
  // Verifique se o usuário é da gestão de frotas
  const isFleetUser = user.basename === "Gestão de Frotas" || user.baseId === 12;
  
  // Verifique se o usuário é do Line Hall
  const isLineHallUser = user.basename === "Line Hall" || user.baseId === 11;
  
  // Selecionando os itens de navegação apropriados
  let navItemsBase;
  if (isFleetUser) {
    navItemsBase = fleetManagementItems;
  } else if (isLineHallUser) {
    navItemsBase = lineHallItems;
  } else {
    navItemsBase = allNavItems;
  }
  
  // Filtrando itens de navegação com base nas permissões do usuário
  const navItems = navItemsBase.filter(item => hasPermission(item.href));

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
                
                return (
                  <Link 
                    key={item.name} 
                    href={item.href} 
                    onClick={closeSidebar}
                    className={`flex items-center px-4 py-3 rounded-md group transition-colors duration-200 ${
                      isActive 
                        ? 'text-white bg-primary-900' 
                        : 'text-primary-100 hover:bg-primary-700'
                    }`}
                  >
                    <Icon className="w-6" size={18} />
                    <span className="ml-3">{item.name}</span>
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
