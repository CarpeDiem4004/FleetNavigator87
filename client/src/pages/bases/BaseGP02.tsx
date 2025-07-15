import React from 'react';
import { Link } from 'wouter';
import { 
  Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Warehouse, 
  CreditCard, 
  CircleDot, 
  FileText, 
  Wrench, 
  ArrowRight,
  Car,
  Truck,
  AlertTriangle,
  Bell,
  HardHat,
  FileWarning
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useLocation } from 'wouter';

const BaseGP02: React.FC = () => {
  const { logout } = useAuth();
  const [, setLocation] = useLocation();

  const handleLogout = async () => {
    await logout();
    setLocation('/bases/gp02/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Base GP02 - Jacarei</h1>
              <p className="text-gray-600">Grupo Pereira</p>
            </div>
            <div className="flex items-center space-x-4">
              <Button 
                onClick={handleLogout}
                variant="outline" 
                className="text-red-600 hover:text-red-800"
              >
                Sair
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">
              Base GP02 - Jacarei
            </h2>
            <p className="text-slate-600 mt-2">
              Gerenciamento completo da Base GP02 - Jacarei
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card para Comunicação de Sinistros/Roubos */}
          <Card className="shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="bg-red-50 pb-2">
              <CardTitle className="flex items-center text-red-700">
                <AlertTriangle className="w-5 h-5 mr-2" />
                Sinistros e Roubos
              </CardTitle>
              <CardDescription>Registro de ocorrências com veículos</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <p className="text-gray-600">
                Comunique sinistros, roubos e outros incidentes envolvendo veículos da frota. Registre os detalhes da ocorrência, local, horário e danos.
              </p>
            </CardContent>
            <CardFooter className="border-t pt-4 flex justify-end">
              <Link href="/bases/gp02/sinistros">
                <Button variant="outline" className="flex items-center text-red-600 hover:text-red-800">
                  Comunicar Sinistro <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </CardFooter>
          </Card>

          {/* Card para Comunicação de Acidentes de Trabalho */}
          <Card className="shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="bg-orange-50 pb-2">
              <CardTitle className="flex items-center text-orange-700">
                <HardHat className="w-5 h-5 mr-2" />
                Acidentes de Trabalho
              </CardTitle>
              <CardDescription>Registro de acidentes com colaboradores</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <p className="text-gray-600">
                Reporte acidentes de trabalho e incidentes com colaboradores. Informe detalhes da ocorrência, medidas tomadas e encaminhamentos médicos.
              </p>
            </CardContent>
            <CardFooter className="border-t pt-4 flex justify-end">
              <Link href="/bases/gp02/acidentes-trabalho">
                <Button variant="outline" className="flex items-center text-orange-600 hover:text-orange-800">
                  Comunicar Acidente <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </CardFooter>
          </Card>

          {/* Card de Gestão de Multas */}
          <Card className="shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="bg-blue-50 pb-2">
              <CardTitle className="flex items-center text-blue-700">
                <FileWarning className="w-5 h-5 mr-2" />
                Gestão de Multas
              </CardTitle>
              <CardDescription>Comunicação de infrações de trânsito</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <p className="text-gray-600">
                Receba comunicações de multas e infrações de trânsito emitidas pela Gestão de Multas. Visualize detalhes dos veículos, motoristas, datas e valores das infrações.
              </p>
            </CardContent>
            <CardFooter className="border-t pt-4 flex justify-end">
              <Link href="/bases/gp02/multas">
                <Button variant="outline" className="flex items-center text-blue-600 hover:text-blue-800">
                  Ver Multas <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </CardFooter>
          </Card>

          {/* Card de Cadastro de Veículos */}
          <Card className="shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="bg-green-50 pb-2">
              <CardTitle className="flex items-center text-green-700">
                <Car className="w-5 h-5 mr-2" />
                Cadastro de Veículos
              </CardTitle>
              <CardDescription>Gerenciamento da frota</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <p className="text-gray-600">
                Cadastre, atualize e gerencie os veículos da Base GP02. Registre modelos, placas, status operacional e informações técnicas.
              </p>
            </CardContent>
            <CardFooter className="border-t pt-4 flex justify-end">
              <Link href="/bases/gp02/veiculos">
                <Button variant="outline" className="flex items-center text-green-600 hover:text-green-800">
                  Gerenciar Veículos <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </CardFooter>
          </Card>

          {/* Card de Despesas Mensais */}
          <Card className="shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="bg-blue-50 pb-2">
              <CardTitle className="flex items-center text-blue-700">
                <Warehouse className="w-5 h-5 mr-2" />
                Despesas Mensais
              </CardTitle>
              <CardDescription>Controle de despesas da base</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <p className="text-gray-600">
                Registre e acompanhe despesas mensais como água, energia, funcionários, PJ, aluguel, internet e extras.
              </p>
            </CardContent>
            <CardFooter className="border-t pt-4 flex justify-end">
              <Link href="/bases/gp02/despesas">
                <Button variant="outline" className="flex items-center text-blue-600 hover:text-blue-800">
                  Gerenciar Despesas <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </CardFooter>
          </Card>

          {/* Card de Solicitação de Pneus */}
          <Card className="shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="bg-green-50 pb-2">
              <CardTitle className="flex items-center text-green-700">
                <CircleDot className="w-5 h-5 mr-2" />
                Solicitação de Pneus
              </CardTitle>
              <CardDescription>Requisição para o time de pneus</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <p className="text-gray-600">
                Faça solicitações de pneus para o time responsável, especificando modelos, quantidades e justificativas.
              </p>
            </CardContent>
            <CardFooter className="border-t pt-4 flex justify-end">
              <Link href="/bases/gp02/solicitacao-pneus">
                <Button variant="outline" className="flex items-center text-green-600 hover:text-green-800">
                  Solicitar Pneus <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </CardFooter>
          </Card>

          {/* Card de Solicitação de Orçamentos */}
          <Card className="shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="bg-purple-50 pb-2">
              <CardTitle className="flex items-center text-purple-700">
                <FileText className="w-5 h-5 mr-2" />
                Solicitação de Orçamentos
              </CardTitle>
              <CardDescription>Requisição e aprovação de orçamentos</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <p className="text-gray-600">
                Solicite orçamentos para serviços ou produtos, aguarde a aprovação da gestão e acompanhe todo o processo.
              </p>
            </CardContent>
            <CardFooter className="border-t pt-4 flex justify-end">
              <Link href="/bases/gp02/solicitacao-orcamento">
                <Button variant="outline" className="flex items-center text-purple-600 hover:text-purple-800">
                  Solicitar Orçamento <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </CardFooter>
          </Card>

          {/* Card de Cartão Combustível */}
          <Card className="shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="bg-cyan-50 pb-2">
              <CardTitle className="flex items-center text-cyan-700">
                <CreditCard className="w-5 h-5 mr-2" />
                Cartão Combustível
              </CardTitle>
              <CardDescription>Solicitação de saldo e histórico</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <p className="text-gray-600">
                Solicite recarga de saldo para cartões de combustível e acompanhe o histórico de solicitações e operações.
              </p>
            </CardContent>
            <CardFooter className="border-t pt-4 flex justify-end">
              <Link href="/bases/gp02/cartao-combustivel">
                <Button variant="outline" className="flex items-center text-cyan-600 hover:text-cyan-800">
                  Gerenciar Cartão <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </CardFooter>
          </Card>

          {/* Card de Gerenciamento de Cartões Ativos (Admin) */}
          <Card className="shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="bg-emerald-50 pb-2">
              <CardTitle className="flex items-center text-emerald-700">
                <CreditCard className="w-5 h-5 mr-2" />
                Cartões Ativos (Admin)
              </CardTitle>
              <CardDescription>Gerenciar cartões de combustível em uso</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <p className="text-gray-600">
                Cadastre, edite e gerencie os cartões de combustível que estão ativos e em uso na base.
              </p>
            </CardContent>
            <CardFooter className="border-t pt-4 flex justify-end">
              <Link href="/bases/gp02/cartoes-ativos">
                <Button variant="outline" className="flex items-center text-emerald-600 hover:text-emerald-800">
                  Gerenciar Cartões <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </CardFooter>
          </Card>

          {/* Card de Manutenção de Frota */}
          <Card className="shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="bg-orange-50 pb-2">
              <CardTitle className="flex items-center text-orange-700">
                <Wrench className="w-5 h-5 mr-2" />
                Manutenção de Frota
              </CardTitle>
              <CardDescription>Solicitações para gestão de frota</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <p className="text-gray-600">
                Registre solicitações de manutenção para veículos da frota, especificando o tipo de manutenção, prioridade e detalhes.
              </p>
            </CardContent>
            <CardFooter className="border-t pt-4 flex justify-end">
              <Link href="/bases/gp02/manutencao-frota">
                <Button variant="outline" className="flex items-center text-orange-600 hover:text-orange-800">
                  Solicitar Manutenção <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default BaseGP02;