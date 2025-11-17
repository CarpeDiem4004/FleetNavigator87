import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Calendar, TrendingUp, Wrench, Activity } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface VehicleMaintenanceIndicatorsProps {
  placa: string;
}

interface VeiculoConsolidado {
  veiculo_id: number;
  placa: string;
  modelo: string;
  total_manutencoes: number;
  manutencoes_preventivas: number;
  manutencoes_corretivas: number;
  ultima_manutencao: string;
  ultima_liberacao: string;
  status_manutencao_atual: string;
  oficina_atual: string;
  dias_em_manutencao: number;
  operacao: string;
  centro_custo: string;
}

interface Manutencao {
  id: number;
  placa: string;
  modelo: string;
  relato: string;
  data_agenda: string;
  focal: string;
  reparo: string;
  tipo_manutencao: string;
  aprovacao: string;
  centro_custo: string;
  operacao: string;
  status: string;
  previsao_entrega: string;
  liberado: string;
  d_manut: number;
  status2: string;
  oficina: string;
  lider_base: string;
  mes: string;
  upload_date: string;
}

const formatDate = (date: string | null) => {
  if (!date) return '-';
  try {
    return format(new Date(date), 'dd/MM/yyyy', { locale: ptBR });
  } catch {
    return '-';
  }
};

export function VehicleMaintenanceIndicators({ placa }: VehicleMaintenanceIndicatorsProps) {
  const { data, isLoading, error } = useQuery<{
    success: boolean;
    veiculo: VeiculoConsolidado | null;
    manutencoes: Manutencao[];
    emManutencao: any[];
    totalManutencoes: number;
  }>({
    queryKey: ['/api/indicadores/veiculo', placa],
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !data?.success) {
    return (
      <Card className="border-yellow-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-yellow-500" />
            Indicadores de Manutenção Indisponíveis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Nenhum dado de indicadores de manutenção encontrado para esta placa.
            Os dados serão exibidos após importar o arquivo Excel de indicadores.
          </p>
        </CardContent>
      </Card>
    );
  }

  const { veiculo, manutencoes, totalManutencoes } = data;

  return (
    <div className="space-y-6">
      {/* Resumo Consolidado */}
      {veiculo && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card data-testid="card-total-manutencoes">
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Wrench className="h-4 w-4" />
                Total Manutenções
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{veiculo.total_manutencoes || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {veiculo.manutencoes_preventivas || 0} preventivas · {veiculo.manutencoes_corretivas || 0} corretivas
              </p>
            </CardContent>
          </Card>

          <Card data-testid="card-ultima-manutencao">
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Última Manutenção
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatDate(veiculo.ultima_manutencao)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {veiculo.ultima_liberacao ? `Liberado: ${formatDate(veiculo.ultima_liberacao)}` : '-'}
              </p>
            </CardContent>
          </Card>

          <Card data-testid="card-status-atual">
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Status Atual
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold">
                {veiculo.status_manutencao_atual ? (
                  <Badge variant={veiculo.status_manutencao_atual.includes('Fora') ? 'destructive' : 'default'}>
                    {veiculo.status_manutencao_atual}
                  </Badge>
                ) : (
                  <Badge variant="outline">Em Operação</Badge>
                )}
              </div>
              {veiculo.dias_em_manutencao > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  {veiculo.dias_em_manutencao} dias em manutenção
                </p>
              )}
            </CardContent>
          </Card>

          <Card data-testid="card-oficina-atual">
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Oficina Atual
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm font-medium truncate">
                {veiculo.oficina_atual || 'Nenhuma'}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {veiculo.operacao || '-'}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Histórico Detalhado */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico Completo de Manutenções</CardTitle>
          <CardDescription>
            {totalManutencoes} registro(s) encontrado(s) para a placa {placa}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {manutencoes.length > 0 ? (
            <Tabs defaultValue="todas" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="todas">Todas ({manutencoes.length})</TabsTrigger>
                <TabsTrigger value="preventivas">
                  Preventivas ({manutencoes.filter(m => m.tipo_manutencao?.includes('Preventiva')).length})
                </TabsTrigger>
                <TabsTrigger value="corretivas">
                  Corretivas ({manutencoes.filter(m => m.tipo_manutencao?.includes('Corretiva')).length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="todas" className="mt-4">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data Agenda</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Oficina</TableHead>
                        <TableHead>D+Manut</TableHead>
                        <TableHead>Centro Custo</TableHead>
                        <TableHead>Liberado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {manutencoes.map((m) => (
                        <TableRow key={m.id} data-testid={`row-manutencao-${m.id}`}>
                          <TableCell>{formatDate(m.data_agenda)}</TableCell>
                          <TableCell>
                            <Badge variant={m.tipo_manutencao?.includes('Preventiva') ? 'default' : 'destructive'}>
                              {m.tipo_manutencao || '-'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={m.status2?.includes('Fora') ? 'destructive' : 'outline'}>
                              {m.status2 || m.status || '-'}
                            </Badge>
                          </TableCell>
                          <TableCell className="max-w-xs truncate">{m.oficina || '-'}</TableCell>
                          <TableCell>{m.d_manut || '-'}</TableCell>
                          <TableCell>{m.centro_custo || '-'}</TableCell>
                          <TableCell>{formatDate(m.liberado)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>

              <TabsContent value="preventivas" className="mt-4">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data Agenda</TableHead>
                        <TableHead>Oficina</TableHead>
                        <TableHead>Focal</TableHead>
                        <TableHead>D+Manut</TableHead>
                        <TableHead>Liberado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {manutencoes
                        .filter(m => m.tipo_manutencao?.includes('Preventiva'))
                        .map((m) => (
                          <TableRow key={m.id} data-testid={`row-preventiva-${m.id}`}>
                            <TableCell>{formatDate(m.data_agenda)}</TableCell>
                            <TableCell className="max-w-xs truncate">{m.oficina || '-'}</TableCell>
                            <TableCell>{m.focal || '-'}</TableCell>
                            <TableCell>{m.d_manut || '-'}</TableCell>
                            <TableCell>{formatDate(m.liberado)}</TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>

              <TabsContent value="corretivas" className="mt-4">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data Agenda</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Oficina</TableHead>
                        <TableHead>D+Manut</TableHead>
                        <TableHead>Relato</TableHead>
                        <TableHead>Liberado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {manutencoes
                        .filter(m => m.tipo_manutencao?.includes('Corretiva'))
                        .map((m) => (
                          <TableRow key={m.id} data-testid={`row-corretiva-${m.id}`}>
                            <TableCell>{formatDate(m.data_agenda)}</TableCell>
                            <TableCell>
                              <Badge variant={m.status2?.includes('Fora') ? 'destructive' : 'outline'}>
                                {m.status2 || m.status || '-'}
                              </Badge>
                            </TableCell>
                            <TableCell className="max-w-xs truncate">{m.oficina || '-'}</TableCell>
                            <TableCell>{m.d_manut || '-'}</TableCell>
                            <TableCell className="max-w-md truncate">{m.relato || '-'}</TableCell>
                            <TableCell>{formatDate(m.liberado)}</TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
            </Tabs>
          ) : (
            <div className="text-center py-12">
              <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-2 text-muted-foreground">
                Nenhum histórico de manutenção encontrado para esta placa.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
