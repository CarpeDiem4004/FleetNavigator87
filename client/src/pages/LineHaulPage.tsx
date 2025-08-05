import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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
  Users,
  CreditCard
} from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';

const LineHaulPage = () => {
  const [searchTerm, setSearchTerm] = React.useState('');

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleCardAction = (action: string) => {
    console.log(`Ação executada: ${action}`);
  };

  // Dados mock das viagens (baseado na imagem)
  const viagensData = [
    { 
      id: 1, 
      codigo: 'COD001', 
      condutor: 'João Silva', 
      motorista: 'Carlos Santos', 
      objetoOrigem: 'São Paulo - SP', 
      pontoChegada: 'Rio de Janeiro - RJ', 
      status: 'Em Andamento' 
    }
  ];

  return (
    <AppLayout>
      <div className="p-6 bg-gray-50 min-h-screen">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Bom dia, Administrador!</h1>
            <p className="text-gray-600">Bem-vindo ao Line Haul Murici</p>
          </div>
          <Button variant="outline" className="text-gray-600 border-gray-300 hover:bg-gray-100">
            <LogOut className="h-4 w-4 mr-2" />
            Sair
          </Button>
        </div>

        {/* Painel de Controle */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Painel de Controle</h2>
          <p className="text-gray-600 mb-4">Gerenciamento de viagens de Line Haul</p>
          
          {/* Botões de ação */}
          <div className="flex flex-wrap gap-3 mb-6">
            <Button className="bg-blue-500 hover:bg-blue-600 text-white">
              <Car className="h-4 w-4 mr-2" />
              Cadastrar Veículo
            </Button>
            <Button className="bg-blue-500 hover:bg-blue-600 text-white">
              <Users className="h-4 w-4 mr-2" />
              Cadastrar Motorista
            </Button>
            <Button className="bg-blue-500 hover:bg-blue-600 text-white">
              <CreditCard className="h-4 w-4 mr-2" />
              Solicitações de Cartão
            </Button>
            <Button className="bg-blue-500 hover:bg-blue-600 text-white">
              <Eye className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
            <Button className="bg-blue-500 hover:bg-blue-600 text-white">
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </Button>
            <Button className="bg-green-500 hover:bg-green-600 text-white">
              <Plus className="h-4 w-4 mr-2" />
              Nova Viagem
            </Button>
          </div>

          {/* Barra de busca */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input 
              placeholder="Buscar por placa, motorista ou local..." 
              className="pl-10 bg-white border-gray-300"
              value={searchTerm}
              onChange={handleSearch}
            />
          </div>
        </div>

        {/* Cards de métricas - Row 1 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {/* Checklists de Motoristas */}
          <Card className="bg-white border-gray-200 shadow-sm">
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
                <Button size="sm" className="flex-1 bg-blue-500 hover:bg-blue-600 text-white">
                  <Eye className="h-4 w-4 mr-1" />
                  Atualizar
                </Button>
                <Button size="sm" variant="outline" className="flex-1 border-gray-300">
                  <Settings className="h-4 w-4 mr-1" />
                  Gerenciar
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Solicitações de Manutenção */}
          <Card className="bg-white border-gray-200 shadow-sm">
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
              <div className="text-sm text-gray-600 mb-4">Total de solicitações: 3</div>
              <div className="flex gap-2">
                <Button size="sm" className="flex-1 bg-blue-500 hover:bg-blue-600 text-white">
                  <Eye className="h-4 w-4 mr-1" />
                  Atualizar
                </Button>
                <Button size="sm" variant="outline" className="flex-1 border-gray-300">
                  <Settings className="h-4 w-4 mr-1" />
                  Gerenciar
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Veículos na Garagem */}
          <Card className="bg-white border-gray-200 shadow-sm">
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
                <Button size="sm" className="flex-1 bg-blue-500 hover:bg-blue-600 text-white">
                  <Eye className="h-4 w-4 mr-1" />
                  Atualizar
                </Button>
                <Button size="sm" variant="outline" className="flex-1 border-gray-300">
                  <Eye className="h-4 w-4 mr-1" />
                  Ver Veículos Parados
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Card vazio (4º slot) */}
          <Card className="bg-white border-gray-200 shadow-sm">
            <CardContent className="p-6">
              <div className="text-center py-4">
                <div className="text-gray-400 mb-2">Card disponível para</div>
                <div className="text-sm text-gray-600">funcionalidade futura</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Cards Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Rotas Cadastradas */}
          <Card className="bg-white border-gray-200 shadow-sm">
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
                <Button className="flex-1 bg-blue-500 hover:bg-blue-600 text-white">
                  <Eye className="h-4 w-4 mr-2" />
                  Ver Rotas
                </Button>
                <Button className="flex-1 bg-green-500 hover:bg-green-600 text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Rota
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Acesso para Motoristas */}
          <Card className="bg-white border-gray-200 shadow-sm">
            <CardHeader>
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
              <Button className="w-full bg-purple-500 hover:bg-purple-600 text-white">
                Acessar Interface do Motorista
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Seção Cards inferiores */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Solicitação de Cartão Combustível */}
          <Card className="bg-white border-gray-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg flex items-center text-green-700">
                <CreditCard className="h-5 w-5 mr-2" />
                Solicitação de Cartão Combustível
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">
                  Gerencie solicitações de cartão combustível com eficiência
                </p>
                <Button className="bg-green-500 hover:bg-green-600 text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Solicitação
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Card vazio para futuras funcionalidades */}
          <Card className="bg-white border-gray-200 shadow-sm">
            <CardContent className="p-6">
              <div className="text-center py-16">
                <div className="text-gray-400 mb-2">Espaço disponível para</div>
                <div className="text-sm text-gray-600">funcionalidade futura</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabela Viagens Line Haul Murici */}
        <Card className="bg-white border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center text-blue-700">
              <Truck className="h-5 w-5 mr-2" />
              Viagens Line Haul Murici
            </CardTitle>
            <p className="text-sm text-gray-600 mt-1">Controle detalhado de viagens</p>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Condutor</TableHead>
                  <TableHead>Motorista</TableHead>
                  <TableHead>Objeto Origem</TableHead>
                  <TableHead>Ponto Chegada</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {viagensData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      Nenhuma viagem cadastrada
                    </TableCell>
                  </TableRow>
                ) : (
                  viagensData.map((viagem) => (
                    <TableRow key={viagem.id}>
                      <TableCell className="font-medium">{viagem.codigo}</TableCell>
                      <TableCell>{viagem.condutor}</TableCell>
                      <TableCell>{viagem.motorista}</TableCell>
                      <TableCell>{viagem.objetoOrigem}</TableCell>
                      <TableCell>{viagem.pontoChegada}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                          {viagem.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" className="border-gray-300">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline" className="border-gray-300">
                            <Settings className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default LineHaulPage;