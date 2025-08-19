import { useState, useEffect } from 'react';
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
  KeyRound,
  ShieldAlert,
  FileText,
  Package,
  Map,
  CreditCard,
  ChevronDown,
  ChevronRight,
  Droplets,
} from 'lucide-react';

// Constantes para itens de menu de bases
const baseItems = [
  { name: 'Campinas', href: '/bases/campinas', icon: Warehouse },
  { name: 'Goiânia', href: '/bases/goiania', icon: Warehouse },
  { name: 'Alair', href: '/bases/alair', icon: Warehouse },
  { name: 'Salvador', href: '/bases/salvador', icon: Warehouse },
];

export interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  subItems?: NavItem[];
  showInMenu?: boolean;
  className?: string;
  roles?: string[]; // Roles permitidos para este item
}

interface SidebarProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

// Componente NavItemWithSubmenu para gerenciar itens de menu com submenus
const NavItemWithSubmenu: React.FC<{
  item: NavItem;
  isActive: boolean;
  isSubItemActive: boolean | undefined;
  onClose: () => void;
  currentLocation: string;
}> = ({ item, isActive, isSubItemActive, onClose, currentLocation }) => {
  const subItemActive = isSubItemActive === true;
  const isBases = item.name === 'Bases';
  const isAbastecimentos = item.name === 'Abastecimentos';
  const [expanded, setExpanded] = useState(isActive || subItemActive || isBases || isAbastecimentos);
  
  useEffect(() => {
    if ((subItemActive && !expanded) || (isBases && !expanded) || (isAbastecimentos && !expanded)) {
      setExpanded(true);
    }
  }, [subItemActive, expanded, item.name, isBases, isAbastecimentos]);
  
  const Icon = item.icon;

  const toggleExpanded = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if ((isBases && expanded) || (isAbastecimentos && expanded)) {
      return;
    }
    setExpanded(!expanded);
  };

  const renderSubItems = () => {
    if (!expanded || !item.subItems) {
      return null;
    }
    
    return (
      <div className="ml-8 mt-1 space-y-1">
        {item.subItems.map(subItem => {
          const SubIcon = subItem.icon;
          const isSubActive = currentLocation === subItem.href;
          
          return (
            <div key={subItem.name}>
              <Link 
                href={subItem.href}
                onClick={(e) => {
                  onClose();
                }}
                className={`flex items-center px-4 py-2 rounded-md group transition-all duration-200 cursor-pointer ${
                  isSubActive
                    ? 'text-white bg-primary-900 shadow-md shadow-primary-900/20 border-l-2 border-white font-medium' 
                    : 'text-primary-100 hover:bg-primary-700 hover:shadow-sm'
                } ${subItem.className || ''}`}
              >
                <SubIcon className="w-5" size={16} />
                <span className="ml-2 text-sm">{subItem.name}</span>
              </Link>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="mb-1">
      <div
        onClick={toggleExpanded}
        className={`flex w-full items-center justify-between px-4 py-3 rounded-md group transition-all duration-200 text-left cursor-pointer ${
          isActive || subItemActive
            ? 'text-white bg-primary-900 shadow-lg shadow-primary-900/30 border-l-4 border-white font-medium' 
            : isBases
              ? 'text-white bg-primary-800 shadow-md shadow-primary-900/20 border-l-2 border-white font-medium'
              : 'text-primary-100 hover:bg-primary-700 hover:shadow-md'
        } ${item.className || ''}`}
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
      
      {renderSubItems()}
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
    <div>
      <Link
        href={item.href}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          window.history.pushState(null, "", item.href);
          window.dispatchEvent(new PopStateEvent("popstate"));
          onClose();
        }}
        className={`flex items-center px-4 py-3 rounded-md group transition-all duration-200 cursor-pointer ${
          isActive
            ? 'text-white bg-primary-900 shadow-lg shadow-primary-900/30 border-l-4 border-white font-medium' 
            : 'text-primary-100 hover:bg-primary-700 hover:shadow-md'
        } ${item.className || ''}`}
      >
        <Icon className="w-6" size={18} />
        <span className="ml-3">{item.name}</span>
      </Link>
    </div>
  );
};

const SidebarSimplified: React.FC<SidebarProps> = ({ open, setOpen }) => {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const { hasPermission } = useBasePermission();
  
  const closeSidebar = () => {
    if (window.innerWidth < 1024) {
      setOpen(false);
    }
  };

  if (!user) {
    return null;
  }
  
  // Lista unificada de todos os itens de navegação com controle de roles
  const allMenuItems: NavItem[] = [
    { name: 'Dashboard', href: '/', icon: Gauge, roles: ['admin', 'gestor_frota', 'line_hall', 'gestor_combustivel'] },
    { name: 'Equipamentos', href: '/equipment', icon: Package, roles: ['admin', 'gestor_frota', 'line_hall'] },
    { name: 'Dashboard Executivo', href: '/executive-dashboard', icon: BarChart4, roles: ['admin', 'gestor_frota', 'line_hall'] },
    { name: 'Histórico Consolidado', href: '/postos/historico-consolidado', icon: BarChart4, roles: ['admin', 'gestor_frota', 'line_hall', 'gestor_combustivel'] },
    { name: 'Veículos', href: '/vehicles', icon: Truck, roles: ['admin', 'gestor_frota', 'line_hall'] },
    { name: 'Motoristas', href: '/drivers', icon: Users, roles: ['admin', 'gestor_frota', 'line_hall'] },
    { name: 'Sol. Manutenção', href: '/manutencao', icon: FileText, roles: ['admin', 'gestor_frota', 'line_hall'] },
    { name: 'Trat. Manutenção', href: '/tratativa-manutencao', icon: Wrench, roles: ['admin', 'gestor_frota', 'line_hall'] },
    { name: 'Pneus', href: '/tires', icon: CircleDot, roles: ['admin', 'gestor_frota', 'line_hall'] },
    
    // Menu de Abastecimentos com submenu
    { name: 'Abastecimentos', href: '#', icon: Fuel, roles: ['admin', 'gestor_frota', 'line_hall', 'gestor_combustivel'], subItems: [
      { name: 'Posto Osasco V2', href: '/posto/osasco_v2', icon: Fuel },
      { name: 'Posto Alair V2', href: '/posto/alair_v2', icon: Fuel },
      { name: 'Posto Campinas V2', href: '/posto/campinas_v2', icon: Fuel },
      { name: 'Posto ABC V2', href: '/posto/abc_v2', icon: Fuel },
      { name: 'Posto Socorro V2', href: '/posto/socorro_v2', icon: Fuel },
      { name: 'Posto Sorocaba V2', href: '/posto/sorocaba_v2', icon: Fuel },
      { name: 'Histórico Geral', href: '/refueling', icon: ClipboardList },
      { name: 'Histórico Pátio', href: '/abastecimentos', icon: Gauge },
      { name: 'Visão Geral dos Postos', href: '/postos/visao-geral', icon: BarChart4 },
      { name: 'Consumo Diário', href: '/postos/consumo-diario', icon: BarChart4 },
      { name: 'Histórico Consolidado', href: '/postos/historico-consolidado', icon: BarChart4 },
      { name: 'Gerenciamento Terceiros', href: '/terceiros/gerenciamento', icon: Truck }
    ]},
    
    // Postos Externos
    { name: 'Postos Externos', href: '#', icon: Droplets, roles: ['admin', 'gestor_frota', 'line_hall', 'gestor_combustivel'], subItems: [
      { name: 'Posto Remédios', href: '/posto-remedios', icon: Fuel }
    ]},
    
    // Item de menu separado para Cartão de Abastecimento
    { name: 'Cartão', href: '#', icon: CreditCard, roles: ['admin', 'gestor_frota', 'line_hall', 'gestor_combustivel'], subItems: [
      { name: 'Operações', href: '/fuel-card', icon: CreditCard },
      { name: 'Painel de Solicitações', href: '/fuel-card-requests', icon: ClipboardList }
    ]},
    
    { name: 'Multas', href: '/fines', icon: AlertTriangle, roles: ['admin', 'gestor_frota', 'line_hall'] },
    { name: 'Line Hall', href: '/line-hall-shopee', icon: Map, roles: ['admin', 'gestor_frota', 'line_hall'] },
    
    // Gestão de Frotas (só para gestores de frota)
    { name: 'Gestão de Frotas', href: '/fleet-management', icon: Truck, roles: ['admin', 'gestor_frota'] },
    { name: 'Sistema de Manutenção', href: '/fleet-management/maintenance', icon: Wrench, roles: ['admin', 'gestor_frota'] },
    { name: 'Oficinas Credenciadas', href: '/fleet-management/workshops', icon: ClipboardList, roles: ['admin', 'gestor_frota'] },
    { name: 'Credenciais das Oficinas', href: '/maintenance/oficinas-credentials', icon: KeyRound, roles: ['admin', 'gestor_frota'] },
    { name: 'Gestão de Estoque', href: '/fleet-management/inventory', icon: Package, roles: ['admin', 'gestor_frota'] },
    
    // Parceiros de Guincho
    { name: 'Parceiros de Guincho', href: '#', icon: Truck, roles: ['admin', 'gestor_frota', 'line_hall'], subItems: [
      { name: 'Parceiros', href: '/fleet-management/towing-partners', icon: Truck },
      { name: 'Solicitações', href: '/fleet-management/towing-partners/requests', icon: FileText },
      { name: 'Pagamentos', href: '/fleet-management/towing-partners-payments', icon: CreditCard }
    ] },
    
    // Análises (só para gestores)
    { name: 'Análise da Operação', href: '/fleet-management/operational-analysis', icon: BarChart4, roles: ['admin', 'gestor_frota'] },
    { name: 'Visão Geral da Frota', href: '/fleet-management/fleet-overview', icon: Activity, roles: ['admin', 'gestor_frota'] },
    { name: 'Veículos Parados', href: '/fleet-management/downtime-analysis', icon: ChevronsDown, roles: ['admin', 'gestor_frota'] },
    { name: 'Segurança do Trabalho', href: '/work-safety', icon: ShieldAlert, roles: ['admin', 'gestor_frota'] },
    
    // Submenu para Bases
    { name: 'Bases', href: '#', icon: Warehouse, roles: ['admin', 'gestor_frota', 'line_hall'], subItems: baseItems },
    { name: 'Usuários', href: '/users', icon: Users, roles: ['admin'] },
  ];
  
  // Filtrar itens baseado no role do usuário
  const navItems = allMenuItems.filter(item => {
    // Se não tem roles definidos, mostrar para todos
    if (!item.roles) return true;
    
    // Admin vê tudo
    if (user.role === 'admin') return true;
    
    // Verificar se o role do usuário está na lista de roles permitidos
    return item.roles.includes(user.role);
  });

  return (
    <div
      className={`${
        open ? 'block' : 'hidden'
      } md:flex md:flex-shrink-0 transition-all duration-300 fixed md:relative inset-0 z-40 md:z-auto`}
    >
      <div className="flex flex-col w-64 bg-gradient-to-br from-primary-900 to-primary-800 text-white shadow-xl shadow-primary-900/25 border-r border-primary-900/20">
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
                const isSubItemActive = item.subItems?.some(subItem => location === subItem.href);
                
                return (
                  <div key={item.name} className="mb-1">
                    {item.subItems ? (
                      <NavItemWithSubmenu 
                        item={item} 
                        isActive={isActive} 
                        isSubItemActive={isSubItemActive || false}
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

        {/* User Info and Logout */}
        <div className="border-t border-primary-700 p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {user.name}
              </p>
              <p className="text-xs text-primary-200 truncate">
                {user.email}
              </p>
            </div>
            <button
              onClick={logout}
              className="ml-3 p-2 rounded-md text-primary-200 hover:text-white hover:bg-primary-700 transition-colors"
              title="Sair"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </div>
      
      {/* Overlay para mobile */}
      {open && (
        <div 
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setOpen(false)}
        />
      )}
    </div>
  );
};

export default SidebarSimplified;