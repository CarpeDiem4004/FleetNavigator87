import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Truck, Bolt, Fuel, AlertTriangle, ArrowLeft, BarChart3, FileText, AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useLocation } from 'wouter';
import { supabase } from '@/lib/supabase-client';
import MainLayoutSimple from '@/components/layout/MainLayoutSimple';
import VeiculosParadosCard from '@/components/dashboard/VeiculosParadosCard';
import PainelPrincipal from '@/components/dashboard/PainelPrincipal';
import { useToast } from '@/hooks/use-toast';

interface DashboardMetrics {
  veiculos_total?: number;
  manutencoes_pendentes?: number;
  manutencoes_andamento?: number;
  abastecimentos_mes?: number;
  custos_totais?: number;
  pneus_estoque?: number;
}

const Dashboard: React.FC = () => {
  const { toast } = useToast();
  const [_, navigate] = useLocation();
  const [metrics, setMetrics] = useState<DashboardMetrics>({});
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const autoRefreshTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Limpar as métricas (zerar os dados)
  const clearMetrics = useCallback(() => {
    setMetrics({
      veiculos_total: 0,
      manutencoes_pendentes: 0,
      manutencoes_andamento: 0,
      abastecimentos_mes: 0,
      pneus_estoque: 0
    });
  }, []);

  // Função para buscar dados, com opção para mostrar indicadores de carregamento
  const fetchDashboardData = useCallback(async (showLoading = true) => {
    if (showLoading) {
      setIsLoading(true);
    }
    
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
      
      // Atualizar horário da última atualização
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error);
      if (!showLoading) {
        toast({
          title: "Erro na atualização",
          description: "Não foi possível atualizar os dados do dashboard",
          variant: "destructive"
        });
      }
    } finally {
      if (showLoading) {
        setIsLoading(false);
      }
    }
  }, [toast]);

  // Atualização automática a cada 30 segundos
  useEffect(() => {
    // Inicializar com dados limpos
    clearMetrics();
    
    // Carregar dados iniciais
    fetchDashboardData();
    
    // Configurar atualização automática
    if (autoRefresh) {
      autoRefreshTimerRef.current = setInterval(() => {
        fetchDashboardData(false); // Atualizar sem mostrar indicador de carregamento
      }, 30000); // A cada 30 segundos
    }
    
    // Limpeza ao desmontar o componente
    return () => {
      if (autoRefreshTimerRef.current) {
        clearInterval(autoRefreshTimerRef.current);
      }
    };
  }, [fetchDashboardData, clearMetrics, autoRefresh]);

  // Alternar atualização automática
  const toggleAutoRefresh = () => {
    if (autoRefresh) {
      // Desligar auto-refresh
      if (autoRefreshTimerRef.current) {
        clearInterval(autoRefreshTimerRef.current);
        autoRefreshTimerRef.current = null;
      }
    } else {
      // Ligar auto-refresh
      autoRefreshTimerRef.current = setInterval(() => {
        fetchDashboardData(false);
      }, 30000);
    }
    setAutoRefresh(!autoRefresh);
  };

  // Forçar atualização manual
  const handleManualRefresh = () => {
    fetchDashboardData();
    toast({
      title: "Dashboard atualizado",
      description: "Os dados foram atualizados com sucesso.",
    });
  };

  // Zerar todos os dados
  const handleClearData = () => {
    clearMetrics();
    toast({
      title: "Dados zerados",
      description: "Todos os dados do dashboard foram zerados.",
    });
  };

  return (
    <MainLayoutSimple>
      <div className="space-y-6 p-4 md:p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <p className="text-gray-500">
              Visão geral da sua frota e operações
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleClearData}
              className="text-gray-600"
            >
              Zerar Dados
            </Button>
            <Button 
              variant={autoRefresh ? "default" : "outline"} 
              size="sm" 
              onClick={toggleAutoRefresh}
              className={autoRefresh ? "" : "text-gray-600"}
            >
              {autoRefresh ? "Auto Atualização: Ligada" : "Auto Atualização: Desligada"}
            </Button>
            <Button 
              variant="outline" 
              size="icon" 
              onClick={handleManualRefresh}
              disabled={isLoading}
              className="text-gray-600"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
        
        {lastUpdated && (
          <div className="flex justify-end">
            <p className="text-xs text-gray-500">
              Última atualização: {lastUpdated.toLocaleTimeString()}
            </p>
          </div>
        )}

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

        {/* Painel Principal de Operações */}
        <PainelPrincipal />

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
                      <div className="h-2 w-2 rounded-full bg-green-500 mr-2"></div>
                      <span className="text-sm">Painel de Operações</span>
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
