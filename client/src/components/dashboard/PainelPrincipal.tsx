import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase-client';

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
}

function KpiCard({ label, value, color = 'blue' }: KpiCardProps) {
  return (
    <div className={`p-4 bg-white shadow rounded border-l-4 border-${color}-600`}>
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-xl font-semibold">{value}</p>
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

  return (
    <div className="p-6 space-y-4 bg-gray-100 rounded-lg">
      <h1 className="text-2xl font-bold text-center">Painel Principal - {painel.data_referencia}</h1>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Manutenção */}
        <KpiCard label="Manutenções Pendentes" value={painel.manutencoes_pendentes} color="red" />
        <KpiCard label="Tempo Médio de Manutenção" value={painel.tempo_medio_manutencao} />
        <KpiCard label="Veículos Parados" value={painel.veiculos_parados} />
        <KpiCard label="Dias Parados (Total)" value={painel.dias_parados_total} />

        {/* Line Hall */}
        <KpiCard label="Line Hall Parados" value={painel.linehall_parados} />
        <KpiCard label="Viagens Concluídas" value={painel.viagens_concluidas} />
        <KpiCard label="No Show" value={painel.viagens_no_show} />
        <KpiCard label="Canceladas pelo Cliente" value={painel.viagens_canceladas_cliente} />

        {/* Combustível */}
        <KpiCard label="Litros Diesel Total" value={`${painel.litros_diesel_total} L`} />
        <KpiCard label="Gasto Total com Combustível" value={`R$ ${painel.gasto_total_combustivel}`} />

        {/* Sinistros e Segurança */}
        <KpiCard label="Sinistros" value={painel.qtd_sinistros} />
        <KpiCard label="Roubos" value={painel.qtd_roubos} />
        <KpiCard label="Incidentes de Segurança" value={painel.incidentes_seguranca_trabalho} />

        {/* Pneus */}
        <KpiCard label="Movimentações de Pneus" value={painel.movimentacoes_pneus} />
        <KpiCard label="Pneus Substituídos" value={painel.pneus_substituidos} />
      </div>
    </div>
  );
}