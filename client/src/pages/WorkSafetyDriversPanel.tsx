import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Shield, Search, Users, CheckCircle, XCircle, Building2, 
  Phone, Mail, RefreshCw, Download, Filter, Eye, User, FileText, Calendar, Briefcase, MapPin
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Driver {
  id: number;
  nome_completo: string;
  cpf: string;
  rg?: string;
  base_atuacao: string;
  telefone_motorista: string;
  email: string;
  possui_ear: boolean;
  numero_cnh: string;
  categoria_cnh: string;
  data_emissao_cnh: string;
  pgr_aprovado: boolean;
  cadastrado_dds: boolean;
  cadastrado_vec_fleet: boolean;
  categoria_contrato: string;
  milha_atuacao: string;
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

const formatMilha = (milha: string) => {
  const map: Record<string, string> = {
    'line_haul': 'Line Haul',
    'middle_mile': 'Middle Mile',
    'lm': 'LM',
    'fm': 'FM',
    'melione': 'Melione'
  };
  return map[milha] || milha || '-';
};

const formatContrato = (contrato: string) => {
  const map: Record<string, string> = {
    'agregado': 'Agregado',
    'tac': 'TAC',
    'clt': 'CLT'
  };
  return map[contrato] || contrato || '-';
};

export default function WorkSafetyDriversPanel() {
  const [searchTerm, setSearchTerm] = useState('');
  const [baseFilter, setBaseFilter] = useState('all');
  const [pgrFilter, setPgrFilter] = useState('all');
  const [earFilter, setEarFilter] = useState('all');
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);

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

  const { data: basesData } = useQuery<{ success: boolean; data: string[] }>({
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
                      <TableRow 
                        key={driver.id} 
                        data-testid={`row-driver-${driver.id}`}
                        className="cursor-pointer hover:bg-blue-50 transition-colors"
                        onClick={() => setSelectedDriver(driver)}
                      >
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

      <Dialog open={!!selectedDriver} onOpenChange={() => setSelectedDriver(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <User className="w-5 h-5 text-blue-600" />
              Detalhes do Motorista
            </DialogTitle>
          </DialogHeader>
          
          {selectedDriver && (
            <div className="space-y-6 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-gray-500 flex items-center gap-1">
                    <User className="w-4 h-4" /> Nome Completo
                  </p>
                  <p className="font-medium text-lg">{selectedDriver.nome_completo}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-gray-500 flex items-center gap-1">
                      <FileText className="w-4 h-4" /> CPF
                    </p>
                    <p className="font-mono">{selectedDriver.cpf}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-500 flex items-center gap-1">
                      <FileText className="w-4 h-4" /> RG
                    </p>
                    <p className="font-mono">{selectedDriver.rg || '-'}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-gray-500 flex items-center gap-1">
                    <Building2 className="w-4 h-4" /> Base de Atuação
                  </p>
                  <Badge variant="outline" className="bg-blue-50 text-base px-3 py-1">
                    {selectedDriver.base_atuacao}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-gray-500 flex items-center gap-1">
                    <Briefcase className="w-4 h-4" /> Categoria de Contrato
                  </p>
                  <Badge className="bg-orange-100 text-orange-800 text-base px-3 py-1">
                    {formatContrato(selectedDriver.categoria_contrato)}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-gray-500 flex items-center gap-1">
                    <MapPin className="w-4 h-4" /> Milha de Atuação
                  </p>
                  <Badge className="bg-purple-100 text-purple-800 text-base px-3 py-1">
                    {formatMilha(selectedDriver.milha_atuacao)}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-gray-500 flex items-center gap-1">
                    <Eye className="w-4 h-4" /> Possui EAR
                  </p>
                  {selectedDriver.possui_ear ? (
                    <Badge className="bg-green-100 text-green-800 text-base px-3 py-1">Sim</Badge>
                  ) : (
                    <Badge variant="secondary" className="text-base px-3 py-1">Não</Badge>
                  )}
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold text-gray-900 mb-3">Contato</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-gray-500 flex items-center gap-1">
                      <Phone className="w-4 h-4" /> Telefone
                    </p>
                    <p className="font-medium">{selectedDriver.telefone_motorista}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-500 flex items-center gap-1">
                      <Mail className="w-4 h-4" /> E-mail
                    </p>
                    <p className="font-medium">{selectedDriver.email}</p>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold text-gray-900 mb-3">Documentação CNH</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-gray-500">Número CNH</p>
                    <p className="font-mono font-medium">{selectedDriver.numero_cnh}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-500">Categoria</p>
                    <Badge variant="outline" className="text-base">{selectedDriver.categoria_cnh || '-'}</Badge>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-500 flex items-center gap-1">
                      <Calendar className="w-4 h-4" /> Data Emissão
                    </p>
                    <p className="font-medium">
                      {selectedDriver.data_emissao_cnh 
                        ? format(new Date(selectedDriver.data_emissao_cnh), 'dd/MM/yyyy', { locale: ptBR })
                        : '-'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold text-gray-900 mb-3">Status e Cadastros</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-gray-500">PGR</p>
                    {selectedDriver.pgr_aprovado ? (
                      <Badge className="bg-green-100 text-green-800">
                        <CheckCircle className="w-3 h-3 mr-1" /> Aprovado
                      </Badge>
                    ) : (
                      <Badge className="bg-red-100 text-red-800">
                        <XCircle className="w-3 h-3 mr-1" /> Pendente
                      </Badge>
                    )}
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-500">DDS</p>
                    {selectedDriver.cadastrado_dds ? (
                      <Badge className="bg-green-100 text-green-800">Cadastrado</Badge>
                    ) : (
                      <Badge variant="secondary">Não cadastrado</Badge>
                    )}
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-500">VEC Fleet</p>
                    {selectedDriver.cadastrado_vec_fleet ? (
                      <Badge className="bg-green-100 text-green-800">Cadastrado</Badge>
                    ) : (
                      <Badge variant="secondary">Não cadastrado</Badge>
                    )}
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-500">EAR</p>
                    {selectedDriver.possui_ear ? (
                      <Badge className="bg-purple-100 text-purple-800">Possui</Badge>
                    ) : (
                      <Badge variant="secondary">Não possui</Badge>
                    )}
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold text-gray-900 mb-3">Responsável pelo Cadastro</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-gray-500">Nome</p>
                    <p className="font-medium">{selectedDriver.nome_responsavel}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-500 flex items-center gap-1">
                      <Phone className="w-4 h-4" /> Telefone
                    </p>
                    <p className="font-medium">{selectedDriver.telefone_responsavel}</p>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4 text-sm text-gray-500">
                <div className="flex justify-between">
                  <span>Cadastrado em: {format(new Date(selectedDriver.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</span>
                  <span>Atualizado em: {format(new Date(selectedDriver.updated_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
