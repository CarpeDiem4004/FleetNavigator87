import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, AlertTriangle, Fuel, Car, FileText, Users, TrendingUp, CreditCard, Wrench, Building } from 'lucide-react';

export default function BaseGP02External() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Base GP02 - Jacarei
          </h1>
          <p className="text-lg text-gray-600">
            Gerenciamento completo da Base GP02
          </p>
          <Badge variant="secondary" className="mt-2">
            <MapPin className="w-4 h-4 mr-1" />
            Jacarei, SP
          </Badge>
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
              <a href="/posto/gp02/public" target="_blank" rel="noopener noreferrer">
                <Button className="w-full bg-red-600 hover:bg-red-700 text-white">
                  Comunicar Sinistro
                </Button>
              </a>
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
              <a href="/posto/gp02/public" target="_blank" rel="noopener noreferrer">
                <Button className="w-full bg-orange-600 hover:bg-orange-700 text-white">
                  Comunicar Acidente
                </Button>
              </a>
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
              <a href="/posto/gp02/public" target="_blank" rel="noopener noreferrer">
                <Button className="w-full bg-yellow-600 hover:bg-yellow-700 text-white">
                  Ver Multas
                </Button>
              </a>
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
                Cadastre, atualize e gerencie os veículos da Base GP02. Registre modelos, placas, status operacional e informações técnicas.
              </p>
              <a href="/posto/gp02/public" target="_blank" rel="noopener noreferrer">
                <Button className="w-full bg-green-600 hover:bg-green-700 text-white">
                  Gerenciar Veículos
                </Button>
              </a>
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
              <a href="/posto/gp02/public" target="_blank" rel="noopener noreferrer">
                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                  Controlar Despesas
                </Button>
              </a>
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
              <a href="/posto/gp02/public" target="_blank" rel="noopener noreferrer">
                <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white">
                  Solicitar Pneus
                </Button>
              </a>
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
              <a href="/posto/gp02/public" target="_blank" rel="noopener noreferrer">
                <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white">
                  Solicitar Orçamento
                </Button>
              </a>
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
              <a href="/posto/gp02/public" target="_blank" rel="noopener noreferrer">
                <Button className="w-full bg-cyan-600 hover:bg-cyan-700 text-white">
                  Gerenciar Cartão
                </Button>
              </a>
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
              <a href="/posto/gp02/public" target="_blank" rel="noopener noreferrer">
                <Button className="w-full bg-orange-600 hover:bg-orange-700 text-white">
                  Solicitar Manutenção
                </Button>
              </a>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="text-center mt-12 text-sm text-gray-500">
          <p>Base GP02 - Jacarei • Grupo Pereira</p>
          <p>Sistema Murici On Fleet 2.0</p>
        </div>
      </div>
    </div>
  );
}