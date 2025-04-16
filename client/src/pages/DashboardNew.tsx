import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Truck, Wrench, AlertTriangle, Fuel } from 'lucide-react';
import MainLayoutSimple from '@/components/layout/MainLayoutSimple';

// Componente de cartão estatístico
interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color }) => {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <h4 className="mt-2 text-2xl font-bold">{value}</h4>
          </div>
          <div className={`p-3 rounded-full ${color}`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const DashboardNew: React.FC = () => {
  // Dados mockados para o dashboard
  const stats = [
    { 
      title: 'Total de Veículos', 
      value: '42', 
      icon: <Truck className="h-6 w-6 text-white" />, 
      color: 'bg-blue-500' 
    },
    { 
      title: 'Manutenções Pendentes', 
      value: '7', 
      icon: <Wrench className="h-6 w-6 text-white" />, 
      color: 'bg-yellow-500' 
    },
    { 
      title: 'Multas a Pagar', 
      value: 'R$ 2.450,00', 
      icon: <AlertTriangle className="h-6 w-6 text-white" />, 
      color: 'bg-red-500' 
    },
    { 
      title: 'Consumo de Diesel', 
      value: '4.230 L', 
      icon: <Fuel className="h-6 w-6 text-white" />, 
      color: 'bg-green-500' 
    }
  ];

  return (
    <MainLayoutSimple>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold mb-2">Dashboard</h1>
          <p className="text-gray-500">
            Visão geral das operações da frota
          </p>
        </div>

        {/* Cartões de estatísticas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, index) => (
            <StatCard 
              key={index}
              title={stat.title}
              value={stat.value}
              icon={stat.icon}
              color={stat.color}
            />
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Sistema de Gestão de Frotas</CardTitle>
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
                  <div className="h-4 w-4 rounded-full bg-green-500 mr-2"></div>
                  <span>Implementação da autenticação concluída</span>
                </li>
                <li className="flex items-center">
                  <div className="h-4 w-4 rounded-full bg-yellow-500 mr-2"></div>
                  <span>Implementação dos componentes do dashboard</span>
                </li>
                <li className="flex items-center">
                  <div className="h-4 w-4 rounded-full bg-gray-300 mr-2"></div>
                  <span>Integração com APIs de serviços externos</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Tabela de Últimas Manutenções */}
        <Card>
          <CardHeader>
            <CardTitle>Últimas Manutenções</CardTitle>
            <CardDescription>
              Registro das manutenções mais recentes na frota
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                  <tr>
                    <th className="px-6 py-3">Veículo</th>
                    <th className="px-6 py-3">Tipo</th>
                    <th className="px-6 py-3">Data</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">Custo</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-white border-b">
                    <td className="px-6 py-4 font-medium">ABC-1234</td>
                    <td className="px-6 py-4">Preventiva</td>
                    <td className="px-6 py-4">10/04/2025</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                        Concluída
                      </span>
                    </td>
                    <td className="px-6 py-4">R$ 850,00</td>
                  </tr>
                  <tr className="bg-gray-50 border-b">
                    <td className="px-6 py-4 font-medium">DEF-5678</td>
                    <td className="px-6 py-4">Corretiva</td>
                    <td className="px-6 py-4">08/04/2025</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">
                        Em andamento
                      </span>
                    </td>
                    <td className="px-6 py-4">R$ 1.250,00</td>
                  </tr>
                  <tr className="bg-white border-b">
                    <td className="px-6 py-4 font-medium">GHI-9012</td>
                    <td className="px-6 py-4">Corretiva</td>
                    <td className="px-6 py-4">05/04/2025</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">
                        Aguardando peças
                      </span>
                    </td>
                    <td className="px-6 py-4">R$ 2.100,00</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayoutSimple>
  );
};

export default DashboardNew;