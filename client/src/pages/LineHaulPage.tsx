import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';
import { 
  Search, 
  CheckCircle, 
  Wrench, 
  Car, 
  Route, 
  Plus, 
  Eye, 
  Settings,
  LogOut,
  Truck,
  MapPin,
  Calendar,
  Users
} from 'lucide-react';
import lineHaulLayoutImage from '@assets/Layout Line haul  (1908 x 1126 px)_1754396606629.png';

const LineHaulPage = () => {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleCardAction = (action: string) => {
    console.log(`Ação executada: ${action}`);
    
    // Mapear ações para rotas e mensagens baseadas nas rotas reais do sistema
    const actionRoutes: { [key: string]: { route: string; title: string; description: string } } = {
      'cadastrar-veiculo': { route: '/vehicles', title: 'Cadastrar Veículo', description: 'Redirecionando para o formulário de cadastro de veículo' },
      'cadastrar-motorista': { route: '/drivers', title: 'Cadastrar Motorista', description: 'Redirecionando para o formulário de cadastro de motorista' },
      'solicitacoes-cartao': { route: '/fuel-card-requests', title: 'Solicitações de Cartão', description: 'Abrindo módulo de solicitações de cartão combustível' },
      'atualizar-dashboard': { route: '/line-haul', title: 'Atualizar Dashboard', description: 'Atualizando dados do painel Line Haul' },
      'sair-sistema': { route: '/login', title: 'Sair do Sistema', description: 'Finalizando sessão do usuário' },
      'nova-viagem': { route: '/linehall-register', title: 'Nova Viagem', description: 'Iniciando processo de cadastro de nova viagem' },
      'atualizar-checklists': { route: '/driver-checklist', title: 'Atualizar Checklists', description: 'Atualizando dados dos checklists de motoristas' },
      'gerenciar-checklists': { route: '/driver-checklist', title: 'Gerenciar Checklists', description: 'Abrindo painel de gerenciamento de checklists' },
      'atualizar-manutencao': { route: '/manutencao', title: 'Atualizar Manutenção', description: 'Atualizando dados das solicitações de manutenção' },
      'gerenciar-manutencao': { route: '/fleet-management/maintenance', title: 'Gerenciar Manutenção', description: 'Abrindo painel de gerenciamento de manutenção' },
      'atualizar-garagem': { route: '/stopped-vehicles', title: 'Atualizar Garagem', description: 'Atualizando dados dos veículos na garagem' },
      'ver-veiculos-parados': { route: '/stopped-vehicles', title: 'Ver Veículos Parados', description: 'Exibindo lista detalhada de veículos parados' },
      'acessar-interface-motoristas': { route: '/driver-access', title: 'Interface de Motoristas', description: 'Abrindo interface dedicada para motoristas' },
      'ver-rotas': { route: '/conferencia-rotas', title: 'Ver Rotas', description: 'Exibindo sistema de conferência de rotas' },
      'nova-rota': { route: '/conferencia-rotas', title: 'Nova Rota', description: 'Abrindo sistema de conferência de rotas' },
      'iniciar-operacao': { route: '/line-hall-driver', title: 'Iniciar Operação', description: 'Abrindo interface de motorista Line Haul' }
    };

    const actionData = actionRoutes[action];
    
    if (actionData) {
      toast({
        title: actionData.title,
        description: actionData.description,
      });
      
      // Navegar após um pequeno delay para mostrar a notificação
      setTimeout(() => {
        setLocation(actionData.route);
      }, 800);
    } else {
      toast({
        title: 'Ação Executada',
        description: `Função ${action} executada com sucesso`,
      });
    }
  };

  return (
    <div 
      className="min-h-screen bg-cover bg-center bg-no-repeat relative"
      style={{
        backgroundImage: `url(${lineHaulLayoutImage})`,
      }}
    >
      {/* Overlay para melhorar legibilidade */}
      <div className="absolute inset-0 bg-black/20" />
      
      {/* Conteúdo principal */}
      <div className="relative z-10 p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">Bom dia, Administrador!</h1>
            <p className="text-white/80">Bem-vindo ao Line Haul Murici</p>
          </div>
          <Button variant="outline" className="bg-white/10 text-white border-white/20 hover:bg-white/20">
            <LogOut className="h-4 w-4 mr-2" />
            Sair
          </Button>
        </div>

        {/* Painel de Controle */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-white mb-2">Painel de Controle</h2>
          <p className="text-white/80 mb-4">Gerenciamento de viagens de Line Haul</p>
          
          {/* Botões de ação */}
          <div className="flex flex-wrap gap-3 mb-6">
            <Button className="bg-blue-500 hover:bg-blue-600 text-white" onClick={() => handleCardAction('cadastrar-veiculo')}>
              <Car className="h-4 w-4 mr-2" />
              Cadastrar Veículo
            </Button>
            <Button className="bg-blue-500 hover:bg-blue-600 text-white" onClick={() => handleCardAction('cadastrar-motorista')}>
              <Users className="h-4 w-4 mr-2" />
              Cadastrar Motorista
            </Button>
            <Button className="bg-blue-500 hover:bg-blue-600 text-white" onClick={() => handleCardAction('solicitacoes-cartao')}>
              <Settings className="h-4 w-4 mr-2" />
              Solicitações de Cartão
            </Button>
            <Button className="bg-blue-500 hover:bg-blue-600 text-white" onClick={() => handleCardAction('atualizar-dashboard')}>
              <Eye className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
            <Button className="bg-blue-500 hover:bg-blue-600 text-white" onClick={() => handleCardAction('sair-sistema')}>
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </Button>
            <Button className="bg-green-500 hover:bg-green-600 text-white" onClick={() => handleCardAction('nova-viagem')}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Viagem
            </Button>
          </div>

          {/* Barra de busca */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input 
              placeholder="Buscar por placa, motorista ou local..." 
              className="pl-10 bg-blue-100/80 border-blue-200 placeholder:text-gray-600"
              value={searchTerm}
              onChange={handleSearch}
            />
          </div>
        </div>

        {/* Cards de métricas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Checklists de Motoristas */}
          <Card className="bg-white/90 backdrop-blur-sm border-blue-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center text-blue-700">
                <CheckCircle className="h-5 w-5 mr-2" />
                Checklists de Motoristas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">0</div>
                  <div className="text-sm text-gray-600">Concluídos</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">0</div>
                  <div className="text-sm text-gray-600">Pendentes</div>
                </div>
              </div>
              <div className="text-sm text-gray-600 mb-4">Total de checklists: 0</div>
              <div className="flex gap-2">
                <Button size="sm" className="flex-1 bg-blue-500 hover:bg-blue-600" onClick={() => handleCardAction('atualizar-checklists')}>
                  <Eye className="h-4 w-4 mr-1" />
                  Atualizar
                </Button>
                <Button size="sm" variant="outline" className="flex-1" onClick={() => handleCardAction('gerenciar-checklists')}>
                  <Settings className="h-4 w-4 mr-1" />
                  Gerenciar
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Solicitações de Manutenção */}
          <Card className="bg-white/90 backdrop-blur-sm border-orange-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center text-orange-700">
                <Wrench className="h-5 w-5 mr-2" />
                Solicitações de Manutenção
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">2</div>
                  <div className="text-sm text-gray-600">Pendentes</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">1</div>
                  <div className="text-sm text-gray-600">Em Andamento</div>
                </div>
              </div>
              <div className="text-sm text-gray-600 mb-4">Total de solicitações: 4</div>
              <div className="flex gap-2">
                <Button size="sm" className="flex-1 bg-blue-500 hover:bg-blue-600" onClick={() => handleCardAction('atualizar-manutencao')}>
                  <Eye className="h-4 w-4 mr-1" />
                  Atualizar
                </Button>
                <Button size="sm" variant="outline" className="flex-1" onClick={() => handleCardAction('gerenciar-manutencao')}>
                  <Settings className="h-4 w-4 mr-1" />
                  Gerenciar
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Veículos na Garagem */}
          <Card className="bg-white/90 backdrop-blur-sm border-green-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center text-green-700">
                <Car className="h-5 w-5 mr-2" />
                Veículos na Garagem
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center mb-4">
                <div className="text-3xl font-bold text-green-600">3</div>
                <div className="text-sm text-gray-600">Total de Veículos</div>
              </div>
              <div className="text-center mb-4">
                <div className="text-2xl font-bold text-blue-600">4.0</div>
                <div className="text-sm text-gray-600">Média de Dias</div>
              </div>
              <div className="text-sm text-gray-600 mb-4">Veículos Atualmente na Garagem:</div>
              <div className="space-y-1 mb-4">
                <Badge variant="outline" className="text-xs">2 dias</Badge>
                <Badge variant="outline" className="text-xs">3 dias</Badge>
                <Badge variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200">6 dias</Badge>
              </div>
              <div className="flex gap-2">
                <Button size="sm" className="flex-1 bg-blue-500 hover:bg-blue-600" onClick={() => handleCardAction('atualizar-garagem')}>
                  <Eye className="h-4 w-4 mr-1" />
                  Atualizar
                </Button>
                <Button size="sm" variant="outline" className="flex-1" onClick={() => handleCardAction('ver-veiculos-parados')}>
                  <Eye className="h-4 w-4 mr-1" />
                  Ver Veículos Parados
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Acesso para Motoristas */}
          <Card className="bg-white/90 backdrop-blur-sm border-purple-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center text-purple-700">
                <Users className="h-5 w-5 mr-2" />
                Acesso para Motoristas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Os motoristas podem acessar a interface dedicada para realizar checklists de veículos, solicitar manutenções e recargas de cartão de combustível.
              </p>
              <div className="text-sm text-blue-600 mb-4 break-all">
                URL de acesso: https://muricionfleet2.co/app/system/driver-access
              </div>
              <Button className="w-full bg-purple-500 hover:bg-purple-600 text-white" onClick={() => handleCardAction('acessar-interface-motoristas')}>
                Acessar Interface do Motorista
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Seção inferior com rotas e nova rota */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Rotas Cadastradas */}
          <Card className="bg-white/90 backdrop-blur-sm border-green-200">
            <CardHeader>
              <CardTitle className="text-lg flex items-center text-green-700">
                <Route className="h-5 w-5 mr-2" />
                Rotas Cadastradas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 mb-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Total de rotas</span>
                  <span className="text-2xl font-bold text-green-600">83</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Menor distância</span>
                  <span className="text-sm font-medium">103 km</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Maior distância</span>
                  <span className="text-sm font-medium">980 km</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Distância média</span>
                  <span className="text-sm font-medium">519 km</span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button className="flex-1 bg-blue-500 hover:bg-blue-600 text-white" onClick={() => handleCardAction('ver-rotas')}>
                  <Eye className="h-4 w-4 mr-2" />
                  Ver Rotas
                </Button>
                <Button className="flex-1 bg-green-500 hover:bg-green-600 text-white" onClick={() => handleCardAction('nova-rota')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Rota
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Card vazio para futuras funcionalidades */}
          <Card className="bg-white/90 backdrop-blur-sm border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg flex items-center text-gray-700">
                <Truck className="h-5 w-5 mr-2" />
                Operações Line Haul
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Truck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">
                  Gerencie suas operações de Line Haul com eficiência
                </p>
                <Button className="bg-blue-500 hover:bg-blue-600 text-white" onClick={() => handleCardAction('iniciar-operacao')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Iniciar Operação
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default LineHaulPage;