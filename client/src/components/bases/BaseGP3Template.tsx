import React, { useState } from 'react';
import { Link } from 'wouter';
import { 
  Card, CardContent, CardDescription, CardHeader, CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  AlertTriangle, 
  HardHat, 
  FileWarning,
  Car,
  DollarSign,
  Wrench,
  Settings,
  CreditCard,
  CircleDot,
  FileText,
  Menu,
  X,
  ChevronDown,
  ChevronRight,
  User,
  LogOut,
  Home
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useLocation } from 'wouter';

interface MenuItem {
  id: string;
  title: string;
  icon: React.ReactNode;
  description?: string;
  route?: string;
  category: string;
}

interface MenuCategory {
  id: string;
  title: string;
  icon: React.ReactNode;
  items: MenuItem[];
}

interface BaseGP3TemplateProps {
  baseName: string;
  baseCode: string;
  baseLocation: string;
  baseSlug: string;
  baseId?: number;
  primaryColor?: string;
  portalTrabalho?: string;
  workspaceId?: string;
}

const BaseGP3Template: React.FC<BaseGP3TemplateProps> = ({ 
  baseName, 
  baseCode, 
  baseLocation, 
  baseSlug,
  baseId,
  primaryColor = "#1d4ed8",
  portalTrabalho,
  workspaceId
}) => {
  const { logout, user } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedItem, setSelectedItem] = useState<string>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['operational']);

  const menuCategories: MenuCategory[] = [
    {
      id: 'operational',
      title: 'Operacional',
      icon: <Wrench className="w-5 h-5" />,
      items: [
        {
          id: 'sinistros',
          title: 'Sinistros e Roubos',
          icon: <AlertTriangle className="w-5 h-5" />,
          description: 'Registre ocorrências de sinistros e roubos de veículos',
          route: `/bases/${baseSlug}/sinistros`,
          category: 'operational'
        },
        {
          id: 'acidentes',
          title: 'Acidentes de Trabalho',
          icon: <HardHat className="w-5 h-5" />,
          description: 'Registre acidentes de trabalho com colaboradores',
          route: `/bases/${baseSlug}/acidentes-trabalho`,
          category: 'operational'
        },
        {
          id: 'multas',
          title: 'Gestão de Multas',
          icon: <FileWarning className="w-5 h-5" />,
          description: 'Acompanhe multas e infrações de trânsito',
          route: `/bases/${baseSlug}/multas`,
          category: 'operational'
        },
        {
          id: 'veiculos',
          title: 'Cadastro de Veículos',
          icon: <Car className="w-5 h-5" />,
          description: 'Gerencie frota de veículos da base',
          route: '/vehicles',
          category: 'operational'
        },
        {
          id: 'manutencao',
          title: 'Manutenção de Frota',
          icon: <Wrench className="w-5 h-5" />,
          description: 'Registre solicitações de manutenção para veículos',
          route: `/bases/${baseSlug}/manutencao-frota`,
          category: 'operational'
        }
      ]
    },
    {
      id: 'financial',
      title: 'Financeiro',
      icon: <DollarSign className="w-5 h-5" />,
      items: [
        {
          id: 'despesas',
          title: 'Despesas Mensais',
          icon: <DollarSign className="w-5 h-5" />,
          description: 'Registre despesas mensais como: Água, Energia, Telefone',
          route: `/bases/${baseSlug}/despesas`,
          category: 'financial'
        },
        {
          id: 'cartao-combustivel',
          title: 'Cartão Combustível',
          icon: <CreditCard className="w-5 h-5" />,
          description: 'Solicite recarga de cartão de combustível',
          route: `/bases/${baseSlug}/cartao-combustivel`,
          category: 'financial'
        },
        {
          id: 'orcamentos',
          title: 'Solicitação de Orçamentos',
          icon: <FileText className="w-5 h-5" />,
          description: 'Solicite orçamentos para produtos',
          route: `/bases/${baseSlug}/solicitacao-orcamento`,
          category: 'financial'
        }
      ]
    },
    {
      id: 'management',
      title: 'Gestão',
      icon: <Settings className="w-5 h-5" />,
      items: [
        {
          id: 'pneus',
          title: 'Solicitação de Pneus',
          icon: <CircleDot className="w-5 h-5" />,
          description: 'Faça solicitações de pneus para frota',
          route: `/bases/${baseSlug}/solicitacao-pneus`,
          category: 'management'
        },
        {
          id: 'cartoes-ativos',
          title: 'Cartões Ativos (Admin)',
          icon: <CreditCard className="w-5 h-5" />,
          description: 'Gerencie cartões de combustível ativos',
          route: `/bases/${baseSlug}/cartoes-ativos`,
          category: 'management'
        }
      ]
    }
  ];

  const handleLogout = async () => {
    await logout();
    setLocation(`/bases/${baseSlug}/login`);
  };

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => 
      prev.includes(categoryId) 
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleItemClick = (item: MenuItem) => {
    setSelectedItem(item.id);
    setIsSidebarOpen(false);
    if (item.route) {
      setLocation(item.route);
    }
  };

  const renderContent = () => {
    const selectedMenuItem = menuCategories
      .flatMap(cat => cat.items)
      .find(item => item.id === selectedItem);

    if (selectedItem === 'dashboard') {
      return (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-lg">
            <h2 className="text-2xl font-bold mb-2">Bem-vindo à {baseName}</h2>
            <p className="text-blue-100">{baseLocation} - {baseCode}</p>
            {portalTrabalho && (
              <p className="text-blue-100 text-sm mt-1">Portal: {portalTrabalho}</p>
            )}
            {workspaceId && (
              <p className="text-blue-100 text-sm">Workspace: {workspaceId}</p>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="font-semibold text-gray-800 mb-2">Status Operacional</h3>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                <span className="text-sm text-gray-600">Sistema Online</span>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="font-semibold text-gray-800 mb-2">Usuário Ativo</h3>
              <p className="text-sm text-gray-600">{user?.name || 'Operador'}</p>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="font-semibold text-gray-800 mb-2">Base</h3>
              <p className="text-sm text-gray-600">{baseName}</p>
            </div>
          </div>
        </div>
      );
    }

    if (selectedMenuItem) {
      // Formulário específico para Cartão Combustível
      if (selectedMenuItem.id === 'cartao-combustivel') {
        return (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center mb-4">
                {selectedMenuItem.icon}
                <h2 className="text-2xl font-bold ml-3">{selectedMenuItem.title}</h2>
              </div>
              <p className="text-gray-600 mb-6">{selectedMenuItem.description}</p>
              
              {/* Formulário de Cartão Combustível */}
              <form className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nome</label>
                    <input 
                      type="text"
                      defaultValue={user?.name || 'Nome do Operador'}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Nome do solicitante (preenchido automaticamente)"
                      readOnly
                    />
                    <p className="text-xs text-gray-500 mt-1">Nome do solicitante (preenchido automaticamente)</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Telefone</label>
                    <input 
                      type="tel"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="11999999999"
                    />
                    <p className="text-xs text-gray-500 mt-1">Para receber notificação quando aprovado</p>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Horário de Abastecimento</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                    <option value="">Selecione o horário</option>
                    <option value="antes-17h">Antes das 17h</option>
                    <option value="apos-18h">Após as 18h</option>
                  </select>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Projeto</label>
                    <input 
                      type="text"
                      value="MERCADO LIVRE"
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-gray-600"
                      readOnly
                    />
                    <p className="text-xs text-gray-500 mt-1">Projeto associado à operação</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Base</label>
                    <input 
                      type="text"
                      value={baseName}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-gray-600"
                      readOnly
                    />
                    <p className="text-xs text-gray-500 mt-1">Base operacional</p>
                  </div>
                </div>
                
                <div className="border-t pt-4">
                  <Button 
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                    style={{ backgroundColor: primaryColor }}
                  >
                    Solicitar Cartão Combustível
                  </Button>
                </div>
              </form>
            </div>
          </div>
        );
      }
      
      // Conteúdo padrão para outros itens
      return (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center mb-4">
              {selectedMenuItem.icon}
              <h2 className="text-2xl font-bold ml-3">{selectedMenuItem.title}</h2>
            </div>
            <p className="text-gray-600 mb-4">{selectedMenuItem.description}</p>
            
            <div className="border-t pt-4">
              <p className="text-sm text-gray-500 mb-4">
                Clique no botão abaixo para acessar a funcionalidade:
              </p>
              <Button 
                onClick={() => selectedMenuItem.route && setLocation(selectedMenuItem.route)}
                className="bg-blue-600 hover:bg-blue-700"
                style={{ backgroundColor: primaryColor }}
              >
                Acessar {selectedMenuItem.title}
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return <div>Selecione um item do menu</div>;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:inset-0`}>
        <div className="flex items-center justify-between h-16 px-4 text-white" style={{ backgroundColor: primaryColor }}>
          <div>
            <h1 className="text-lg font-bold">{baseName}</h1>
            <p className="text-xs opacity-80">{baseCode}</p>
          </div>
          <button 
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <nav className="mt-6 px-4">
          {/* Dashboard */}
          <button
            onClick={() => setSelectedItem('dashboard')}
            className={`w-full flex items-center px-3 py-2 rounded-lg mb-2 transition-colors ${
              selectedItem === 'dashboard' 
                ? 'bg-blue-100 text-blue-700' 
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Home className="w-5 h-5 mr-3" />
            Dashboard
          </button>

          {/* Categories */}
          {menuCategories.map(category => (
            <div key={category.id} className="mb-4">
              <button
                onClick={() => toggleCategory(category.id)}
                className="w-full flex items-center justify-between px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                <div className="flex items-center">
                  {category.icon}
                  <span className="ml-3 font-medium">{category.title}</span>
                </div>
                {expandedCategories.includes(category.id) ? 
                  <ChevronDown className="w-4 h-4" /> : 
                  <ChevronRight className="w-4 h-4" />
                }
              </button>
              
              {expandedCategories.includes(category.id) && (
                <div className="mt-2 ml-4 space-y-1">
                  {category.items.map(item => (
                    <button
                      key={item.id}
                      onClick={() => handleItemClick(item)}
                      className={`w-full flex items-center px-3 py-2 rounded-lg text-sm transition-colors ${
                        selectedItem === item.id 
                          ? 'bg-blue-100 text-blue-700' 
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {item.icon}
                      <span className="ml-3">{item.title}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* User Info & Logout */}
        <div className="absolute bottom-0 w-full p-4 border-t bg-gray-50">
          <div className="flex items-center mb-3">
            <User className="w-8 h-8 text-gray-400 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-900">{user?.name || 'Operador'}</p>
              <p className="text-xs text-gray-500">{user?.email || baseName}</p>
            </div>
          </div>
          <Button 
            onClick={handleLogout}
            variant="outline" 
            className="w-full text-red-600 hover:text-red-800 hover:bg-red-50"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sair
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 lg:ml-0">
        {/* Mobile Header */}
        <div className="lg:hidden bg-white shadow-sm border-b">
          <div className="flex items-center justify-between h-16 px-4">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="text-gray-600"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="text-center">
              <h1 className="text-lg font-bold text-gray-900">{baseName}</h1>
            </div>
            <div className="w-6"></div>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-6">
          {renderContent()}
        </div>
      </div>

      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Footer */}
      <div className="fixed bottom-0 right-0 left-0 lg:left-64 bg-white border-t p-2">
        <p className="text-xs text-center text-gray-500">
          Desenvolvido por Carpe Diem 4004 | suporte 11 970558053
        </p>
      </div>
    </div>
  );
};

export default BaseGP3Template;