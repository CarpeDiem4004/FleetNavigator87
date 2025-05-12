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
  Droplets,
  Hammer, // Ícone para Oficina Murici
  Building, // Ícone alternativo para Oficina
  Link2, // Ícone para acesso direto
  ExternalLinkIcon, // Ícone para links externos
  Settings // Ícone para configurações
} from 'lucide-react';

// Define a interface para os itens do menu
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

// Componente simplificado para itens de navegação
const NavItem: React.FC<{
  item: NavItem;
  isActive: boolean;
  onClose: () => void;
}> = ({ item, isActive, onClose }) => {
  const Icon = item.icon;
  
  return (
    <Link
      href={item.href}
      onClick={(e) => {
        // Se for um submenu, não navegamos
        if (item.href === '#') {
          e.preventDefault();
          return;
        }
        
        e.preventDefault();
        window.history.pushState(null, "", item.href);
        window.dispatchEvent(new PopStateEvent("popstate"));
        onClose();
      }}
      className={`flex items-center px-4 py-2 rounded-md group transition-all duration-200 ${
        isActive
          ? 'text-white bg-primary-600 shadow-md shadow-primary/30 border-l-2 border-white font-medium' 
          : 'text-slate-100 hover:bg-primary/20 hover:text-white hover:shadow-sm'
      } ${item.className || ''}`}
    >
      <Icon className="flex-shrink-0 mr-3 h-5 w-5" />
      <span>{item.name}</span>
    </Link>
  );
};

// Componente para itens com submenu
const NavItemWithSubmenu: React.FC<{
  item: NavItem;
  isActive: boolean;
  isSubItemActive: boolean;
  onClose: () => void;
  currentLocation: string;
}> = ({ item, isActive, isSubItemActive, onClose, currentLocation }) => {
  // Expandir "Postos Externos" por padrão
  const initialExpanded = item.name === 'Postos Externos' ? true : (isActive || isSubItemActive);
  const [expanded, setExpanded] = useState(initialExpanded);
  
  // Garantir que o submenu seja expandido quando um subitem estiver ativo
  useEffect(() => {
    if (isSubItemActive && !expanded) {
      setExpanded(true);
    }
  }, [isSubItemActive, expanded]);
  
  const Icon = item.icon;

  const toggleExpanded = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setExpanded(!expanded);
  };

  // Renderização dos subitens
  const renderSubItems = () => {
    // Log para debug - identificar problemas de menu
    console.log("Renderizando subitens para", item.name, "- Expandido:", expanded, "- Subitens:", item.subItems);
    
    if (!expanded || !item.subItems) return null;
    
    return (
      <div className="ml-8 mt-1 space-y-1">
        {item.subItems.map(subItem => {
          const SubIcon = subItem.icon;
          const isSubActive = currentLocation === subItem.href;
          
          // Log de debug individual para cada subitem
          console.log("  Subitem:", subItem.name, "- Href:", subItem.href);
          
          return (
            <div key={subItem.name}>
              <Link 
                href={subItem.href}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  window.history.pushState(null, "", subItem.href);
                  window.dispatchEvent(new PopStateEvent("popstate"));
                  onClose();
                }}
                className={`flex items-center px-4 py-2 rounded-md group transition-all duration-200 cursor-pointer ${
                  isSubActive
                    ? 'text-white bg-primary-600 shadow-md shadow-primary/30 border-l-2 border-white font-medium' 
                    : 'text-slate-100 hover:bg-primary/20 hover:text-white hover:shadow-sm'
                } ${subItem.className || ''}`}
              >
                <SubIcon className="w-5" size={16} />
                <span className="ml-2">{subItem.name}</span>
              </Link>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div>
      <button
        onClick={toggleExpanded}
        className={`w-full flex items-center justify-between px-4 py-2 rounded-md group transition-all duration-200 ${
          isActive || isSubItemActive
            ? 'text-white shadow-sm shadow-primary/20 font-medium' 
            : 'text-slate-100 hover:bg-primary/20 hover:text-white hover:shadow-sm'
        } ${item.className || ''}`}
      >
        <div className="flex items-center">
          <Icon className="flex-shrink-0 mr-3 h-5 w-5" />
          <span>{item.name}</span>
        </div>
        {expanded ? (
          <ChevronDown className="w-4 h-4" />
        ) : (
          <ChevronRight className="w-4 h-4" />
        )}
      </button>
      {renderSubItems()}
    </div>
  );
};

// Componente principal da barra lateral
const SidebarSimplificado: React.FC<SidebarProps> = ({ open, setOpen }) => {
  const location = useLocation()[0];
  const { user, logout } = useAuth();
  const { hasPermission } = useBasePermission();
  
  // Função para fechar o menu em dispositivos móveis
  const closeSidebar = () => {
    setOpen(false);
  };
  
  // Lista simplificada de itens de navegação - apenas postos V2 e itens principais
  const navItems: NavItem[] = [
    { name: 'Dashboard', href: '/', icon: Gauge },
    { name: 'Veículos', href: '/vehicles', icon: Truck },
    { name: 'Motoristas', href: '/drivers', icon: Users },
    { name: 'Manutenção', href: '/manutencao', icon: Wrench },
    
    // Menu de Pneus com submenu
    {
      name: 'Pneus', 
      href: '#', 
      icon: CircleDot,
      subItems: [
        { name: 'Gestão de Pneus', href: '/tires', icon: CircleDot },
        { name: 'Entrada de Pneus', href: '/tires/entrada', icon: CircleDot },
        { name: 'Solicitações', href: '/tires/solicitacoes', icon: CircleDot },
        { name: 'Gestão Resiliente', href: '/tires/resiliente', icon: Database, className: 'text-green-400 hover:text-green-300' }
      ]
    },
    
    { name: 'Abastecimento', href: '/refueling', icon: Fuel },
    
    // Nova seção para Postos
    {
      name: 'Postos de Abastecimento', 
      href: '#', 
      icon: Fuel,
      subItems: [
        { name: 'Acesso Direto', href: '/acesso-posto', icon: Link2, className: 'bg-green-800/20 text-green-400 hover:bg-green-800/30 hover:text-green-300' },
        { name: 'Links Externos', href: '/postos/links-externos', icon: ExternalLinkIcon, className: 'bg-amber-700/20 text-amber-400 hover:bg-amber-700/30 hover:text-amber-300' },
        { name: 'Visão Geral', href: '/postos/visao-geral', icon: Gauge },
        { name: 'Posto Osasco V2', href: '/posto/osasco_v2', icon: Fuel },
        { name: 'Posto Alair V2', href: '/posto/alair_v2', icon: Fuel },
        { name: 'Posto Campinas V2', href: '/posto/campinas_v2', icon: Fuel },
        { name: 'Posto ABC V2', href: '/posto/abc_v2', icon: Fuel },
        { name: 'Posto Socorro V2', href: '/posto/socorro_v2', icon: Fuel },
        { name: 'Posto Sorocaba V2', href: '/posto/sorocaba_v2', icon: Fuel }
      ]
    },
    
    { name: 'Posto Remédios', href: '/posto-remedios', icon: Fuel },
    
    // Item de menu para Cartão de Abastecimento - sempre visível
    { name: 'Cartão', href: '/fuel-card', icon: CreditCard },
    { name: 'Multas', href: '/fines', icon: AlertTriangle },
    
    // Submenu para Bases com opções específicas para Base Campinas
    {
      name: 'Bases',
      href: '#',
      icon: Warehouse,
      subItems: [
        { name: 'Todas as Bases', href: '/bases', icon: Warehouse },
        { name: 'Base Campinas', href: '/bases/campinas', icon: Warehouse },
        { name: 'Despesas Campinas', href: '/bases/campinas/despesas', icon: CreditCard },
        { name: 'Solicitação de Pneus', href: '/bases/campinas/solicitacao-pneus', icon: CircleDot },
        { name: 'Solicitação de Orçamento', href: '/bases/campinas/solicitacao-orcamento', icon: FileText },
        { name: 'Manutenção de Frota', href: '/bases/campinas/manutencao-frota', icon: Wrench }
      ]
    },
    
    { name: 'Usuários', href: '/users', icon: Users },
    
    // Adicionando acesso rápido na lista principal também para maior visibilidade
    { 
      name: 'Acesso Direto a Postos', 
      href: '/acesso-posto', 
      icon: Link2, 
      className: 'bg-green-800/20 text-green-400 hover:bg-green-800/30 hover:text-green-300 mt-4 font-medium' 
    },
  ];

  return (
    <div
      className={`${
        open ? 'block' : 'hidden'
      } md:flex md:flex-shrink-0 transition-all duration-300 fixed md:relative inset-0 z-40 md:z-auto`}
    >
      <div className="flex flex-col w-64 bg-gradient-to-br from-gray-900 to-gray-800 text-white shadow-xl shadow-primary/20 border-r border-primary/10">
        {/* Logo */}
        <div className="flex items-center justify-center h-16 border-b border-gray-700">
          <div className="flex items-center py-3 px-2">
            <img 
              src="/assets/murici-logo-new.png" 
              alt="Murici Logística" 
              className="h-6" 
            />
          </div>
        </div>

        {/* Navegação */}
        <div className="overflow-y-auto">
          <nav className="flex-1 py-4">
            <div className="space-y-1 px-2">
              {/* Renderizando itens de menu */}
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

        {/* Perfil do usuário */}
        <div className="border-t border-gray-700 p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-9 w-9 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm font-medium">
                {user?.name?.charAt(0) || user?.email?.charAt(0) || 'U'}
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-white">{user?.name || user?.email || 'Usuário'}</p>
              <p className="text-xs text-gray-400">{user?.email || ''}</p>
            </div>
            <button
              onClick={logout}
              className="ml-auto text-gray-400 hover:text-primary transition-colors"
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

export default SidebarSimplificado;