import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { 
  getTotalVehicles, 
  getVehiclesInMaintenance, 
  getTireStockStats, 
  getFuelConsumption,
  type TotalVehiclesData,
  type VehiclesInMaintenanceData,
  type TireStockStats,
  type FuelConsumptionData
} from '@/services/dashboardService';
import { format } from 'date-fns';

// Interface para os novos KPIs do dashboard
interface DashboardKPIs {
  vehicles?: TotalVehiclesData;
  maintenance?: VehiclesInMaintenanceData;
  tires?: TireStockStats;
  fuel?: FuelConsumptionData;
}

// Interface original para manter compatibilidade
interface PainelData {
  id: number;
  data_referencia: string;
  manutencoes_pendentes: number;
  tempo_medio_manutencao: string;
  veiculos_parados: number;
  dias_parados_total: number;
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
  changeValue?: number; // Valor de variação em relação ao período anterior
}

function KpiCard({ label, value, color = 'blue', changeValue }: KpiCardProps) {
  // Determinar a cor do indicador de mudança com base no valor
  const changeColor = changeValue === undefined 
    ? '' 
    : changeValue > 0 
      ? 'bg-green-100 text-green-800' 
      : changeValue < 0 
        ? 'bg-red-100 text-red-800' 
        : 'bg-gray-100 text-gray-600';
  
  // Determinar o texto do indicador de mudança (+ ou - e porcentagem)
  const changeText = changeValue === undefined 
    ? '' 
    : `${changeValue > 0 ? '+' : ''}${changeValue}%`;
    
  // Para cards específicos com cores personalizadas
  const cardColorClasses = 
    color === 'red' 
      ? 'border-l-4 border-red-600'
      : color === 'green'
        ? 'border-l-4 border-green-600' 
        : color === 'yellow'
          ? 'border-l-4 border-yellow-600'
          : 'border-l-4 border-blue-600';

  return (
    <div className={`p-5 bg-white shadow-md hover:shadow-lg transition-shadow duration-200 rounded-2xl ${cardColorClasses}`}>
      <p className="text-sm font-medium text-gray-600 mb-1">{label}</p>
      <div className="flex items-end justify-between">
        <p className="text-2xl font-bold text-gray-800">{value}</p>
        {changeValue !== undefined && (
          <span className={`text-xs font-medium px-2 py-1 rounded-full ${changeColor}`}>
            {changeText}
          </span>
        )}
      </div>
    </div>
  );
}

export default function PainelPrincipal() {
  const [painel, setPainel] = useState<PainelData | null>(null);
  const [kpis, setKpis] = useState<DashboardKPIs>({});

  // Consultas React Query para os KPIs atualizados
  const vehiclesQuery = useQuery({
    queryKey: ['/api/dashboard/veiculos/total'],
    queryFn: getTotalVehicles,
    enabled: true,
    staleTime: 5 * 60 * 1000, // 5 minutos
    retry: 1
  });

  const maintenanceQuery = useQuery({
    queryKey: ['/api/dashboard/veiculos/manutencao'],
    queryFn: getVehiclesInMaintenance,
    enabled: true,
    staleTime: 5 * 60 * 1000, // 5 minutos
    retry: 1
  });

  const tiresQuery = useQuery({
    queryKey: ['/api/pneus/estatisticas/estoque'],
    queryFn: getTireStockStats,
    enabled: true,
    staleTime: 5 * 60 * 1000, // 5 minutos
    retry: 1
  });

  const fuelQuery = useQuery({
    queryKey: ['/api/dashboard/abastecimentos/litros'],
    queryFn: getFuelConsumption,
    enabled: true,
    staleTime: 5 * 60 * 1000, // 5 minutos
    retry: 1
  });

  // Estado de carregamento global para todas as consultas
  const isLoading = 
    vehiclesQuery.isLoading || 
    maintenanceQuery.isLoading || 
    tiresQuery.isLoading || 
    fuelQuery.isLoading;

  // Verificar se todas as consultas têm erros
  const allFailed = 
    vehiclesQuery.isError && 
    maintenanceQuery.isError && 
    tiresQuery.isError && 
    fuelQuery.isError;

  // Busca os dados do painel principal da tabela legada no Supabase
  useEffect(() => {
    const fetchPainel = async () => {
      try {
        const { data, error } = await supabase
          .from('painel_principal')
          .select('*')
          .order('data_referencia', { ascending: false })
          .limit(1);

        if (error) {
          console.error('Erro ao buscar painel:', error);
        } else if (data && data.length > 0) {
          setPainel(data[0]);
        } else {
          // Caso não exista dados no painel, buscar da API
          const response = await fetch('/api/painel-principal');
          
          if (response.ok) {
            const apiData = await response.json();
            setPainel(apiData);
          }
        }
      } catch (error) {
        console.error('Erro ao carregar dados do painel:', error);
      }
    };

    fetchPainel();
  }, []);

  // Atualiza os KPIs quando os dados das consultas estiverem disponíveis
  useEffect(() => {
    const newKpis: DashboardKPIs = {};
    
    if (vehiclesQuery.data) {
      newKpis.vehicles = vehiclesQuery.data;
    }
    
    if (maintenanceQuery.data) {
      newKpis.maintenance = maintenanceQuery.data;
    }
    
    if (tiresQuery.data) {
      newKpis.tires = tiresQuery.data;
    }
    
    if (fuelQuery.data) {
      newKpis.fuel = fuelQuery.data;
    }
    
    setKpis(newKpis);
  }, [vehiclesQuery.data, maintenanceQuery.data, tiresQuery.data, fuelQuery.data]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-2">Carregando painel...</span>
      </div>
    );
  }

  // Verifique se temos pelo menos alguns dados para exibir
  if (allFailed && !painel) {
    return (
      <div className="text-center p-6">
        <p className="text-red-500 font-medium mb-2">
          Não foi possível carregar os dados do painel principal.
        </p>
        <p className="text-gray-600">
          Verifique sua conexão com a internet e tente novamente.
        </p>
      </div>
    );
  }

  // Obter a data atual formatada para o período de referência
  const currentDate = new Date();
  const formattedDate = currentDate.toLocaleDateString('pt-BR', {
    year: 'numeric',
    month: 'long'
  });

  // Usar os dados da API para as seções principais
  return (
    <div className="p-8 space-y-8 bg-gray-50 rounded-2xl shadow">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2 text-gray-800 tracking-tight">Dashboard Operacional</h1>
        <p className="text-gray-600 text-lg">Período de referência: {painel?.data_referencia || formattedDate}</p>
      </div>

      {/* Seção de Veículos - CARD 1 */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-700 pl-2 border-l-4 border-blue-500">Frota</h2>
        <div className="grid md:grid-cols-1 lg:grid-cols-1 gap-5">
          <KpiCard 
            label="Total de Veículos Cadastrados" 
            value={kpis.vehicles?.total || 0} 
            color="blue" 
          />
        </div>
      </div>

      {/* Seção de Manutenção - CARD 2 */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-700 pl-2 border-l-4 border-red-500">Manutenção</h2>
        <div className="grid md:grid-cols-1 lg:grid-cols-1 gap-5">
          <KpiCard 
            label="Veículos em Manutenção" 
            value={kpis.maintenance?.total || 0} 
            color="yellow" 
            changeValue={kpis.maintenance?.variation || 0} 
          />
        </div>
      </div>

      {/* Seção de Pneus - CARD 3 */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-700 pl-2 border-l-4 border-green-500">Estoque de Pneus</h2>
        <div className="grid md:grid-cols-2 gap-5">
          <KpiCard 
            label="Quantidade Total" 
            value={kpis.tires?.quantidade || 0}
            color="blue" 
          />
          <KpiCard 
            label="Valor Total" 
            value={`R$ ${(kpis.tires?.valor_total || 0).toLocaleString('pt-BR', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            })}`}
            color="green" 
          />
        </div>
      </div>

      {/* Painel de Controle - Consumo de Combustível */}
      <div className="mb-10 bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-4">
          <h2 className="text-xl font-bold text-white">Painel de Controle</h2>
          <p className="text-sm text-blue-100">Análise de desempenho da frota e indicadores estratégicos</p>
        </div>
        
        <div className="p-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {/* Card 1 - Disponibilidade da Frota */}
            <div className="bg-white rounded-md border border-gray-200 p-3 relative">
              <div className="space-y-2">
                <p className="text-xs text-gray-500 font-medium">Disponibilidade da frota</p>
                <h3 className="text-2xl font-bold text-gray-800">93.2%</h3>
                <p className="text-xs text-gray-500">Mês anterior: 91.5%</p>
              </div>
              <div className="absolute top-3 right-3 text-xs font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-600">
                +1.4%
              </div>
            </div>
            
            {/* Card 2 - Tempo médio de manutenção */}
            <div className="bg-white rounded-md border border-gray-200 p-3 relative">
              <div className="space-y-2">
                <p className="text-xs text-gray-500 font-medium">Tempo médio de manutenção</p>
                <h3 className="text-2xl font-bold text-gray-800">2.5dias</h3>
                <p className="text-xs text-gray-500">Mês anterior: 3.2dias</p>
              </div>
              <div className="absolute top-3 right-3 text-xs font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-600">
                -21.9%
              </div>
            </div>
            
            {/* Card 3 - Custo médio por km */}
            <div className="bg-white rounded-md border border-gray-200 p-3 relative">
              <div className="space-y-2">
                <p className="text-xs text-gray-500 font-medium">Custo médio por km</p>
                <h3 className="text-2xl font-bold text-gray-800">1,70R$</h3>
                <p className="text-xs text-gray-500">Mês anterior: 1.79R$</p>
              </div>
              <div className="absolute top-3 right-3 text-xs font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-600">
                -5.0%
              </div>
            </div>
            
            {/* Card 4 - Eficiência dos abastecimentos */}
            <div className="bg-white rounded-md border border-gray-200 p-3 relative">
              <div className="space-y-2">
                <p className="text-xs text-gray-500 font-medium">Eficiência dos abastecimentos</p>
                <h3 className="text-2xl font-bold text-gray-800">3.6km/l</h3>
                <p className="text-xs text-gray-500">Mês anterior: 2.5km/l</p>
              </div>
              <div className="absolute top-3 right-3 text-xs font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-600">
                +44.0%
              </div>
            </div>
          </div>
          
          <div className="mt-8">
            <div className="flex space-x-3 mb-4">
              <button className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700">
                KPIs
              </button>
              <button className="px-3 py-1.5 bg-gray-100 text-gray-600 text-xs font-medium rounded hover:bg-gray-200">
                Gráficos
              </button>
              <button className="px-3 py-1.5 bg-gray-100 text-gray-600 text-xs font-medium rounded hover:bg-gray-200">
                Todos
              </button>
            </div>
            
            {/* Seção de Disponibilidade e Utilização */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Disponibilidade e Utilização</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white rounded-md border border-gray-200 p-3 relative">
                  <div className="space-y-2">
                    <p className="text-xs text-gray-500 font-medium">Disponibilidade da frota</p>
                    <h3 className="text-2xl font-bold text-gray-800">93.2%</h3>
                    <p className="text-xs text-gray-500">Anterior: 91.5%</p>
                  </div>
                  <div className="absolute top-3 right-3 text-xs text-gray-400">95.0%</div>
                  <div className="absolute top-3 right-12 text-xs font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-600">
                    +1.4%
                  </div>
                </div>
                
                <div className="bg-white rounded-md border border-gray-200 p-3 relative">
                  <div className="space-y-2">
                    <p className="text-xs text-gray-500 font-medium">Dias parados por veículo</p>
                    <h3 className="text-2xl font-bold text-gray-800">4.3dias</h3>
                    <p className="text-xs text-gray-500">Anterior: 5.1dias</p>
                  </div>
                  <div className="absolute top-3 right-3 text-xs text-gray-400">2dias</div>
                  <div className="absolute top-3 right-12 text-xs font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-600">
                    -15.7%
                  </div>
                </div>
              </div>
            </div>
            
            {/* Seção de Consumo de Combustível */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Consumo de Combustível</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white rounded-md border border-gray-200 p-3 relative">
                  <div className="space-y-2">
                    <p className="text-xs text-gray-500 font-medium">Total do Mês</p>
                    <h3 className="text-2xl font-bold text-gray-800">{kpis.fuel?.total || 4850} L</h3>
                    <p className="text-xs text-gray-500">Mês anterior: {kpis.fuel?.previousTotal || 4620} L</p>
                  </div>
                  <div className="absolute top-3 right-3 text-xs text-gray-400">5000L</div>
                  <div className="absolute top-3 right-12 text-xs font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-600">
                    +5.0%
                  </div>
                </div>
                
                <div className="bg-white rounded-md border border-gray-200 p-3 relative">
                  <div className="space-y-2">
                    <p className="text-xs text-gray-500 font-medium">Média Diária</p>
                    <h3 className="text-2xl font-bold text-gray-800">{Math.round((kpis.fuel?.total || 4850) / 30)} L/dia</h3>
                    <p className="text-xs text-gray-500">Meta: {Math.round((kpis.fuel?.total || 4850) / 30) * 0.9} L/dia</p>
                  </div>
                  <div className="absolute top-3 right-3 text-xs text-gray-400">150L</div>
                  <div className="absolute top-3 right-12 text-xs font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-600">
                    -3.2%
                  </div>
                </div>
                
                <div className="bg-white rounded-md border border-gray-200 p-3 relative">
                  <div className="space-y-2">
                    <p className="text-xs text-gray-500 font-medium">Consumo Hoje</p>
                    <h3 className="text-2xl font-bold text-gray-800">{kpis.fuel?.todayConsumption || 132} L</h3>
                    <p className="text-xs text-gray-500">Data: {format(new Date(), 'dd/MM/yyyy')}</p>
                  </div>
                  <div className="absolute top-3 right-3 text-xs text-gray-400">{format(new Date(), 'HH:mm')}</div>
                  <div className="absolute top-3 right-16 text-xs font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-600">
                    Em andamento
                  </div>
                </div>
              </div>
            </div>
            
            {/* Seção de Custos e Eficiência */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Custos e Eficiência</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white rounded-md border border-gray-200 p-3 relative">
                  <div className="space-y-2">
                    <p className="text-xs text-gray-500 font-medium">Custo médio por km</p>
                    <h3 className="text-2xl font-bold text-gray-800">1,70R$</h3>
                    <p className="text-xs text-gray-500">Anterior: 1.79R$</p>
                  </div>
                  <div className="absolute top-3 right-3 text-xs text-gray-400">1.50R$</div>
                  <div className="absolute top-3 right-12 text-xs font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-600">
                    -5.0%
                  </div>
                </div>
                
                <div className="bg-white rounded-md border border-gray-200 p-3 relative">
                  <div className="space-y-2">
                    <p className="text-xs text-gray-500 font-medium">Eficiência dos abastecimentos</p>
                    <h3 className="text-2xl font-bold text-gray-800">3.6km/l</h3>
                    <p className="text-xs text-gray-500">Anterior: 2.5km/l</p>
                  </div>
                  <div className="absolute top-3 right-3 text-xs text-gray-400">3.5km/l</div>
                  <div className="absolute top-3 right-12 text-xs font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-600">
                    +44.0%
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Exibir dados históricos se estiverem disponíveis */}
      {painel && (
        <>
          {/* Seção de Viagens */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-700 pl-2 border-l-4 border-green-500">Operações e Viagens</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              <KpiCard 
                label="Viagens Concluídas" 
                value={painel.viagens_concluidas || 0}
                color="green" 
              />
              <KpiCard 
                label="No Show" 
                value={painel.viagens_no_show || 0} 
              />
              <KpiCard 
                label="Canceladas pelo Cliente" 
                value={painel.viagens_canceladas_cliente || 0}
              />
            </div>
          </div>

          {/* Seção de Segurança */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-700 pl-2 border-l-4 border-red-500">Segurança e Ocorrências</h2>
            <div className="grid md:grid-cols-3 gap-5">
              <KpiCard 
                label="Sinistros" 
                value={painel.qtd_sinistros || 0} 
                color="red"
              />
              <KpiCard 
                label="Roubos" 
                value={painel.qtd_roubos || 0} 
                color="red"
              />
              <KpiCard 
                label="Incidentes de Segurança" 
                value={painel.incidentes_seguranca_trabalho || 0} 
                color="red"
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}