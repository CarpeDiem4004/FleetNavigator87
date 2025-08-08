import React, { useState, useEffect } from 'react';
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

interface BaseInfo {
  id: number;
  name: string;
  location?: string;
  basename?: string;
  operation: string;
}

interface BaseDashboardProps {
  baseInfo: BaseInfo;
}

const BaseDashboardGenerico: React.FC<BaseDashboardProps> = ({ baseInfo }) => {
  const { logout, user } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedItem, setSelectedItem] = useState<string>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['operational']);

  // Gerar código único da base para rotas
  const baseCode = baseInfo.basename || `base${baseInfo.id}`;

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
          route: `/bases/${baseCode}/sinistros`,
          category: 'operational'
        },
        {
          id: 'acidentes',
          title: 'Acidentes de Trabalho',
          icon: <HardHat className="w-5 h-5" />,
          description: 'Registre acidentes de trabalho com colaboradores',
          route: `/bases/${baseCode}/acidentes-trabalho`,
          category: 'operational'
        },
        {
          id: 'multas',
          title: 'Gestão de Multas',
          icon: <FileWarning className="w-5 h-5" />,
          description: 'Acompanhe multas e infrações de trânsito',
          route: `/bases/${baseCode}/multas`,
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
          route: `/bases/${baseCode}/manutencao-frota`,
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
          route: `/bases/${baseCode}/despesas`,
          category: 'financial'
        },
        {
          id: 'cartao-combustivel',
          title: 'Cartão Combustível',
          icon: <CreditCard className="w-5 h-5" />,
          description: 'Solicite recarga de cartão de combustível',
          route: `/bases/${baseCode}/cartao-combustivel`,
          category: 'financial'
        },
        {
          id: 'orcamentos',
          title: 'Solicitação de Orçamentos',
          icon: <FileText className="w-5 h-5" />,
          description: 'Solicite orçamentos para produtos',
          route: `/bases/${baseCode}/orcamentos`,
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
          description: 'Solicite pneus para veículos da frota',
          route: `/bases/${baseCode}/pneus`,
          category: 'management'
        },
        {
          id: 'cartoes-ativos',
          title: 'Cartões Ativos (Admin)',
          icon: <CreditCard className="w-5 h-5" />,
          description: 'Visualize cartões de combustível ativos',
          route: `/bases/${baseCode}/cartoes-ativos`,
          category: 'management'
        }
      ]
    }
  ];

  const handleLogout = async () => {
    await logout();
    setLocation(`/bases/${baseCode}/login`);
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

  const renderDashboard = () => (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Bem-vindo à Base {baseInfo.name}
        </h1>
        <p className="text-gray-600">
          {baseInfo.operation} | {baseInfo.location || 'Localização não informada'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {menuCategories.map(category => (
          <Card key={category.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {category.icon}
                {category.title}
              </CardTitle>
              <CardDescription>
                Módulos disponíveis para {category.title.toLowerCase()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {category.items.map(item => (
                  <button
                    key={item.id}
                    onClick={() => handleItemClick(item)}
                    className="w-full text-left p-3 rounded-lg border hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      {item.icon}
                      <span className="font-medium">{item.title}</span>
                    </div>
                    <p className="text-sm text-gray-600">{item.description}</p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Status Operacional</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Todos os sistemas operacionais</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Usuário Ativo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-gray-600" />
              <span className="text-sm text-gray-600">{user?.name || 'Usuário'}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderContent = () => {
    if (selectedItem === 'dashboard') {
      return renderDashboard();
    }

    const allItems = menuCategories.flatMap(cat => cat.items);
    const currentItem = allItems.find(item => item.id === selectedItem);

    if (currentItem) {
      return (
        <div className="p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {currentItem.title}
            </h1>
            <p className="text-gray-600">{currentItem.description}</p>
          </div>
          
          <Card>
            <CardContent className="p-6">
              <div className="text-center py-12">
                <div className="mb-4">
                  {currentItem.icon}
                </div>
                <h3 className="text-lg font-medium mb-2">
                  Módulo {currentItem.title}
                </h3>
                <p className="text-gray-600 mb-4">
                  Esta funcionalidade está em desenvolvimento para a base {baseInfo.name}.
                </p>
                <Button
                  variant="outline"
                  onClick={() => setSelectedItem('dashboard')}
                >
                  Voltar ao Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return renderDashboard();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:inset-0`}>
        <div className="flex items-center justify-between h-16 px-4 bg-blue-600 text-white">
          <div>
            <h1 className="text-lg font-bold">{baseInfo.name}</h1>
            <p className="text-xs text-blue-100">{baseInfo.operation}</p>
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
                      <div className="w-5 h-5 mr-3 flex items-center justify-center">
                        {item.icon}
                      </div>
                      {item.title}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        <div className="absolute bottom-4 left-4 right-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleLogout}
            className="w-full justify-start"
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
              <h1 className="text-lg font-bold text-gray-900">{baseInfo.name}</h1>
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

export default BaseDashboardGenerico;