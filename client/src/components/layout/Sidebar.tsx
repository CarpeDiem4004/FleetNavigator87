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

// Constantes para itens de menu
import { baseItems } from './constants/baseItems';

export interface NavItem {
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
  // Forçar a expansão do menu Bases sempre
  const isBases = item.name === 'Bases';
  // Sempre inicializar expandido se for o menu Bases
  const [expanded, setExpanded] = useState(isActive || subItemActive || isBases);
  
  // Garantir que o submenu seja expandido quando um subitem estiver ativo ou quando for o menu Bases
  useEffect(() => {
    if ((subItemActive && !expanded) || (isBases && !expanded)) {
      console.log(`Expandindo menu ${item.name} automaticamente: subItemActive=${subItemActive}, isBases=${isBases}`);
      setExpanded(true);
    }
  }, [subItemActive, expanded, item.name, isBases]);
  
  // Garantir que o menu Bases nunca seja colapsável
  useEffect(() => {
    if (isBases && !expanded) {
      console.log('Forçando o menu Bases a permanecer aberto');
      setExpanded(true);
    }
  }, [expanded, isBases]);
  
  const Icon = item.icon;

  const toggleExpanded = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Se for o menu Bases, não permitir fechá-lo
    if (isBases && expanded) {
      console.log('Tentativa de fechar o menu Bases bloqueada');
      return;
    }
    setExpanded(!expanded);
  };

  // Renderização segura dos subitens condicionalmente
  const renderSubItems = () => {
    if (!expanded || !item.subItems) {
      console.log(`Subitens para ${item.name} não serão renderizados: expanded=${expanded}, subItems=${!!item.subItems}`);
      return null;
    }
    
    console.log(`Renderizando ${item.subItems.length} subitens para ${item.name}: ${JSON.stringify(item.subItems.map(si => si.name))}`);
    
    return (
      <div className="ml-8 mt-1 space-y-1">
        {item.subItems.map(subItem => {
          const SubIcon = subItem.icon;
          const isSubActive = currentLocation === subItem.href;
          
          console.log(`Renderizando subitem: ${subItem.name} (${subItem.href}), active: ${isSubActive}`);
          
          return (
            <div key={subItem.name}>
              <Link 
                href={subItem.href}
                onClick={(e) => {
                  console.log(`Clicou no subitem: ${subItem.name} (${subItem.href})`);
                  // Fechar o menu após a navegação
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
    { name: 'Histórico Consolidado', href: '/postos/historico-consolidado', icon: BarChart4 },
    { name: 'Veículos', href: '/vehicles', icon: Truck },
    { name: 'Motoristas', href: '/drivers', icon: Users },
    { name: 'Sol. Manutenção', href: '/manutencao', icon: FileText },
    { name: 'Trat. Manutenção', href: '/tratativa-manutencao', icon: Wrench },
    { name: 'Pneus', href: '/tires', icon: CircleDot },
    // Menu de Abastecimentos com submenu
    { name: 'Abastecimentos', href: '#', icon: Fuel, subItems: [
      { name: 'Posto Osasco V2', href: '/posto/osasco_v2', icon: Fuel },
      { name: 'Posto Alair V2', href: '/posto/alair_v2', icon: Fuel },
      { name: 'Posto Campinas V2', href: '/posto/campinas_v2', icon: Fuel },
      { name: 'Posto ABC V2', href: '/posto/abc_v2', icon: Fuel },
      { name: 'Posto Socorro V2', href: '/posto/socorro_v2', icon: Fuel },
      { name: 'Posto Sorocaba V2', href: '/posto/sorocaba_v2', icon: Fuel },
      { name: 'Histórico Geral', href: '/refueling', icon: ClipboardList },
      { name: 'Histórico Pátio', href: '/abastecimentos', icon: Gauge },
      { name: 'Visão Geral dos Postos', href: '/postos/visao-geral', icon: BarChart4 },
      { name: 'Histórico Consolidado', href: '/postos/historico-consolidado', icon: BarChart4 }
    ]},
    // Alterado para usar o ícone de posto de gasolina (Droplets) em vez de Warehouse para Postos Externos
    { name: 'Postos Externos', href: '#', icon: Droplets, subItems: [
      { name: 'Posto Remédios', href: '/posto-remedios', icon: Fuel }
    ]},
    // Item de menu separado para Cartão de Abastecimento
    { name: 'Cartão', href: '#', icon: CreditCard, subItems: [
      { name: 'Operações', href: '/fuel-card', icon: CreditCard },
      { name: 'Painel de Solicitações', href: '/fuel-card-requests', icon: ClipboardList }
    ]},
    { name: 'Multas', href: '/fines', icon: AlertTriangle },
    { name: 'Line Hall', href: '/line-hall-shopee', icon: Map },
    { name: 'Parceiros de Guincho', href: '#', icon: Truck, subItems: [
      { name: 'Parceiros', href: '/fleet-management/towing-partners', icon: Truck },
      { name: 'Solicitações', href: '/fleet-management/towing-partners/requests', icon: FileText },
      { name: 'Pagamentos', href: '/fleet-management/towing-partners-payments', icon: CreditCard }
    ] },
    // Submenu para Bases com opções específicas para Campinas
    { name: 'Bases', href: '#', icon: Warehouse, subItems: baseItems },
    { name: 'Usuários', href: '/users', icon: Users },
  ];

  // Itens específicos para Gestão de Frotas
  const fleetManagementItems: NavItem[] = [
    { name: 'Gestão de Frotas', href: '/fleet-management', icon: Truck },
    { name: 'Histórico Consolidado', href: '/postos/historico-consolidado', icon: BarChart4 },
    { name: 'Sistema de Manutenção', href: '/fleet-management/maintenance', icon: Wrench },
    { name: 'Sol. Manutenção', href: '/manutencao', icon: FileText },
    { name: 'Trat. Manutenção', href: '/tratativa-manutencao', icon: Wrench },
    { name: 'Oficinas Credenciadas', href: '/fleet-management/workshops', icon: ClipboardList },
    { name: 'Gestão de Estoque', href: '/fleet-management/inventory', icon: Package },
    { name: 'Parceiros de Guincho', href: '#', icon: Truck, subItems: [
      { name: 'Parceiros', href: '/fleet-management/towing-partners', icon: Truck },
      { name: 'Solicitações', href: '/fleet-management/towing-partners/requests', icon: FileText },
      { name: 'Pagamentos', href: '/fleet-management/towing-partners-payments', icon: CreditCard }
    ] },
    // Menu de Abastecimentos com submenu
    { name: 'Abastecimentos', href: '#', icon: Fuel, subItems: [
      { name: 'Posto Osasco V2', href: '/posto/osasco_v2', icon: Fuel },
      { name: 'Posto Alair V2', href: '/posto/alair_v2', icon: Fuel },
      { name: 'Posto Campinas V2', href: '/posto/campinas_v2', icon: Fuel },
      { name: 'Posto ABC V2', href: '/posto/abc_v2', icon: Fuel },
      { name: 'Posto Socorro V2', href: '/posto/socorro_v2', icon: Fuel },
      { name: 'Posto Sorocaba V2', href: '/posto/sorocaba_v2', icon: Fuel },
      { name: 'Histórico Geral', href: '/refueling', icon: ClipboardList },
      { name: 'Histórico Pátio', href: '/abastecimentos', icon: Gauge },
      { name: 'Visão Geral dos Postos', href: '/postos/visao-geral', icon: BarChart4 },
      { name: 'Histórico Consolidado', href: '/postos/historico-consolidado', icon: BarChart4 }
    ]},
    // Corrigido para usar o mesmo ícone e estrutura em ambas as listas de navegação
    { name: 'Postos Externos', href: '#', icon: Droplets, subItems: [
      { name: 'Posto Remédios', href: '/posto-remedios', icon: Fuel }
    ]},
    // Item de menu separado para Cartão de Abastecimento
    { name: 'Cartão', href: '#', icon: CreditCard, subItems: [
      { name: 'Operações', href: '/fuel-card', icon: CreditCard },
      { name: 'Painel de Solicitações', href: '/fuel-card-requests', icon: ClipboardList }
    ]},
    { name: 'Line Hall', href: '/line-hall-shopee', icon: Map },
    { name: 'Parceiros de Guincho', href: '#', icon: Truck, subItems: [
      { name: 'Parceiros', href: '/fleet-management/towing-partners', icon: Truck },
      { name: 'Solicitações', href: '/fleet-management/towing-partners/requests', icon: FileText },
      { name: 'Pagamentos', href: '/fleet-management/towing-partners-payments', icon: CreditCard }
    ] },
    { name: 'Análise da Operação', href: '/fleet-management/operational-analysis', icon: BarChart4 },
    { name: 'Visão Geral da Frota', href: '/fleet-management/fleet-overview', icon: Activity },
    { name: 'Veículos Parados', href: '/fleet-management/downtime-analysis', icon: ChevronsDown },
    { name: 'Segurança do Trabalho', href: '/work-safety', icon: ShieldAlert },
    // Submenu para Bases com opções específicas para Campinas
    { name: 'Bases', href: '#', icon: Warehouse, subItems: baseItems },
  ];
  
  // Verifique se o usuário é da gestão de frotas
  // Adicionamos verificação adicional para papel 'gestor_frota'
  const isFleetUser = user.basename === "Gestão de Frotas" || user.baseId === 12 || user.role === 'gestor_frota' || user.role === 'admin';
  
  // Para debugging - exiba o tipo de usuário e os menus disponíveis
  console.log(`Tipo de usuário: ${isFleetUser ? 'Gestão de Frotas' : 'Normal'} (${user.role})`);
  console.log(`Menu principal: ${isFleetUser ? 'fleetManagementItems' : 'allNavItems'}`);
  
  // Selecionando os itens de navegação apropriados
  const navItemsBase = isFleetUser ? fleetManagementItems : allNavItems;
  
  // Adicionamos explicitamente o item de Histórico Consolidado em ambos os menus para garantir que seja visível
  // Ele foi adicionado em ambos os conjuntos de itens, mas vamos garantir
  console.log(`Verificando se Histórico Consolidado está nos menus:`);
  console.log(`- allNavItems: ${allNavItems.some(item => item.name === 'Histórico Consolidado' || item.href === '/postos/historico-consolidado')}`);
  console.log(`- fleetManagementItems: ${fleetManagementItems.some(item => item.name === 'Histórico Consolidado' || item.href === '/postos/historico-consolidado')}`);
  console.log(`- navItemsBase: ${navItemsBase.some(item => item.name === 'Histórico Consolidado' || item.href === '/postos/historico-consolidado')}`);
  
  // Garantimos que o item de Histórico Consolidado está presente, independente do menu selecionado
  const historicoItem = { name: 'Histórico Consolidado', href: '/postos/historico-consolidado', icon: BarChart4 };
  if (!navItemsBase.some(item => item.href === '/postos/historico-consolidado')) {
    console.log('Adicionando item de Histórico Consolidado que estava faltando');
    navItemsBase.push(historicoItem);
  }
  
  // Filtrando itens de navegação com base nas permissões do usuário
  const navItems = navItemsBase.filter(item => {
    // Sempre incluir menus específicos para todos os usuários independente de permissões
    if (item.name === 'Cartão' || item.name === 'Histórico Consolidado' || item.name === 'Parceiros de Guincho') {
      console.log(`Menu "${item.name}" incluído independente de permissões`);
      return true;
    }
    
    // Sempre incluir o menu Bases para todos (especialmente para admin)
    if (item.name === 'Bases') {
      console.log(`Menu Bases incluído independente de permissões`);
      console.log(`Subitens de Bases: ${JSON.stringify(item.subItems?.map(si => si.name))}`);
      return true;
    }
    
    // Sempre incluir menus com submenus (href='#')
    if (item.href === '#') {
      // Verificar se pelo menos um submenu é permitido
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