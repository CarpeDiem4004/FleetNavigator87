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
  FileText,
  Package,
  Map,
  CreditCard
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
    { name: 'Motoristas', href: '/drivers', icon: Users },
    // { name: 'Manutenções', href: '/maintenance', icon: Wrench },
    { name: 'Sol. Manutenção', href: '/manutencao', icon: FileText },
    { name: 'Trat. Manutenção', href: '/tratativa-manutencao', icon: Wrench },
    { name: 'Pneus', href: '/tires', icon: CircleDot },
    { name: 'Abastecimentos', href: '/refueling', icon: Fuel, subItems: [
      { name: 'Cartão de Combustível', href: '/fuel-card', icon: CreditCard }
    ]},
    { name: 'Cartão de Combustível', href: '/fuel-card', icon: CreditCard, showInMenu: false }, // Adicionado com showInMenu: false para manter permissão
    { name: 'Multas', href: '/fines', icon: AlertTriangle },
    { name: 'Line Hall Shopee', href: '/line-hall-shopee', icon: Map },
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
    { name: 'Abastecimentos', href: '/refueling', icon: Fuel, subItems: [
      { name: 'Cartão de Combustível', href: '/fuel-card', icon: CreditCard }
    ]},
    { name: 'Cartão de Combustível', href: '/fuel-card', icon: CreditCard, showInMenu: false }, // Adicionado com showInMenu: false para manter permissão
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
  
  // Filtrando itens de navegação com base nas permissões do usuário e exibição no menu
  const navItems = navItemsBase.filter(item => hasPermission(item.href) && item.showInMenu !== false);

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
              {/* Todos os itens de navegação incluindo Dashboard e Veículos */}
              {navItems.map((item) => {
                const isActive = location === item.href;
                const isSubItemActive = item.subItems?.some(subItem => location === subItem.href);
                const Icon = item.icon;
                
                // Use um elemento diferente se tiver subitens para evitar aninhar <a> dentro de <a>
                return (
                  <div key={item.name}>
                    {item.subItems ? (
                      // Use um botão se tiver subitens
                      <button 
                        onClick={() => closeSidebar()}
                        className={`flex w-full items-center px-4 py-3 rounded-md group transition-colors duration-200 text-left ${
                          isActive || isSubItemActive
                            ? 'text-white bg-primary-900' 
                            : 'text-primary-100 hover:bg-primary-700'
                        }`}
                      >
                        <Icon className="w-6" size={18} />
                        <span className="ml-3">{item.name}</span>
                      </button>
                    ) : (
                      // Use Link se não tiver subitens
                      <Link 
                        href={item.href} 
                        onClick={closeSidebar}
                        className={`flex items-center px-4 py-3 rounded-md group transition-colors duration-200 ${
                          isActive || isSubItemActive
                            ? 'text-white bg-primary-900' 
                            : 'text-primary-100 hover:bg-primary-700'
                        }`}
                      >
                        <Icon className="w-6" size={18} />
                        <span className="ml-3">{item.name}</span>
                      </Link>
                    )}
                    
                    {/* Renderizar subitens se existirem */}
                    {item.subItems && (
                      <div className="ml-8 mt-1 space-y-1">
                        {item.subItems.map(subItem => {
                          const SubIcon = subItem.icon;
                          const isSubActive = location === subItem.href;
                          
                          return (
                            <Link
                              key={subItem.name}
                              href={subItem.href}
                              onClick={closeSidebar}
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
