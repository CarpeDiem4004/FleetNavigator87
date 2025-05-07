import React, { useState, useEffect } from 'react';
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
  ChevronRight,
  Droplets
} from 'lucide-react';

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  subItems?: NavItem[];
  showInMenu?: boolean;
  className?: string;
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
  // Se isSubItemActive for undefined, defina como false
  const subItemActive = isSubItemActive === true;
  const [expanded, setExpanded] = useState(isActive || subItemActive);
  
  // Garantir que o submenu seja expandido quando um subitem estiver ativo
  useEffect(() => {
    if (subItemActive && !expanded) {
      setExpanded(true);
    }
  }, [subItemActive, expanded]);
  
  const Icon = item.icon;

  const toggleExpanded = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setExpanded(!expanded);
  };

  // Renderização segura dos subitens condicionalmente
  const renderSubItems = () => {
    if (!expanded || !item.subItems) return null;
    
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
                  e.preventDefault();
                  e.stopPropagation();
                  // Usar wouter para navegação em vez de manipular history diretamente
                  window.history.pushState(null, "", subItem.href);
                  window.dispatchEvent(new PopStateEvent("popstate"));
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
  const allNavItems: NavItem[] = [
    { name: 'Dashboard', href: '/', icon: Gauge },
    { name: 'Dashboard Executivo', href: '/executive-dashboard', icon: BarChart4 },
    { name: 'Veículos', href: '/vehicles', icon: Truck },
    { name: 'Motoristas', href: '/drivers', icon: Users },
    { name: 'Sol. Manutenção', href: '/manutencao', icon: FileText },
    { name: 'Trat. Manutenção', href: '/tratativa-manutencao', icon: Wrench },
    { name: 'Pneus', href: '/tires', icon: CircleDot },
    // Modificado para apontar para a página principal em vez de submenu
    { name: 'Posto Murici', href: '/abastecimentos', icon: Fuel },
    { name: 'Histórico Posto Murici', href: '/refueling', icon: ClipboardList },
    // Postos Externos com submenu atualizado
    { name: 'Postos Externos', href: '#', icon: Droplets, subItems: [
      { name: 'Posto Remédios', href: '/posto-remedios', icon: Fuel },
      { name: 'Posto Murici', href: '/posto-murici', icon: Fuel }
    ]},
    // Item de menu separado para Cartão de Abastecimento
    { name: 'Cartão', href: '#', icon: CreditCard, subItems: [
      { name: 'Operações', href: '/fuel-card', icon: CreditCard },
      { name: 'Painel de Solicitações', href: '/fuel-card-requests', icon: ClipboardList }
    ]},
    { name: 'Multas', href: '/fines', icon: AlertTriangle },
    { name: 'Line Hall', href: '/line-hall-shopee', icon: Map },
    { name: 'Bases', href: '/bases', icon: Warehouse },
    { name: 'Usuários', href: '/users', icon: Users },
  ];

  // Itens específicos para Gestão de Frotas
  const fleetManagementItems: NavItem[] = [
    { name: 'Gestão de Frotas', href: '/fleet-management', icon: Truck },
    { name: 'Sistema de Manutenção', href: '/fleet-management/maintenance', icon: Wrench },
    { name: 'Sol. Manutenção', href: '/manutencao', icon: FileText },
    { name: 'Trat. Manutenção', href: '/tratativa-manutencao', icon: Wrench },
    { name: 'Oficinas Credenciadas', href: '/fleet-management/workshops', icon: ClipboardList },
    { name: 'Gestão de Estoque', href: '/fleet-management/inventory', icon: Package },
    // Modificado para apontar para a página principal em vez de submenu
    { name: 'Posto Murici', href: '/abastecimentos', icon: Fuel },
    { name: 'Histórico Posto Murici', href: '/refueling', icon: ClipboardList },
    // Corrigido para usar o mesmo ícone e estrutura em ambas as listas de navegação
    { name: 'Postos Externos', href: '#', icon: Droplets, subItems: [
      { name: 'Posto Remédios', href: '/posto-remedios', icon: Fuel },
      { name: 'Posto Murici', href: '/posto-murici', icon: Fuel }
    ]},
    // Item de menu separado para Cartão de Abastecimento
    { name: 'Cartão', href: '#', icon: CreditCard, subItems: [
      { name: 'Operações', href: '/fuel-card', icon: CreditCard },
      { name: 'Painel de Solicitações', href: '/fuel-card-requests', icon: ClipboardList }
    ]},
    { name: 'Line Hall', href: '/line-hall-shopee', icon: Map },
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
    // Sempre incluir menu Cartão para todos os usuários
    if (item.name === 'Cartão') {
      console.log(`Menu Cartão incluído independente de permissões`);
      return true;
    }
    
    // Sempre incluir menus com submenus (href='#')
    if (item.href === '#') {
      // Verificar se pelo menos um submenu é permitido
      console.log(`Verificando permissões para submenu "${item.name}" com ${item.subItems?.length || 0} itens`);
      
      if (item.name === "Postos Externos") {
        console.log("\n\n===== DEBUGGING POSTOS EXTERNOS MENU =====");
        console.log(`Usuário: ${user.name} (${user.email}), Role: ${user.role}, Base: ${user.basename || 'N/A'}, BaseID: ${user.baseId || 'N/A'}`);
        console.log("Número de subitems:", item.subItems?.length || 0);
        console.log("SubItems detalhados:", JSON.stringify(item.subItems, null, 2));
        
        if (item.subItems) {
          console.log("Verificando permissões para cada submenu:");
          let temPermissao = false;
          
          item.subItems.forEach(subItem => {
            // Teste explícito para cada submenu
            const permitido = hasPermission(subItem.href);
            console.log(`- Submenu ${subItem.name} (${subItem.href}): ${permitido ? 'PERMITIDO ✅' : 'NEGADO ❌'}`);
            
            if (permitido) {
              temPermissao = true;
            }
          });
          
          console.log(`Menu "Postos Externos" será mostrado: ${temPermissao ? 'SIM ✅' : 'NÃO ❌'}`);
        }
        
        console.log("===== FIM DEBUG POSTOS EXTERNOS =====\n\n");
      }
      
      const hasSubItemPermission = item.subItems?.some(subItem => {
        console.log(`Verificando permissão para submenu ${subItem.name} (${subItem.href}): ${hasPermission(subItem.href) ? 'PERMITIDO' : 'NEGADO'}`);
        return hasPermission(subItem.href);
      });
      console.log(`Menu com submenu "${item.name}" tem permissão: ${hasSubItemPermission ? 'SIM' : 'NÃO'}`);
      return hasSubItemPermission;
    }
    const has = hasPermission(item.href);
    console.log(`Item de menu "${item.name}" (${item.href}) tem permissão: ${has ? 'SIM' : 'NÃO'}`);
    return has;
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