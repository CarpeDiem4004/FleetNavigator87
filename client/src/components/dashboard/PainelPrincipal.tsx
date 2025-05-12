import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { supabase } from '@/lib/supabase-client';
import { 
  getTotalVehicles, 
  getVehiclesInMaintenance, 
  getTireStockStats, 
  getFuelConsumption,
  getPendingWorkshops,
  type TotalVehiclesData,
  type VehiclesInMaintenanceData,
  type TireStockStats,
  type FuelConsumptionData,
  type PendingWorkshopsData
} from '@/services/dashboardService';

// Interface para os novos KPIs do dashboard
interface DashboardKPIs {
  vehicles?: TotalVehiclesData;
  maintenance?: VehiclesInMaintenanceData;
  tires?: TireStockStats;
  fuel?: FuelConsumptionData;
  pendingWorkshops?: PendingWorkshopsData;
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
  
  // Consulta para obter oficinas pendentes de aprovação
  const pendingWorkshopsQuery = useQuery({
    queryKey: ['/api/workshops/pending'],
    queryFn: getPendingWorkshops,
    enabled: true,
    staleTime: 5 * 60 * 1000, // 5 minutos
    retry: 1
  });

  // Estado de carregamento global para todas as consultas
  const isLoading = 
    vehiclesQuery.isLoading || 
    maintenanceQuery.isLoading || 
    tiresQuery.isLoading || 
    fuelQuery.isLoading ||
    pendingWorkshopsQuery.isLoading;

  // Verificar se todas as consultas têm erros
  const allFailed = 
    vehiclesQuery.isError && 
    maintenanceQuery.isError && 
    tiresQuery.isError && 
    fuelQuery.isError &&
    pendingWorkshopsQuery.isError;

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
    
    if (pendingWorkshopsQuery.data) {
      newKpis.pendingWorkshops = pendingWorkshopsQuery.data;
    }
    
    setKpis(newKpis);
  }, [vehiclesQuery.data, maintenanceQuery.data, tiresQuery.data, fuelQuery.data, pendingWorkshopsQuery.data]);

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

      {/* Seção de Combustível - CARD 4 */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-700 pl-2 border-l-4 border-yellow-500">Abastecimento</h2>
        <div className="grid md:grid-cols-1 gap-5">
          <KpiCard 
            label="Litros Abastecidos (Mês Atual)" 
            value={`${kpis.fuel?.total || 0} L`} 
            color="yellow"
            changeValue={kpis.fuel?.variation || 0}
          />
        </div>
      </div>

      {/* Seção de Oficinas Pendentes - CARD 5 */}
      {kpis.pendingWorkshops && kpis.pendingWorkshops.total > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-700 pl-2 border-l-4 border-purple-500">Oficinas</h2>
          <div className="grid md:grid-cols-1 gap-5">
            <Link to="/fleet-management/workshops/approval" className="hover:opacity-95 transition-opacity">
              <KpiCard 
                label="Oficinas Pendentes de Aprovação" 
                value={kpis.pendingWorkshops.total} 
                color="purple"
              />
            </Link>
          </div>
        </div>
      )}

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