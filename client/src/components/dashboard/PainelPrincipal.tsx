import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase-client';

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
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPainel = async () => {
      setIsLoading(true);
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
      } finally {
        setIsLoading(false);
      }
    };

    fetchPainel();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-2">Carregando painel...</span>
      </div>
    );
  }

  if (!painel) {
    return (
      <div className="text-center p-6">
        Não foi possível carregar os dados do painel principal.
      </div>
    );
  }

  // Criar dados de exemplo para as variações percentuais
  // Em um ambiente real, esses dados viriam do backend comparando períodos
  const variations = {
    manutencoes: -5,  // 5% menos manutenções pendentes (melhoria)
    tempo_medio: -8,  // 8% menos tempo médio (melhoria)
    veiculos_parados: 3,  // 3% mais veículos parados (piora)
    viagens: 12,      // 12% mais viagens (melhoria)
    no_show: -10,     // 10% menos no-shows (melhoria)
    canceladas: -6,   // 6% menos cancelamentos (melhoria)
    diesel: 4,        // 4% mais diesel (neutro)
    gasto: 8,         // 8% mais gasto (piora)
    sinistros: -15,   // 15% menos sinistros (melhoria)
    pneus: 7          // 7% mais movimentações (neutro)
  };

  return (
    <div className="p-8 space-y-8 bg-gray-50 rounded-2xl shadow">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2 text-gray-800 tracking-tight">Dashboard Operacional</h1>
        <p className="text-gray-600 text-lg">Período de referência: {painel.data_referencia}</p>
      </div>

      {/* Seção de Manutenção */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-700 pl-2 border-l-4 border-blue-500">Manutenção e Veículos</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
          <KpiCard 
            label="Manutenções Pendentes" 
            value={painel.manutencoes_pendentes} 
            color="red" 
            changeValue={variations.manutencoes} 
          />
          <KpiCard 
            label="Tempo Médio de Manutenção" 
            value={painel.tempo_medio_manutencao} 
            changeValue={variations.tempo_medio} 
          />
          <KpiCard 
            label="Veículos Parados" 
            value={painel.veiculos_parados} 
            color="yellow"
            changeValue={variations.veiculos_parados} 
          />
          <KpiCard 
            label="Dias Parados (Total)" 
            value={painel.dias_parados_total} 
          />
        </div>
      </div>

      {/* Seção de Viagens */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-700 pl-2 border-l-4 border-green-500">Operações e Viagens</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          <KpiCard 
            label="Viagens Concluídas" 
            value={painel.viagens_concluidas}
            color="green" 
            changeValue={variations.viagens}
          />
          <KpiCard 
            label="No Show" 
            value={painel.viagens_no_show} 
            changeValue={variations.no_show}
          />
          <KpiCard 
            label="Canceladas pelo Cliente" 
            value={painel.viagens_canceladas_cliente}
            changeValue={variations.canceladas} 
          />
        </div>
      </div>

      {/* Seção de Combustível */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-700 pl-2 border-l-4 border-yellow-500">Abastecimento</h2>
        <div className="grid md:grid-cols-2 gap-5">
          <KpiCard 
            label="Litros Diesel Total" 
            value={`${painel.litros_diesel_total} L`} 
            changeValue={variations.diesel}
          />
          <KpiCard 
            label="Gasto Total com Combustível" 
            value={`R$ ${painel.gasto_total_combustivel}`}
            changeValue={variations.gasto} 
          />
        </div>
      </div>

      {/* Seção de Segurança */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-700 pl-2 border-l-4 border-red-500">Segurança e Ocorrências</h2>
        <div className="grid md:grid-cols-3 gap-5">
          <KpiCard 
            label="Sinistros" 
            value={painel.qtd_sinistros} 
            color="red"
            changeValue={variations.sinistros}
          />
          <KpiCard 
            label="Roubos" 
            value={painel.qtd_roubos} 
            color="red"
          />
          <KpiCard 
            label="Incidentes de Segurança" 
            value={painel.incidentes_seguranca_trabalho} 
            color="red"
          />
        </div>
      </div>

      {/* Seção de Pneus */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-700 pl-2 border-l-4 border-blue-500">Gestão de Pneus</h2>
        <div className="grid md:grid-cols-2 gap-5">
          <KpiCard 
            label="Movimentações de Pneus" 
            value={painel.movimentacoes_pneus}
            changeValue={variations.pneus} 
          />
          <KpiCard 
            label="Pneus Substituídos" 
            value={painel.pneus_substituidos} 
          />
        </div>
      </div>
    </div>
  );
}