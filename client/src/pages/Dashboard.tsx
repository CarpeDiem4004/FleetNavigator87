import React, { useState, useEffect } from 'react';
import { Truck, Bolt, Fuel, AlertTriangle, ArrowLeft, BarChart3, FileText, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useLocation } from 'wouter';
import { supabase } from '@/lib/supabase-client';
import MainLayoutSimple from '@/components/layout/MainLayoutSimple';
import VeiculosParadosCard from '@/components/dashboard/VeiculosParadosCard';

interface DashboardMetrics {
  veiculos_total?: number;
  manutencoes_pendentes?: number;
  manutencoes_andamento?: number;
  abastecimentos_mes?: number;
  custos_totais?: number;
  pneus_estoque?: number;
}

const Dashboard: React.FC = () => {
  const [_, navigate] = useLocation();
  const [metrics, setMetrics] = useState<DashboardMetrics>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      // Carregar estatísticas básicas
      const [veiculosResult, manutencoesResult, abasteResult, pneusResult] = await Promise.all([
        supabase.from('vehicles').select('id', { count: 'exact' }),
        supabase.from('manutencoes').select('id, status'),
        supabase.from('refueling').select('id'),
        supabase.from('pneus').select('id', { count: 'exact' })
      ]);

      // Processar os resultados
      const veiculosTotal = veiculosResult.count || 0;
      
      const manutencoes = manutencoesResult.data || [];
      const manutencoesPendentes = manutencoes.filter(m => m.status === 'pendente').length;
      const manutencoesAndamento = manutencoes.filter(m => m.status === 'em_andamento').length;
      
      const abastecimentosMes = abasteResult.data?.length || 0;
      const pneusEstoque = pneusResult.count || 0;

      setMetrics({
        veiculos_total: veiculosTotal,
        manutencoes_pendentes: manutencoesPendentes,
        manutencoes_andamento: manutencoesAndamento,
        abastecimentos_mes: abastecimentosMes,
        pneus_estoque: pneusEstoque
      });
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <MainLayoutSimple>
      <div className="space-y-6 p-4 md:p-6">
        <div className="flex flex-col space-y-2">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-gray-500">
            Visão geral da sua frota e operações
          </p>
        </div>

        {/* Cards de KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center">
                <Truck className="h-5 w-5 mr-2 text-primary" />
                Veículos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {isLoading ? '...' : metrics.veiculos_total || 0}
              </div>
              <p className="text-sm text-gray-500 mt-1">Veículos cadastrados</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center">
                <AlertCircle className="h-5 w-5 mr-2 text-amber-500" />
                Manutenções
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {isLoading ? '...' : metrics.manutencoes_pendentes || 0}
              </div>
              <p className="text-sm text-gray-500 mt-1">Pendentes</p>
              <p className="text-xs text-blue-600 mt-1">
                {metrics.manutencoes_andamento || 0} em andamento
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center">
                <Fuel className="h-5 w-5 mr-2 text-green-600" />
                Abastecimentos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {isLoading ? '...' : metrics.abastecimentos_mes || 0}
              </div>
              <p className="text-sm text-gray-500 mt-1">No mês atual</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center">
                <CheckCircle2 className="h-5 w-5 mr-2 text-purple-600" />
                Pneus
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {isLoading ? '...' : metrics.pneus_estoque || 0}
              </div>
              <p className="text-sm text-gray-500 mt-1">Em estoque</p>
            </CardContent>
          </Card>
        </div>

        {/* Seção Principal */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card de Veículos Parados */}
          <div className="lg:col-span-1">
            <VeiculosParadosCard />
          </div>

          {/* Status do Sistema */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="h-5 w-5 mr-2 text-primary" />
                Visão Geral do Sistema
              </CardTitle>
              <CardDescription>
                Resumo das principais funcionalidades e status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold mb-2">Módulos Disponíveis</h3>
                  <ul className="space-y-2">
                    <li className="flex items-center">
                      <div className="h-2 w-2 rounded-full bg-green-500 mr-2"></div>
                      <span className="text-sm">Gestão de Veículos</span>
                    </li>
                    <li className="flex items-center">
                      <div className="h-2 w-2 rounded-full bg-green-500 mr-2"></div>
                      <span className="text-sm">Controle de Manutenção</span>
                    </li>
                    <li className="flex items-center">
                      <div className="h-2 w-2 rounded-full bg-green-500 mr-2"></div>
                      <span className="text-sm">Monitoramento de Pneus</span>
                    </li>
                    <li className="flex items-center">
                      <div className="h-2 w-2 rounded-full bg-green-500 mr-2"></div>
                      <span className="text-sm">Registro de Abastecimentos</span>
                    </li>
                    <li className="flex items-center">
                      <div className="h-2 w-2 rounded-full bg-green-500 mr-2"></div>
                      <span className="text-sm">Line Hall Shopee</span>
                    </li>
                    <li className="flex items-center">
                      <div className="h-2 w-2 rounded-full bg-green-500 mr-2"></div>
                      <span className="text-sm">Cadastro de Motoristas</span>
                    </li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Novos Recursos</h3>
                  <ul className="space-y-2">
                    <li className="flex items-center">
                      <div className="h-2 w-2 rounded-full bg-green-500 mr-2"></div>
                      <span className="text-sm">Solicitações de Manutenção</span>
                    </li>
                    <li className="flex items-center">
                      <div className="h-2 w-2 rounded-full bg-green-500 mr-2"></div>
                      <span className="text-sm">Tratativa de Manutenções</span>
                    </li>
                    <li className="flex items-center">
                      <div className="h-2 w-2 rounded-full bg-green-500 mr-2"></div>
                      <span className="text-sm">Monitor de Veículos Parados</span>
                    </li>
                    <li className="flex items-center">
                      <div className="h-2 w-2 rounded-full bg-blue-500 mr-2"></div>
                      <span className="text-sm">Análise de Desempenho</span>
                    </li>
                    <li className="flex items-center">
                      <div className="h-2 w-2 rounded-full bg-blue-500 mr-2"></div>
                      <span className="text-sm">Exportação de Relatórios</span>
                    </li>
                    <li className="flex items-center">
                      <div className="h-2 w-2 rounded-full bg-blue-500 mr-2"></div>
                      <span className="text-sm">Aplicativo Mobile</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayoutSimple>
  );
};

export default Dashboard;
