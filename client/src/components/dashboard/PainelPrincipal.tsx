import React, { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase-client';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from 'date-fns';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface PainelData {
  id: number;
  data_referencia: string;
  manutencoes_pendentes: number;
  tempo_medio_manutencao: string;
  veiculos_parados: number;
  dias_parados_total: number;
  linehall_parados: number;
  viagens_concluidas: number;
  viagens_no_show: number;
  viagens_canceladas_cliente: number;
  litros_diesel_total: number;
  gasto_total_combustivel: number;
  qtd_sinistros: number;
  qtd_roubos: number;
  incidentes_seguranca_trabalho: number;
  movimentacoes_pneus: number;
  pneus_substituidos: number;
}

interface KpiCardProps {
  label: string;
  value: string | number;
  color?: string;
  isLoading?: boolean;
}

const KpiCard: React.FC<KpiCardProps> = ({ label, value, color = 'blue', isLoading }) => {
  const colorClasses = {
    blue: 'border-blue-600',
    red: 'border-red-600',
    green: 'border-green-600',
    amber: 'border-amber-600',
    purple: 'border-purple-600',
  };

  return (
    <div className={`p-4 bg-white shadow rounded border-l-4 ${colorClasses[color as keyof typeof colorClasses]}`}>
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-xl font-semibold">
        {isLoading ? '...' : value}
      </p>
    </div>
  );
};

const PainelPrincipal: React.FC = () => {
  const { toast } = useToast();
  const [painel, setPainel] = useState<PainelData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const autoRefreshTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Dados mockados quando não há dados ou para testes
  const mockPainelData: PainelData = {
    id: 0,
    data_referencia: format(new Date(), 'yyyy-MM-dd'),
    manutencoes_pendentes: 0,
    tempo_medio_manutencao: '0 dias',
    veiculos_parados: 0,
    dias_parados_total: 0,
    linehall_parados: 0,
    viagens_concluidas: 0, 
    viagens_no_show: 0,
    viagens_canceladas_cliente: 0,
    litros_diesel_total: 0,
    gasto_total_combustivel: 0,
    qtd_sinistros: 0,
    qtd_roubos: 0,
    incidentes_seguranca_trabalho: 0,
    movimentacoes_pneus: 0,
    pneus_substituidos: 0
  };

  // Zerar os dados do painel
  const clearPainel = useCallback(() => {
    setPainel(mockPainelData);
  }, []);

  // Buscar dados do painel principal
  const fetchPainelData = useCallback(async (showLoading = true) => {
    if (showLoading) {
      setIsLoading(true);
    }

    try {
      // Tentar buscar da tabela painel_principal
      const { data, error } = await supabase
        .from('painel_principal')
        .select('*')
        .order('data_referencia', { ascending: false })
        .limit(1);

      if (error) {
        console.error('Erro ao buscar painel:', error);
        // Se der erro, usar dados calculados a partir de outras tabelas
        await fetchCalculatedData();
      } else if (data && data.length > 0) {
        setPainel(data[0]);
      } else {
        // Se não encontrar dados, buscar dados calculados
        await fetchCalculatedData();
      }

      // Atualizar horário da última atualização
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Erro ao buscar dados do painel:', err);
      if (!showLoading) {
        toast({
          title: "Erro na atualização",
          description: "Não foi possível atualizar os dados do painel principal",
          variant: "destructive"
        });
      }
      
      // Em caso de erro, exibir dados zerados
      clearPainel();
    } finally {
      if (showLoading) {
        setIsLoading(false);
      }
    }
  }, [toast, clearPainel]);

  // Buscar dados calculados diretamente das tabelas relacionadas
  const fetchCalculatedData = async () => {
    try {
      // Buscar dados de diferentes tabelas e calcular as métricas
      const [
        manutencoesResult,
        vehiclesParadosResult,
        lineHallResult,
        refuelingResult,
        pneusResult
      ] = await Promise.all([
        supabase.from('manutencoes').select('id, status, data_inicio, data_conclusao'),
        supabase.from('vehicles').select('id, status').eq('status', 'parado'),
        supabase.from('linehall_shopee').select('id, status'),
        supabase.from('refueling').select('id, quantidade_litros, valor_total'),
        supabase.from('pneus').select('id, status')
      ]);

      // Processar dados de manutenções
      const manutencoes = manutencoesResult.data || [];
      const manutencoesPendentes = manutencoes.filter(m => m.status === 'pendente').length;
      
      // Calcular tempo médio de manutenção (em dias)
      let tempoMedio = '0 dias';
      const manutencoesFinalizadas = manutencoes.filter(m => 
        m.status === 'concluido' && m.data_inicio && m.data_conclusao
      );
      
      if (manutencoesFinalizadas.length > 0) {
        const totalDias = manutencoesFinalizadas.reduce((acc, m) => {
          const inicio = new Date(m.data_inicio);
          const conclusao = new Date(m.data_conclusao);
          const dias = Math.ceil((conclusao.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24));
          return acc + dias;
        }, 0);
        
        const media = totalDias / manutencoesFinalizadas.length;
        tempoMedio = `${media.toFixed(1)} dias`;
      }
      
      // Processar dados de veículos parados
      const veiculosParados = vehiclesParadosResult.data?.length || 0;
      
      // Processar dados do LineHall
      const lineHallData = lineHallResult.data || [];
      const lineHallParados = lineHallData.filter(lh => 
        lh.status === 'parado' || lh.status === 'PARADO'
      ).length;
      const viagensConcluidas = lineHallData.filter(lh => 
        lh.status === 'concluido' || lh.status === 'CONCLUIDO'
      ).length;
      const viagensNoShow = lineHallData.filter(lh => 
        lh.status === 'no_show' || lh.status === 'NO_SHOW'
      ).length;
      const viagensCanceladas = lineHallData.filter(lh => 
        lh.status === 'cancelado_cliente' || lh.status === 'CANCELADO_CLIENTE'
      ).length;
      
      // Processar dados de abastecimento
      const refuelingData = refuelingResult.data || [];
      const litrosDieselTotal = refuelingData.reduce((acc, r) => acc + (r.quantidade_litros || 0), 0);
      const gastoTotalCombustivel = refuelingData.reduce((acc, r) => acc + (r.valor_total || 0), 0);
      
      // Processar dados de pneus
      const pneusData = pneusResult.data || [];
      const pneusSubstituidos = pneusData.filter(p => p.status === 'substituido').length;
      
      // Criar objeto com os dados calculados
      const calculatedData: PainelData = {
        id: 0,
        data_referencia: format(new Date(), 'yyyy-MM-dd'),
        manutencoes_pendentes: manutencoesPendentes,
        tempo_medio_manutencao: tempoMedio,
        veiculos_parados: veiculosParados,
        dias_parados_total: 0, // Valor que precisaria de mais cálculos
        linehall_parados: lineHallParados,
        viagens_concluidas: viagensConcluidas,
        viagens_no_show: viagensNoShow,
        viagens_canceladas_cliente: viagensCanceladas,
        litros_diesel_total: litrosDieselTotal,
        gasto_total_combustivel: gastoTotalCombustivel,
        qtd_sinistros: 0, // Dado que não temos diretamente
        qtd_roubos: 0, // Dado que não temos diretamente
        incidentes_seguranca_trabalho: 0, // Dado que não temos diretamente
        movimentacoes_pneus: pneusData.length,
        pneus_substituidos: pneusSubstituidos
      };
      
      setPainel(calculatedData);
      
    } catch (error) {
      console.error('Erro ao calcular dados do painel:', error);
      clearPainel();
    }
  };

  // Configurar atualização automática
  useEffect(() => {
    // Inicializar com dados limpos e carregar dados iniciais
    clearPainel();
    fetchPainelData();
    
    // Configurar atualização automática
    if (autoRefresh) {
      autoRefreshTimerRef.current = setInterval(() => {
        fetchPainelData(false); // Atualizar sem mostrar indicador de carregamento
      }, 45000); // A cada 45 segundos
    }
    
    // Limpeza ao desmontar o componente
    return () => {
      if (autoRefreshTimerRef.current) {
        clearInterval(autoRefreshTimerRef.current);
      }
    };
  }, [fetchPainelData, clearPainel, autoRefresh]);

  // Forçar atualização manual
  const handleManualRefresh = () => {
    fetchPainelData();
    toast({
      title: "Dados atualizados",
      description: "O painel principal foi atualizado."
    });
  };

  return (
    <Card className="col-span-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">
            Painel de Operações
          </CardTitle>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">
              {lastUpdated ? `Atualizado às ${lastUpdated.toLocaleTimeString()}` : ''}
            </span>
            <Button 
              variant="outline" 
              size="icon" 
              className="h-8 w-8" 
              onClick={handleManualRefresh}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
        <CardDescription>
          Visão geral das operações - {painel?.data_referencia ? format(new Date(painel.data_referencia), 'dd/MM/yyyy') : 'Hoje'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Manutenção */}
          <KpiCard 
            label="Manutenções Pendentes" 
            value={painel?.manutencoes_pendentes || 0} 
            color="red" 
            isLoading={isLoading} 
          />
          <KpiCard 
            label="Tempo Médio de Manutenção" 
            value={painel?.tempo_medio_manutencao || '0 dias'} 
            color="blue" 
            isLoading={isLoading} 
          />
          <KpiCard 
            label="Veículos Parados" 
            value={painel?.veiculos_parados || 0} 
            color="amber" 
            isLoading={isLoading} 
          />
          <KpiCard 
            label="Dias Parados (Total)" 
            value={painel?.dias_parados_total || 0} 
            color="amber" 
            isLoading={isLoading} 
          />

          {/* Line Hall */}
          <KpiCard 
            label="Line Hall Parados" 
            value={painel?.linehall_parados || 0} 
            color="amber" 
            isLoading={isLoading} 
          />
          <KpiCard 
            label="Viagens Concluídas" 
            value={painel?.viagens_concluidas || 0} 
            color="green" 
            isLoading={isLoading} 
          />
          <KpiCard 
            label="No Show" 
            value={painel?.viagens_no_show || 0} 
            color="red" 
            isLoading={isLoading} 
          />
          <KpiCard 
            label="Canceladas pelo Cliente" 
            value={painel?.viagens_canceladas_cliente || 0} 
            color="amber" 
            isLoading={isLoading} 
          />

          {/* Combustível */}
          <KpiCard 
            label="Litros Diesel Total" 
            value={`${painel?.litros_diesel_total || 0} L`} 
            color="blue" 
            isLoading={isLoading} 
          />
          <KpiCard 
            label="Gasto Total com Combustível" 
            value={`R$ ${painel?.gasto_total_combustivel?.toFixed(2) || '0.00'}`} 
            color="blue" 
            isLoading={isLoading} 
          />

          {/* Sinistros e Segurança */}
          <KpiCard 
            label="Sinistros" 
            value={painel?.qtd_sinistros || 0} 
            color="red" 
            isLoading={isLoading} 
          />
          <KpiCard 
            label="Incidentes de Segurança" 
            value={painel?.incidentes_seguranca_trabalho || 0} 
            color="red" 
            isLoading={isLoading} 
          />

          {/* Pneus */}
          <KpiCard 
            label="Movimentações de Pneus" 
            value={painel?.movimentacoes_pneus || 0} 
            color="purple" 
            isLoading={isLoading} 
          />
          <KpiCard 
            label="Pneus Substituídos" 
            value={painel?.pneus_substituidos || 0} 
            color="purple" 
            isLoading={isLoading} 
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default PainelPrincipal;