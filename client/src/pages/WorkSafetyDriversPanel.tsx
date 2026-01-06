import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, Search, Users, CheckCircle, XCircle, Building2, 
  Phone, Mail, RefreshCw, Download, Filter, Eye
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Driver {
  id: number;
  nome_completo: string;
  cpf: string;
  base_atuacao: string;
  telefone_motorista: string;
  email: string;
  possui_ear: boolean;
  numero_cnh: string;
  pgr_aprovado: boolean;
  nome_responsavel: string;
  telefone_responsavel: string;
  created_at: string;
  updated_at: string;
}

interface Stats {
  total: number;
  pgrAprovados: number;
  comEar: number;
  totalBases: number;
}

export default function WorkSafetyDriversPanel() {
  const [searchTerm, setSearchTerm] = useState('');
  const [baseFilter, setBaseFilter] = useState('all');
  const [pgrFilter, setPgrFilter] = useState('all');
  const [earFilter, setEarFilter] = useState('all');

  const { data: driversData, isLoading, refetch } = useQuery({
    queryKey: ['/api/work-safety/drivers', baseFilter, pgrFilter, earFilter, searchTerm],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (baseFilter !== 'all') params.append('base', baseFilter);
      if (pgrFilter !== 'all') params.append('pgrStatus', pgrFilter);
      if (earFilter !== 'all') params.append('possuiEar', earFilter);
      if (searchTerm) params.append('search', searchTerm);
      
      const response = await fetch(`/api/work-safety/drivers?${params.toString()}`, {
        credentials: 'include',
      });
      return response.json();
    },
  });

  const { data: basesData } = useQuery({
    queryKey: ['/api/work-safety/bases'],
  });

  const { data: statsData } = useQuery({
    queryKey: ['/api/work-safety/stats'],
    queryFn: async () => {
      const response = await fetch('/api/work-safety/stats', {
        credentials: 'include',
      });
      return response.json();
    },
  });

  const drivers: Driver[] = driversData?.data || [];
  const bases: string[] = basesData?.data || [];
  const stats: Stats = statsData?.data || { total: 0, pgrAprovados: 0, comEar: 0, totalBases: 0 };

  const handleExport = () => {
    const csvContent = [
      ['Nome', 'CPF', 'Base', 'Telefone', 'Email', 'CNH', 'Possui EAR', 'PGR Aprovado', 'Responsável', 'Última Atualização'].join(','),
      ...drivers.map(d => [
        d.nome_completo,
        d.cpf,
        d.base_atuacao,
        d.telefone_motorista,
        d.email,
        d.numero_cnh,
        d.possui_ear ? 'Sim' : 'Não',
        d.pgr_aprovado ? 'Sim' : 'Não',
        d.nome_responsavel,
        format(new Date(d.updated_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `motoristas-seguranca-trabalho-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-600 rounded-lg">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Segurança do Trabalho</h1>
              <p className="text-gray-500">Painel de Motoristas Cadastrados</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => refetch()} data-testid="button-refresh">
              <RefreshCw className="w-4 h-4 mr-2" />
              Atualizar
            </Button>
            <Button onClick={handleExport} data-testid="button-export">
              <Download className="w-4 h-4 mr-2" />
              Exportar CSV
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total de Motoristas</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">PGR Aprovados</p>
                  <p className="text-3xl font-bold text-green-600">{stats.pgrAprovados}</p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Com EAR</p>
                  <p className="text-3xl font-bold text-purple-600">{stats.comEar}</p>
                </div>
                <div className="p-3 bg-purple-100 rounded-full">
                  <Eye className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Bases Ativas</p>
                  <p className="text-3xl font-bold text-orange-600">{stats.totalBases}</p>
                </div>
                <div className="p-3 bg-orange-100 rounded-full">
                  <Building2 className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  className="pl-10"
                  placeholder="Buscar por nome ou CPF..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  data-testid="input-search"
                />
              </div>

              <Select value={baseFilter} onValueChange={setBaseFilter}>
                <SelectTrigger data-testid="select-filter-base">
                  <SelectValue placeholder="Filtrar por Base" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as Bases</SelectItem>
                  {bases.map((base) => (
                    <SelectItem key={base} value={base}>
                      {base}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={pgrFilter} onValueChange={setPgrFilter}>
                <SelectTrigger data-testid="select-filter-pgr">
                  <SelectValue placeholder="Status PGR" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Status</SelectItem>
                  <SelectItem value="approved">PGR Aprovado</SelectItem>
                  <SelectItem value="pending">PGR Pendente</SelectItem>
                </SelectContent>
              </Select>

              <Select value={earFilter} onValueChange={setEarFilter}>
                <SelectTrigger data-testid="select-filter-ear">
                  <SelectValue placeholder="Possui EAR" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="yes">Com EAR</SelectItem>
                  <SelectItem value="no">Sem EAR</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Motoristas Cadastrados
              </span>
              <Badge variant="secondary">{drivers.length} registros</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
              </div>
            ) : drivers.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Nenhum motorista encontrado</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>CPF</TableHead>
                      <TableHead>Base</TableHead>
                      <TableHead>Contato</TableHead>
                      <TableHead>CNH</TableHead>
                      <TableHead>PGR</TableHead>
                      <TableHead>EAR</TableHead>
                      <TableHead>Atualizado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {drivers.map((driver) => (
                      <TableRow key={driver.id} data-testid={`row-driver-${driver.id}`}>
                        <TableCell className="font-medium">{driver.nome_completo}</TableCell>
                        <TableCell className="font-mono text-sm">{driver.cpf}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-blue-50">
                            {driver.base_atuacao}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1 text-sm">
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {driver.telefone_motorista}
                            </span>
                            <span className="flex items-center gap-1 text-gray-500">
                              <Mail className="w-3 h-3" />
                              {driver.email}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm">{driver.numero_cnh}</TableCell>
                        <TableCell>
                          {driver.pgr_aprovado ? (
                            <Badge className="bg-green-100 text-green-800">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Aprovado
                            </Badge>
                          ) : (
                            <Badge className="bg-red-100 text-red-800">
                              <XCircle className="w-3 h-3 mr-1" />
                              Pendente
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {driver.possui_ear ? (
                            <Badge className="bg-purple-100 text-purple-800">Sim</Badge>
                          ) : (
                            <Badge variant="secondary">Não</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">
                          {format(new Date(driver.updated_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
