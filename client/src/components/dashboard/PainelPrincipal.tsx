import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, BarChart2, Truck, Calendar, ShieldAlert, ArrowDown, ArrowUp, Droplet, TrendingUp, AlertTriangle, Activity } from 'lucide-react';
import { supabase } from '@/lib/supabase-client';
import { useToast } from '@/hooks/use-toast';

// Interface para os dados do painel
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

// Interface para os cards de KPI
interface KpiCardProps {
  label: string;
  value: string | number;
  color?: string;
  isLoading?: boolean;
}

// Componente para exibir um card de KPI
const KpiCard: React.FC<KpiCardProps> = ({ label, value, color = 'text-blue-600', isLoading = false }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
      <div className="text-sm text-gray-500 mb-1">{label}</div>
      <div className={`text-xl font-bold ${color}`}>
        {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : value}
      </div>
    </div>
  );
};

// Componente para exibir um card de tendência (comparação com períodos anteriores)
interface TrendCardProps {
  label: string;
  current: number;
  previous: number;
  isPercentage?: boolean;
  positiveDirection?: 'up' | 'down';
  isLoading?: boolean;
  periodLabel?: string;
}

const TrendCard: React.FC<TrendCardProps> = ({
  label,
  current,
  previous,
  isPercentage = false,
  positiveDirection = 'up',
  isLoading = false,
  periodLabel = 'vs. mês anterior'
}) => {
  // Calcular diferença e percentual
  const difference = current - previous;
  const percentChange = previous !== 0 ? (difference / previous) * 100 : 0;
  
  // Determinar se é positivo ou negativo (para colorização)
  const isPositive = positiveDirection === 'up' ? difference > 0 : difference < 0;
  const displayPercentage = `${percentChange >= 0 ? '+' : ''}${percentChange.toFixed(1)}%`;
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : 
            isPercentage ? `${current}%` : current
          }
        </div>
        
        {!isLoading && (
          <div className="flex items-center mt-1">
            <span className={`inline-flex items-center ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {isPositive ? <ArrowUp className="h-3 w-3 mr-1" /> : <ArrowDown className="h-3 w-3 mr-1" />}
              {displayPercentage}
            </span>
            <span className="text-xs text-gray-500 ml-1">
              {periodLabel}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const PainelPrincipal: React.FC = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [painelData, setPainelData] = useState<PainelData | null>(null);
  const [previousData, setPreviousData] = useState<PainelData | null>(null);
  const [activeTab, setActiveTab] = useState('operacoes');
  
  // Função para carregar dados do painel
  const fetchPainelData = async () => {
    try {
      setIsLoading(true);
      
      // Buscar do backend
      const response = await fetch('/api/painel-principal');
      
      if (!response.ok) {
        throw new Error('Falha ao carregar dados do painel');
      }
      
      const data = await response.json();
      setPainelData(data || mockPainelData);
      
      // Dados do mês anterior seriam buscados aqui
      // Por enquanto, vamos usar dados mockados
      setPreviousData(mockPreviousData);
      
    } catch (error) {
      console.error('Erro ao carregar painel principal:', error);
      // Usar dados mockados em caso de erro
      setPainelData(mockPainelData);
      setPreviousData(mockPreviousData);
      
      toast({
        title: 'Erro ao carregar dados',
        description: 'Utilizando dados de exemplo para visualização.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Carregar dados ao inicializar o componente
  useEffect(() => {
    fetchPainelData();
  }, []);
  
  // Dados mockados para desenvolvimento
  const mockPainelData: PainelData = {
    id: 1,
    data_referencia: new Date().toISOString().split('T')[0],
    manutencoes_pendentes: 12,
    tempo_medio_manutencao: '3.5 dias',
    veiculos_parados: 8,
    dias_parados_total: 24,
    linehall_parados: 3,
    viagens_concluidas: 145,
    viagens_no_show: 5,
    viagens_canceladas_cliente: 7,
    litros_diesel_total: 8500,
    gasto_total_combustivel: 42500,
    qtd_sinistros: 3,
    qtd_roubos: 0,
    incidentes_seguranca_trabalho: 1,
    movimentacoes_pneus: 28,
    pneus_substituidos: 12
  };
  
  const mockPreviousData: PainelData = {
    id: 0,
    data_referencia: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    manutencoes_pendentes: 15,
    tempo_medio_manutencao: '4.2 dias',
    veiculos_parados: 10,
    dias_parados_total: 32,
    linehall_parados: 4,
    viagens_concluidas: 132,
    viagens_no_show: 8,
    viagens_canceladas_cliente: 9,
    litros_diesel_total: 8200,
    gasto_total_combustivel: 40180,
    qtd_sinistros: 2,
    qtd_roubos: 1,
    incidentes_seguranca_trabalho: 2,
    movimentacoes_pneus: 22,
    pneus_substituidos: 10
  };
  
  // Cálculos dos KPIs comparados derivados
  const calculatedData: PainelData = painelData || mockPainelData;
  const previousCalculatedData: PainelData = previousData || mockPreviousData;
  
  // Calcular proporção de noShows vs. concluídas
  const noShowRatio = (calculatedData.viagens_no_show / calculatedData.viagens_concluidas) * 100;
  const previousNoShowRatio = (previousCalculatedData.viagens_no_show / previousCalculatedData.viagens_concluidas) * 100;
  
  // Calcular proporção de cancelamentos vs. concluídas
  const cancelRatio = (calculatedData.viagens_canceladas_cliente / calculatedData.viagens_concluidas) * 100;
  const previousCancelRatio = (previousCalculatedData.viagens_canceladas_cliente / previousCalculatedData.viagens_concluidas) * 100;
  
  // Calcular média de dias parados por veículo
  const avgDaysStopped = calculatedData.dias_parados_total / (calculatedData.veiculos_parados || 1);
  const previousAvgDaysStopped = previousCalculatedData.dias_parados_total / (previousCalculatedData.veiculos_parados || 1);
  
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Painel Principal de Operações</h2>
      
      <Tabs defaultValue="operacoes" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList>
          <TabsTrigger value="operacoes">Operações</TabsTrigger>
          <TabsTrigger value="manutencao">Manutenção</TabsTrigger>
          <TabsTrigger value="combustivel">Combustível</TabsTrigger>
          <TabsTrigger value="seguranca">Segurança</TabsTrigger>
        </TabsList>
        
        {/* Aba de Operações */}
        <TabsContent value="operacoes" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <TrendCard 
              label="Viagens Concluídas"
              current={calculatedData.viagens_concluidas}
              previous={previousCalculatedData.viagens_concluidas}
              isLoading={isLoading}
              positiveDirection="up"
            />
            
            <TrendCard 
              label="No-shows"
              current={noShowRatio}
              previous={previousNoShowRatio}
              isPercentage={true}
              isLoading={isLoading}
              positiveDirection="down"
            />
            
            <TrendCard 
              label="Cancelamentos"
              current={cancelRatio}
              previous={previousCancelRatio}
              isPercentage={true}
              isLoading={isLoading}
              positiveDirection="down"
            />
          </div>
          
          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
            <KpiCard 
              label="Viagens Concluídas" 
              value={calculatedData.viagens_concluidas} 
              color="text-green-600"
              isLoading={isLoading}
            />
            <KpiCard 
              label="Veículos em Operação" 
              value={calculatedData.veiculos_parados} 
              color="text-orange-600"
              isLoading={isLoading}
            />
            <KpiCard 
              label="No-shows" 
              value={calculatedData.viagens_no_show} 
              color="text-red-600"
              isLoading={isLoading}
            />
            <KpiCard 
              label="Cancelamentos" 
              value={calculatedData.viagens_canceladas_cliente} 
              color="text-yellow-600"
              isLoading={isLoading}
            />
          </div>
        </TabsContent>
        
        {/* Aba de Manutenção */}
        <TabsContent value="manutencao" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <TrendCard 
              label="Manutenções Pendentes"
              current={calculatedData.manutencoes_pendentes}
              previous={previousCalculatedData.manutencoes_pendentes}
              isLoading={isLoading}
              positiveDirection="down"
            />
            
            <TrendCard 
              label="Dias Parados (média)"
              current={avgDaysStopped}
              previous={previousAvgDaysStopped}
              isLoading={isLoading}
              positiveDirection="down"
            />
            
            <TrendCard 
              label="Veículos Parados"
              current={calculatedData.veiculos_parados}
              previous={previousCalculatedData.veiculos_parados}
              isLoading={isLoading}
              positiveDirection="down"
            />
          </div>
          
          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
            <KpiCard 
              label="Tempo Médio Manutenção" 
              value={calculatedData.tempo_medio_manutencao} 
              color="text-blue-600"
              isLoading={isLoading}
            />
            <KpiCard 
              label="LineHall Parados" 
              value={calculatedData.linehall_parados} 
              color="text-purple-600"
              isLoading={isLoading}
            />
            <KpiCard 
              label="Movimentações Pneus" 
              value={calculatedData.movimentacoes_pneus} 
              color="text-indigo-600"
              isLoading={isLoading}
            />
            <KpiCard 
              label="Pneus Substituídos" 
              value={calculatedData.pneus_substituidos} 
              color="text-teal-600"
              isLoading={isLoading}
            />
          </div>
        </TabsContent>
        
        {/* Aba de Combustível */}
        <TabsContent value="combustivel" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TrendCard 
              label="Litros de Diesel"
              current={calculatedData.litros_diesel_total}
              previous={previousCalculatedData.litros_diesel_total}
              isLoading={isLoading}
              positiveDirection="down"
            />
            
            <TrendCard 
              label="Gasto com Combustível (R$)"
              current={calculatedData.gasto_total_combustivel}
              previous={previousCalculatedData.gasto_total_combustivel}
              isLoading={isLoading}
              positiveDirection="down"
            />
          </div>
          
          <div className="mt-6 grid grid-cols-2 gap-4">
            <KpiCard 
              label="Consumo Total de Diesel" 
              value={`${calculatedData.litros_diesel_total.toLocaleString()} L`} 
              color="text-emerald-600"
              isLoading={isLoading}
            />
            <KpiCard 
              label="Custo Total Combustível" 
              value={`R$ ${calculatedData.gasto_total_combustivel.toLocaleString()}`} 
              color="text-emerald-800"
              isLoading={isLoading}
            />
          </div>
        </TabsContent>
        
        {/* Aba de Segurança */}
        <TabsContent value="seguranca" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <TrendCard 
              label="Sinistros"
              current={calculatedData.qtd_sinistros}
              previous={previousCalculatedData.qtd_sinistros}
              isLoading={isLoading}
              positiveDirection="down"
            />
            
            <TrendCard 
              label="Roubos/Furtos"
              current={calculatedData.qtd_roubos}
              previous={previousCalculatedData.qtd_roubos}
              isLoading={isLoading}
              positiveDirection="down"
            />
            
            <TrendCard 
              label="Incidentes Segurança"
              current={calculatedData.incidentes_seguranca_trabalho}
              previous={previousCalculatedData.incidentes_seguranca_trabalho}
              isLoading={isLoading}
              positiveDirection="down"
            />
          </div>
          
          <div className="mt-6 grid grid-cols-1 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Índices de Segurança</CardTitle>
                <CardDescription>Visão geral de incidentes no mês atual</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="flex items-center">
                      <AlertTriangle className="h-4 w-4 mr-2 text-yellow-500" />
                      Sinistros
                    </span>
                    <span className="font-semibold">{calculatedData.qtd_sinistros}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="flex items-center">
                      <ShieldAlert className="h-4 w-4 mr-2 text-red-500" />
                      Roubos/Furtos
                    </span>
                    <span className="font-semibold">{calculatedData.qtd_roubos}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="flex items-center">
                      <Activity className="h-4 w-4 mr-2 text-blue-500" />
                      Incidentes Segurança Trabalho
                    </span>
                    <span className="font-semibold">{calculatedData.incidentes_seguranca_trabalho}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PainelPrincipal;