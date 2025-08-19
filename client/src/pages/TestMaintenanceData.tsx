import { useFetchWithAuth } from '../hooks/useFetchWithAuth';

// Definir tipo dos dados da manutenção
interface MaintenanceData {
  vehiclesInMaintenance: number;
  totalMaintenanceCost: number;
  averageMaintenanceDays: number;
  vehiclesOver5Days: Array<any>;
}

export default function TestMaintenanceData() {
  // Usar um token fictício para teste ou pegar do localStorage
  const token = localStorage.getItem('auth_token') || 'test-token';
  
  const { data, error, loading } = useFetchWithAuth<MaintenanceData>(
    '/api/operational-dashboard/maintenance',
    token
  );

  if (loading) return <div>Carregando...</div>;
  if (error) return <div>Erro ao carregar dados: {error.message}</div>;
  if (!data) return <div>Nenhum dado encontrado</div>;

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