import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useLocation } from 'wouter';

const DashboardNew: React.FC = () => {
  const [_, navigate] = useLocation();

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Sistema de Gestão de Frotas</h1>
          <Button onClick={() => navigate('/login')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para Login
          </Button>
        </div>
        
        <p className="text-gray-500">
          Esta é uma demonstração do sistema de gestão de frotas. Estamos resolvendo problemas de autenticação no momento.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Bem-vindo ao Sistema de Gestão de Frotas</CardTitle>
            <CardDescription>
              Seu sistema completo para gerenciar sua frota de veículos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>A aplicação conta com os seguintes módulos:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Gestão de Veículos</li>
              <li>Controle de Manutenção</li>
              <li>Monitoramento de Pneus</li>
              <li>Registro de Abastecimentos</li>
              <li>Controle de Multas</li>
              <li>Gestão de Transporte (Line Haul)</li>
              <li>Gerenciamento de Bases</li>
              <li>Administração de Usuários</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Status do Desenvolvimento</CardTitle>
            <CardDescription>
              Acompanhe o progresso da implementação
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              <li className="flex items-center">
                <div className="h-4 w-4 rounded-full bg-green-500 mr-2"></div>
                <span>Estrutura da aplicação implementada</span>
              </li>
              <li className="flex items-center">
                <div className="h-4 w-4 rounded-full bg-green-500 mr-2"></div>
                <span>Modelagem do banco de dados completa</span>
              </li>
              <li className="flex items-center">
                <div className="h-4 w-4 rounded-full bg-yellow-500 mr-2"></div>
                <span>Implementação da autenticação em andamento</span>
              </li>
              <li className="flex items-center">
                <div className="h-4 w-4 rounded-full bg-gray-300 mr-2"></div>
                <span>Implementação dos componentes de dashboard</span>
              </li>
              <li className="flex items-center">
                <div className="h-4 w-4 rounded-full bg-gray-300 mr-2"></div>
                <span>Integração com APIs de serviços externos</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardNew;