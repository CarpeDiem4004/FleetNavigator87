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
  ArrowRight 
} from 'lucide-react';

const BaseCampinas: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Base Campinas
          </h1>
          <p className="text-slate-600 mt-2">
            Gerenciamento completo da Base Campinas
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
            <Link href="/bases/campinas/despesas">
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
            <Link href="/bases/campinas/solicitacao-pneus">
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
            <Link href="/bases/campinas/solicitacao-orcamento">
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
            <Link href="/bases/campinas/manutencao-frota">
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

export default BaseCampinas;