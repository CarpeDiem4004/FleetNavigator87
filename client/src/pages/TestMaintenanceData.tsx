import React, { useEffect, useState } from 'react';
import { useFetchWithAuth } from '../hooks/useFetchWithAuth';

export default function TestMaintenanceData() {
  const { apiFetch, isReady } = useFetchWithAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isReady) return;
    
    const fetchData = async () => {
      try {
        const response = await apiFetch('/api/operational-dashboard/maintenance');
        const jsonData = await response.json();
        setData(jsonData);
      } catch (error) {
        console.error('Erro ao buscar dados:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isReady, apiFetch]);

  if (loading) return <div>Carregando...</div>;
  if (!data) return <div>Erro ao carregar dados</div>;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Teste de Dados de Manutenção Combinados</h1>
      
      <div className="space-y-4">
        <div className="p-4 border rounded">
          <h2 className="font-semibold">Dados Combinados das Tabelas:</h2>
          <p>- Tabela 'manutencao': 30 registros</p>
          <p>- Tabela 'oficina_murici_manutencoes': 1 registro</p>
        </div>

        <div className="p-4 border rounded bg-green-50">
          <h2 className="font-semibold">Resultado Final:</h2>
          <p>Veículos em manutenção: <strong>{data.vehiclesInMaintenance}</strong></p>
          <p>Custo total: <strong>R$ {data.totalMaintenanceCost?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong></p>
          <p>Tempo médio: <strong>{data.averageMaintenanceDays} dias</strong></p>
          <p>Veículos &gt; 5 dias: <strong>{data.vehiclesOver5Days?.length || 0}</strong></p>
        </div>

        <div className="p-4 border rounded">
          <h2 className="font-semibold">Dados JSON Completos:</h2>
          <pre className="text-xs overflow-auto">{JSON.stringify(data, null, 2)}</pre>
        </div>
      </div>
    </div>
  );
}