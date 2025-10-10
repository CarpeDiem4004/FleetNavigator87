import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { FileText, Link2, Plus, ExternalLink, Copy, Download } from 'lucide-react';

interface Project {
  id: number;
  name: string;
}

interface Base {
  id: number;
  basename: string;
  project_id: number;
}

interface PostPaidToken {
  id: number;
  token: string;
  project_id: number;
  base_id: number;
  project_name: string;
  base_name: string;
  created_at: string;
  expires_at: string;
  is_active: boolean;
  description: string;
}

interface PostPaidRecord {
  id: number;
  driver_name: string;
  driver_rg: string;
  driver_phone: string;
  vehicle_plate: string;
  fuel_type: string;
  price_per_liter: number;
  liters: number;
  total_amount: number;
  period: string;
  manager_name: string;
  project_name: string;
  base_name: string;
  created_at: string;
  status: string;
}

export default function PostPaidManagement() {
  const { toast } = useToast();
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [selectedBase, setSelectedBase] = useState<string>('');

  // Buscar projetos
  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ['/api/projects'],
  });

  // Buscar bases filtradas por projeto
  const { data: bases = [] } = useQuery<Base[]>({
    queryKey: ['/api/bases', selectedProject],
    enabled: !!selectedProject,
  });

  // Buscar tokens ativos
  const { data: tokens = [] } = useQuery<PostPaidToken[]>({
    queryKey: ['/api/postpaid/tokens'],
  });

  // Buscar registros de abastecimento
  const { data: records = [] } = useQuery<PostPaidRecord[]>({
    queryKey: ['/api/postpaid/records'],
  });

  // Mutation para criar novo token
  const createTokenMutation = useMutation({
    mutationFn: async () => {
      if (!selectedProject || !selectedBase) {
        throw new Error('Selecione projeto e base');
      }

      const response = await apiRequest('POST', '/api/postpaid/tokens', {
        project_id: parseInt(selectedProject),
        base_id: parseInt(selectedBase),
      });

      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/postpaid/tokens'] });
      toast({
        title: 'Token criado com sucesso!',
        description: 'O link de acesso foi gerado.',
      });
      setSelectedProject('');
      setSelectedBase('');
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao criar token',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const copyToClipboard = (token: string) => {
    const url = `${window.location.origin}/postpaid/${token}`;
    navigator.clipboard.writeText(url);
    toast({
      title: 'Link copiado!',
      description: 'O link foi copiado para a área de transferência.',
    });
  };

  const openInNewTab = (token: string) => {
    const url = `${window.location.origin}/postpaid/${token}`;
    window.open(url, '_blank');
  };

  // Função para exportar relatório
  const exportReport = async () => {
    try {
      const response = await fetch('/api/postpaid/export');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `relatorio-pospago-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast({
        title: 'Relatório exportado!',
        description: 'O arquivo foi baixado com sucesso.',
      });
    } catch (error) {
      toast({
        title: 'Erro ao exportar',
        description: 'Não foi possível gerar o relatório.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Sistema Pós-Pago</h1>
            <p className="text-gray-600 mt-1">Gestão de abastecimentos e faturamento</p>
          </div>
          <Button
            onClick={exportReport}
            className="bg-indigo-600 hover:bg-indigo-700"
            data-testid="button-export-report"
          >
            <Download className="w-4 h-4 mr-2" />
            Exportar Relatório
          </Button>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-white shadow-sm">
            <TabsTrigger value="dashboard" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white">
              <FileText className="w-4 h-4 mr-2" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="abastecimentos" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white">
              Abastecimentos
            </TabsTrigger>
            <TabsTrigger value="tokens" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white">
              <Link2 className="w-4 h-4 mr-2" />
              Links/Tokens
            </TabsTrigger>
            <TabsTrigger value="postos" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white">
              Postos
            </TabsTrigger>
          </TabsList>

          {/* Dashboard */}
          <TabsContent value="dashboard">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="p-6">
                <h3 className="text-sm font-medium text-gray-600">Total de Registros</h3>
                <p className="text-3xl font-bold text-gray-900 mt-2">{records.length}</p>
              </Card>
              <Card className="p-6">
                <h3 className="text-sm font-medium text-gray-600">Valor Total Pendente</h3>
                <p className="text-3xl font-bold text-orange-600 mt-2">
                  R$ {records
                    .filter(r => r.status === 'pendente')
                    .reduce((sum, r) => sum + r.total_amount, 0)
                    .toFixed(2)}
                </p>
              </Card>
              <Card className="p-6">
                <h3 className="text-sm font-medium text-gray-600">Links Ativos</h3>
                <p className="text-3xl font-bold text-green-600 mt-2">
                  {tokens.filter(t => t.is_active).length}
                </p>
              </Card>
            </div>
          </TabsContent>

          {/* Abastecimentos */}
          <TabsContent value="abastecimentos">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Registros de Abastecimento</h2>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data/Hora</TableHead>
                      <TableHead>Motorista</TableHead>
                      <TableHead>Placa</TableHead>
                      <TableHead>Combustível</TableHead>
                      <TableHead>Litros</TableHead>
                      <TableHead>Valor Total</TableHead>
                      <TableHead>Projeto/Base</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {records.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell className="whitespace-nowrap">
                          {new Date(record.created_at).toLocaleString('pt-BR')}
                        </TableCell>
                        <TableCell>{record.driver_name}</TableCell>
                        <TableCell className="font-mono">{record.vehicle_plate}</TableCell>
                        <TableCell>{record.fuel_type}</TableCell>
                        <TableCell>{record.liters.toFixed(2)}L</TableCell>
                        <TableCell className="font-semibold">
                          R$ {record.total_amount.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div className="font-medium">{record.project_name}</div>
                            <div className="text-gray-500">{record.base_name}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              record.status === 'pago'
                                ? 'default'
                                : record.status === 'aprovado'
                                ? 'secondary'
                                : 'outline'
                            }
                          >
                            {record.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </TabsContent>

          {/* Links/Tokens */}
          <TabsContent value="tokens">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-6">Criar Novo Token</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div>
                  <Label>Selecione o projeto primeiro</Label>
                  <Select value={selectedProject} onValueChange={setSelectedProject}>
                    <SelectTrigger className="bg-blue-50" data-testid="select-project">
                      <SelectValue placeholder="Selecione o projeto primeiro" />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map((project) => (
                        <SelectItem key={project.id} value={project.id.toString()}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Selecione um projeto primeiro</Label>
                  <Select
                    value={selectedBase}
                    onValueChange={setSelectedBase}
                    disabled={!selectedProject}
                  >
                    <SelectTrigger className="bg-blue-50" data-testid="select-base">
                      <SelectValue placeholder="Selecione um projeto primeiro" />
                    </SelectTrigger>
                    <SelectContent>
                      {bases.map((base) => (
                        <SelectItem key={base.id} value={base.id.toString()}>
                          {base.basename}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-end">
                  <Button
                    onClick={() => createTokenMutation.mutate()}
                    disabled={!selectedProject || !selectedBase || createTokenMutation.isPending}
                    className="w-full bg-indigo-600 hover:bg-indigo-700"
                    data-testid="button-create-token"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Criar Token
                  </Button>
                </div>
              </div>

              <div className="mt-8">
                <h3 className="text-lg font-semibold mb-4">Tokens Ativos</h3>
                
                {tokens.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Link2 className="w-16 h-16 mx-auto mb-4 opacity-30" />
                    <p>Nenhum token encontrado</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {tokens.map((token) => (
                      <Card key={token.id} className="p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">
                              {token.project_name} - {token.base_name}
                            </div>
                            <div className="text-sm text-gray-500 mt-1 font-mono">
                              {window.location.origin}/postpaid/{token.token}
                            </div>
                            <div className="text-xs text-gray-400 mt-1">
                              Criado em {new Date(token.created_at).toLocaleString('pt-BR')}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => copyToClipboard(token.token)}
                              data-testid={`button-copy-${token.id}`}
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openInNewTab(token.token)}
                              data-testid={`button-open-${token.id}`}
                            >
                              <ExternalLink className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          </TabsContent>

          {/* Postos */}
          <TabsContent value="postos">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Gerenciamento de Postos</h2>
              <p className="text-gray-600">Em desenvolvimento...</p>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
