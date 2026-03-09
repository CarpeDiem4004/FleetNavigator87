import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { createSupabaseClient } from '@/lib/supabase-compat';

interface MaintenanceComparison {
  id: number;
  plateFromVehicle?: string;
  plateFromMaintenance?: string;
  vehicleId?: number;
  status: string;
  workshopId?: number;
  source: 'manutencao' | 'oficina_murici_manutencoes';
}

const TestMaintenancePlates: React.FC = () => {
  const [comparisons, setComparisons] = useState<MaintenanceComparison[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const supabase = createSupabaseClient();
      
      // Buscar dados da tabela manutencao com join em vehicles
      const { data: manutencaoData, error: manutencaoError } = await supabase
        .from('manutencao')
        .select(`
          id,
          placa,
          veiculo_id,
          status,
          oficina_id,
          vehicles!left (
            id,
            plate
          )
        `)
        .or('oficina_id.eq.2,oficina_id.eq.6')
        .order('created_at', { ascending: false });

      if (manutencaoError) throw manutencaoError;

      // Buscar dados da tabela oficina_murici_manutencoes
      const { data: muriciData, error: muriciError } = await supabase
        .from('oficina_murici_manutencoes')
        .select('*')
        .order('created_at', { ascending: false });

      if (muriciError) throw muriciError;

      // Processar dados para comparação
      const processedData: MaintenanceComparison[] = [];

      // Processar tabela manutencao
      manutencaoData?.forEach((m: any) => {
        processedData.push({
          id: m.id,
          plateFromVehicle: m.vehicles?.plate,
          plateFromMaintenance: m.placa,
          vehicleId: m.veiculo_id,
          status: m.status,
          workshopId: m.oficina_id,
          source: 'manutencao'
        });
      });

      // Processar tabela oficina_murici_manutencoes
      muriciData?.forEach((m: any) => {
        processedData.push({
          id: m.id,
          plateFromMaintenance: m.placa,
          status: m.status,
          source: 'oficina_murici_manutencoes'
        });
      });

      setComparisons(processedData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const hasInconsistency = (comp: MaintenanceComparison) => {
    if (comp.source === 'manutencao' && comp.plateFromVehicle && comp.plateFromMaintenance) {
      return comp.plateFromVehicle !== comp.plateFromMaintenance;
    }
    return false;
  };

  return (
    <div className="p-8 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Comparação de Placas - Manutenção
            <Button onClick={loadData} disabled={loading} size="sm">
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Recarregar
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Resumo</h3>
              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground">Total de Registros</p>
                    <p className="text-2xl font-bold">{comparisons.length}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground">Inconsistências</p>
                    <p className="text-2xl font-bold text-red-600">
                      {comparisons.filter(hasInconsistency).length}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground">Oficina Murici</p>
                    <p className="text-2xl font-bold">
                      {comparisons.filter(c => c.source === 'oficina_murici_manutencoes').length}
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">Detalhes dos Registros</h3>
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Tabela</TableHead>
                      <TableHead>Placa (vehicles)</TableHead>
                      <TableHead>Placa (manutenção)</TableHead>
                      <TableHead>ID Veículo</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Oficina</TableHead>
                      <TableHead>Inconsistente?</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {comparisons.map((comp) => (
                      <TableRow key={`${comp.source}-${comp.id}`} className={hasInconsistency(comp) ? 'bg-red-50' : ''}>
                        <TableCell>{comp.id}</TableCell>
                        <TableCell className="text-xs">{comp.source}</TableCell>
                        <TableCell className="font-semibold">
                          {comp.plateFromVehicle || '-'}
                        </TableCell>
                        <TableCell className="font-semibold">
                          {comp.plateFromMaintenance || '-'}
                        </TableCell>
                        <TableCell>{comp.vehicleId || '-'}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            comp.status === 'concluida' || comp.status === 'finalizada' 
                              ? 'bg-green-100 text-green-800'
                              : comp.status === 'em_andamento' 
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {comp.status}
                          </span>
                        </TableCell>
                        <TableCell>
                          {comp.workshopId === 2 ? 'Alair' : 
                           comp.workshopId === 6 ? 'Murici' : 
                           comp.source === 'oficina_murici_manutencoes' ? 'Murici' : '-'}
                        </TableCell>
                        <TableCell>
                          {hasInconsistency(comp) && (
                            <span className="text-red-600 font-semibold">SIM</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Explicação:</strong> Esta página compara as placas de veículos entre as tabelas de manutenção.
                <ul className="mt-2 space-y-1 text-sm">
                  <li>• <strong>Placa (vehicles):</strong> Placa obtida da tabela vehicles através do veiculo_id</li>
                  <li>• <strong>Placa (manutenção):</strong> Placa armazenada diretamente na tabela de manutenção</li>
                  <li>• <strong>Inconsistente:</strong> Quando as duas placas não coincidem para o mesmo registro</li>
                </ul>
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TestMaintenancePlates;