import React from 'react';
import { useLocation, Link } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/AuthContext';
import { MapPin, AlertTriangle, Fuel, Car, FileText, Users, TrendingUp, CreditCard, Wrench, Building, LogOut } from 'lucide-react';

export default function BaseGP03External() {
  const [, setLocation] = useLocation();
  const { logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      setLocation('/bases/gp03/login');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header with Navigation */}
        <div className="flex justify-between items-center mb-8">
          <div className="text-center flex-1">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Base GP03 - Hortolandia
            </h1>
            <p className="text-lg text-gray-600">
              Gerenciamento completo da Base GP03
            </p>
            <Badge variant="secondary" className="mt-2">
              <MapPin className="w-4 h-4 mr-1" />
              Hortolandia, SP
            </Badge>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleLogout}
              className="flex items-center gap-2 text-red-600 hover:text-red-700"
            >
              <LogOut className="w-4 h-4" />
              Sair
            </Button>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid md:grid-cols-3 gap-6 max-w-7xl mx-auto">
          
          {/* Sinistros e Roubos */}
          <Card className="shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="bg-red-50 border-b border-red-200">
              <CardTitle className="flex items-center text-red-700">
                <AlertTriangle className="w-5 h-5 mr-2" />
                Sinistros e Roubos
              </CardTitle>
              <CardDescription>
                Registro de ocorrências com veículos
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4">
              <p className="text-sm text-gray-600 mb-4">
                Comunique sinistros, roubos e outros incidentes envolvendo veículos da frota. Registre os detalhes da ocorrência, local, horário e danos.
              </p>
              <Link href="/admin/sinistros">
                <Button className="w-full bg-red-600 hover:bg-red-700 text-white">
                  Comunicar Sinistro
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Acidentes de Trabalho */}
          <Card className="shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="bg-orange-50 border-b border-orange-200">
              <CardTitle className="flex items-center text-orange-700">
                <Users className="w-5 h-5 mr-2" />
                Acidentes de Trabalho
              </CardTitle>
              <CardDescription>
                Registro de acidentes com colaboradores
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4">
              <p className="text-sm text-gray-600 mb-4">
                Reporte acidentes de trabalho e incidentes com colaboradores. Informe detalhes da ocorrência, medidas tomadas e encaminhamentos médicos.
              </p>
              <Link href="/admin/acidentes">
                <Button className="w-full bg-orange-600 hover:bg-orange-700 text-white">
                  Comunicar Acidente
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Gestão de Multas */}
          <Card className="shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="bg-yellow-50 border-b border-yellow-200">
              <CardTitle className="flex items-center text-yellow-700">
                <FileText className="w-5 h-5 mr-2" />
                Gestão de Multas
              </CardTitle>
              <CardDescription>
                Comunicação de infrações de trânsito
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4">
              <p className="text-sm text-gray-600 mb-4">
                Receba comunicações de multas e infrações de trânsito emitidas pela Gestão de Multas. Visualize detalhes dos veículos, motoristas, datas e valores das infrações.
              </p>
              <Link href="/admin/multas">
                <Button className="w-full bg-yellow-600 hover:bg-yellow-700 text-white">
                  Ver Multas
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Cadastro de Veículos */}
          <Card className="shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="bg-green-50 border-b border-green-200">
              <CardTitle className="flex items-center text-green-700">
                <Car className="w-5 h-5 mr-2" />
                Cadastro de Veículos
              </CardTitle>
              <CardDescription>
                Gerenciamento da frota
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4">
              <p className="text-sm text-gray-600 mb-4">
                Cadastre, atualize e gerencie os veículos da Base GP03. Registre modelos, placas, status operacional e informações técnicas.
              </p>
              <Link href="/admin/veiculos">
                <Button className="w-full bg-green-600 hover:bg-green-700 text-white">
                  Gerenciar Veículos
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Despesas Mensais */}
          <Card className="shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="bg-blue-50 border-b border-blue-200">
              <CardTitle className="flex items-center text-blue-700">
                <TrendingUp className="w-5 h-5 mr-2" />
                Despesas Mensais
              </CardTitle>
              <CardDescription>
                Controle de despesas da base
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4">
              <p className="text-sm text-gray-600 mb-4">
                Registre e acompanhe despesas mensais como água, energia, funcionários, PJ, aluguel, internet e extras.
              </p>
              <Link href="/admin/despesas">
                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                  Controlar Despesas
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Solicitação de Pneus */}
          <Card className="shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="bg-purple-50 border-b border-purple-200">
              <CardTitle className="flex items-center text-purple-700">
                <Building className="w-5 h-5 mr-2" />
                Solicitação de Pneus
              </CardTitle>
              <CardDescription>
                Requisição para a linha de pneus
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4">
              <p className="text-sm text-gray-600 mb-4">
                Faça solicitações de pneus para a linha responsável, especificando modelos, quantidades e justificativas.
              </p>
              <Link href="/admin/pneus">
                <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white">
                  Solicitar Pneus
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Solicitação de Orçamentos */}
          <Card className="shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="bg-indigo-50 border-b border-indigo-200">
              <CardTitle className="flex items-center text-indigo-700">
                <FileText className="w-5 h-5 mr-2" />
                Solicitação de Orçamentos
              </CardTitle>
              <CardDescription>
                Requisição e aprovação de orçamentos
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4">
              <p className="text-sm text-gray-600 mb-4">
                Solicite orçamentos para serviços ou produtos, aguarde a aprovação da gestão e acompanhe todo o processo.
              </p>
              <Link href="/admin/orcamentos">
                <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white">
                  Solicitar Orçamento
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Cartão Combustível */}
          <Card className="shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="bg-cyan-50 border-b border-cyan-200">
              <CardTitle className="flex items-center text-cyan-700">
                <CreditCard className="w-5 h-5 mr-2" />
                Cartão Combustível
              </CardTitle>
              <CardDescription>
                Solicitação de saldo e histórico
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4">
              <p className="text-sm text-gray-600 mb-4">
                Solicite recarga de saldo para cartões de combustível e acompanhe o histórico de solicitações e aprovações.
              </p>
              <Link href="/bases/gp03/cartao-combustivel">
                <Button className="w-full bg-cyan-600 hover:bg-cyan-700 text-white">
                  Gerenciar Cartão
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Manutenção de Frota */}
          <Card className="shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="bg-orange-50 border-b border-orange-200">
              <CardTitle className="flex items-center text-orange-700">
                <Wrench className="w-5 h-5 mr-2" />
                Manutenção de Frota
              </CardTitle>
              <CardDescription>
                Solicitações para gestão de frota
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4">
              <p className="text-sm text-gray-600 mb-4">
                Registre solicitações de manutenção para veículos da frota, especificando o tipo de manutenção, prioridade e detalhes.
              </p>
              <Link href="/admin/manutencao">
                <Button className="w-full bg-orange-600 hover:bg-orange-700 text-white">
                  Solicitar Manutenção
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="text-center mt-12 text-sm text-gray-500">
          <p>Base GP03 - Hortolandia • Grupo Pereira</p>
          <p>Sistema Murici On Fleet 2.0</p>
        </div>
      </div>
    </div>
  );
}