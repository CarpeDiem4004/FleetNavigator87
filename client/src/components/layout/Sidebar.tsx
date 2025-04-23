import React, { useState } from 'react';
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
  Warehouse, 
  Users, 
  LogOut,
  ClipboardList,
  BarChart4,
  Activity,
  ChevronsDown,
  ShieldAlert,
  FileText,
  Package,
  Map,
  CreditCard,
  ChevronDown,
  ChevronRight
} from 'lucide-react';

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  subItems?: NavItem[];
  showInMenu?: boolean;
}

interface SidebarProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

// Componente NavItemWithSubmenu para gerenciar itens de menu com submenus
const NavItemWithSubmenu: React.FC<{
  item: NavItem;
  isActive: boolean;
  isSubItemActive: boolean;
  onClose: () => void;
  currentLocation: string;
}> = ({ item, isActive, isSubItemActive, onClose, currentLocation }) => {
  const [expanded, setExpanded] = useState(isActive || isSubItemActive);
  const Icon = item.icon;

  const toggleExpanded = () => {
    setExpanded(!expanded);
  };

  return (
    <div className="mb-1">
      <div
        onClick={toggleExpanded}
        className={`flex w-full items-center justify-between px-4 py-3 rounded-md group transition-colors duration-200 text-left cursor-pointer ${
          isActive || isSubItemActive
            ? 'text-white bg-primary-900' 
            : 'text-primary-100 hover:bg-primary-700'
        }`}
      >
        <div className="flex items-center">
          <Icon className="w-6" size={18} />
          <span className="ml-3">{item.name}</span>
        </div>
        <div>
          {expanded ? (
            <ChevronDown size={16} />
          ) : (
            <ChevronRight size={16} />
          )}
        </div>
      </div>
      
      {expanded && item.subItems && (
        <div className="ml-8 mt-1 space-y-1">
          {item.subItems.map(subItem => {
            const SubIcon = subItem.icon;
            const isSubActive = currentLocation === subItem.href;
            
            return (
              <Link
                key={subItem.name}
                href={subItem.href}
                onClick={onClose}
                className={`flex items-center px-4 py-2 rounded-md group transition-colors duration-200 ${
                  isSubActive
                    ? 'text-white bg-primary-900' 
                    : 'text-primary-100 hover:bg-primary-700'
                }`}
              >
                <SubIcon className="w-5" size={16} />
                <span className="ml-2 text-sm">{subItem.name}</span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};

// Componente NavItem para itens de menu simples sem submenu
const NavItem: React.FC<{
  item: NavItem;
  isActive: boolean;
  onClose: () => void;
}> = ({ item, isActive, onClose }) => {
  const Icon = item.icon;
  
  return (
    <Link 
      href={item.href} 
      onClick={onClose}
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
};

const Sidebar: React.FC<SidebarProps> = ({ open, setOpen }) => {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const { hasPermission } = useBasePermission();
  
  // Função para fechar o sidebar em telas menores quando um item é clicado
  const closeSidebar = () => {
    if (window.innerWidth < 1024) {
      setOpen(false);
    }
  };

  if (!user) {
    return null;
  }
  
  // Lista completa de itens de navegação disponíveis
  const allNavItems = [
    { name: 'Dashboard', href: '/', icon: Gauge },
    { name: 'Dashboard Executivo', href: '/executive-dashboard', icon: BarChart4 },
    { name: 'Veículos', href: '/vehicles', icon: Truck },
    { name: 'Motoristas', href: '/drivers', icon: Users },
    // { name: 'Manutenções', href: '/maintenance', icon: Wrench },
    { name: 'Sol. Manutenção', href: '/manutencao', icon: FileText },
    { name: 'Trat. Manutenção', href: '/tratativa-manutencao', icon: Wrench },
    { name: 'Pneus', href: '/tires', icon: CircleDot },
    { name: 'Abastecimentos', href: '#', icon: Fuel, subItems: [
      { name: 'Histórico', href: '/refueling', icon: ClipboardList },
      { name: 'Posto Remédios', href: '/posto-remedios', icon: Fuel }
    ]},
    { name: 'Cartão de Abastecimento', href: '#', icon: CreditCard, subItems: [
      { name: 'Operações', href: '/fuel-card', icon: CreditCard },
      { name: 'Painel de Solicitações', href: '/fuel-card-requests', icon: ClipboardList }
    ]},
    { name: 'Multas', href: '/fines', icon: AlertTriangle },
    { name: 'Line Hall', href: '/line-hall-shopee', icon: Map },
    { name: 'Bases', href: '/bases', icon: Warehouse },
    { name: 'Usuários', href: '/users', icon: Users },
  ];

  // Itens específicos para Gestão de Frotas
  const fleetManagementItems = [
    { name: 'Gestão de Frotas', href: '/fleet-management', icon: Truck },
    { name: 'Sistema de Manutenção', href: '/fleet-management/maintenance', icon: Wrench },
    { name: 'Sol. Manutenção', href: '/manutencao', icon: FileText },
    { name: 'Trat. Manutenção', href: '/tratativa-manutencao', icon: Wrench },
    { name: 'Oficinas Credenciadas', href: '/fleet-management/workshops', icon: ClipboardList },
    { name: 'Gestão de Estoque', href: '/fleet-management/inventory', icon: Package },
    { name: 'Abastecimentos', href: '#', icon: Fuel, subItems: [
      { name: 'Histórico', href: '/refueling', icon: ClipboardList },
      { name: 'Posto Remédios', href: '/posto-remedios', icon: Fuel }
    ]},
    { name: 'Cartão de Abastecimento', href: '#', icon: CreditCard, subItems: [
      { name: 'Operações', href: '/fuel-card', icon: CreditCard },
      { name: 'Painel de Solicitações', href: '/fuel-card-requests', icon: ClipboardList }
    ]},
    { name: 'Line Hall Shopee', href: '/line-hall-shopee', icon: Map },
    { name: 'Análise da Operação', href: '/fleet-management/operational-analysis', icon: BarChart4 },
    { name: 'Visão Geral da Frota', href: '/fleet-management/fleet-overview', icon: Activity },
    { name: 'Veículos Parados', href: '/fleet-management/downtime-analysis', icon: ChevronsDown },
    { name: 'Segurança do Trabalho', href: '/work-safety', icon: ShieldAlert },
  ];
  
  // Verifique se o usuário é da gestão de frotas
  const isFleetUser = user.basename === "Gestão de Frotas" || user.baseId === 12;
  
  // Selecionando os itens de navegação apropriados
  const navItemsBase = isFleetUser ? fleetManagementItems : allNavItems;
  
  // Filtrando itens de navegação com base nas permissões do usuário
  const navItems = navItemsBase.filter(item => {
    // Sempre incluir menus com submenus (href='#')
    if (item.href === '#') {
      // Verificar se pelo menos um submenu é permitido
      const hasSubItemPermission = item.subItems?.some(subItem => 
        hasPermission(subItem.href)
      );
      return hasSubItemPermission;
    }
    return hasPermission(item.href);
  });

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
              {/* Renderizando itens de menu usando componentes dedicados */}
              {navItems.map((item) => {
                const isActive = location === item.href;
                const isSubItemActive = item.subItems?.some(subItem => location === subItem.href);
                
                return (
                  <div key={item.name} className="mb-1">
                    {item.subItems ? (
                      <NavItemWithSubmenu 
                        item={item} 
                        isActive={isActive} 
                        isSubItemActive={isSubItemActive}
                        onClose={closeSidebar}
                        currentLocation={location}
                      />
                    ) : (
                      <NavItem 
                        item={item} 
                        isActive={isActive}
                        onClose={closeSidebar}
                      />
                    )}
                  </div>
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
