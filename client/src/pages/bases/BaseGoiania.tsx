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

const BaseGoiania: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Base Goiânia
          </h1>
          <p className="text-slate-600 mt-2">
            Gerenciamento completo da Base Goiânia
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
              Comunique sinistros, roubos e outros incidentes envolvendo veículos da frota. Registre detalhes do ocorrido, local, horário e danos.
            </p>
          </CardContent>
          <CardFooter className="border-t pt-4 flex justify-end">
            <Link href="/bases/goiania/sinistros">
              <Button variant="outline" className="flex items-center text-red-600 hover:text-red-800">
                Comunicar Sinistro <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </CardFooter>
        </Card>

        {/* Card para Comunicação de Acidentes de Trabalho */}
        <Card className="shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="bg-amber-50 pb-2">
            <CardTitle className="flex items-center text-amber-700">
              <HardHat className="w-5 h-5 mr-2" />
              Acidentes de Trabalho
            </CardTitle>
            <CardDescription>Registro de acidentes com colaboradores</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <p className="text-gray-600">
              Reporte acidentes de trabalho e incidentes com colaboradores. Informe detalhes do ocorrido, medidas tomadas e encaminhamentos médicos.
            </p>
          </CardContent>
          <CardFooter className="border-t pt-4 flex justify-end">
            <Link href="/bases/goiania/acidentes-trabalho">
              <Button variant="outline" className="flex items-center text-amber-600 hover:text-amber-800">
                Comunicar Acidente <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </CardFooter>
        </Card>
        
        {/* Card para Gestão de Multas */}
        <Card className="shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="bg-indigo-50 pb-2">
            <CardTitle className="flex items-center text-indigo-700">
              <FileWarning className="w-5 h-5 mr-2" />
              Gestão de Multas
            </CardTitle>
            <CardDescription>Comunicados de infrações de trânsito</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <p className="text-gray-600">
              Receba comunicados de multas e infrações de trânsito enviados pela Gestão de Multas. Visualize detalhes dos veículos, motoristas, datas e valores das infrações.
            </p>
          </CardContent>
          <CardFooter className="border-t pt-4 flex justify-end">
            <Link href="/bases/goiania/multas">
              <Button variant="outline" className="flex items-center text-indigo-600 hover:text-indigo-800">
                Ver Multas <Bell className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </CardFooter>
        </Card>

        {/* Card de Cadastro de Veículos */}
        <Card className="shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="bg-emerald-50 pb-2">
            <CardTitle className="flex items-center text-emerald-700">
              <Truck className="w-5 h-5 mr-2" />
              Cadastro de Veículos
            </CardTitle>
            <CardDescription>Gerenciamento da frota</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <p className="text-gray-600">
              Cadastre, atualize e gerencie os veículos da Base Goiânia. Registre modelos, placas, status operacional e informações técnicas.
            </p>
          </CardContent>
          <CardFooter className="border-t pt-4 flex justify-end">
            <Link href="/vehicles?base=10">
              <Button variant="outline" className="flex items-center text-emerald-600 hover:text-emerald-800">
                Gerenciar Veículos <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </CardFooter>
        </Card>

        {/* Card de Despesas */}
        <Card className="shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="bg-blue-50 pb-2">
            <CardTitle className="flex items-center text-blue-700">
              <CreditCard className="w-5 h-5 mr-2" />
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
            <Link href="/bases/goiania/despesas">
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
            <Link href="/bases/goiania/solicitacao-pneus">
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
            <Link href="/bases/goiania/solicitacao-orcamento">
              <Button variant="outline" className="flex items-center text-purple-600 hover:text-purple-800">
                Solicitar Orçamento <ArrowRight className="w-4 h-4 ml-2" />
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
            <Link href="/bases/goiania/manutencao-frota">
              <Button variant="outline" className="flex items-center text-orange-600 hover:text-orange-800">
                Solicitar Manutenção <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default BaseGoiania;