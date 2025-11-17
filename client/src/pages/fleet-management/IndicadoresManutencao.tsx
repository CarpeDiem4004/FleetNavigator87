import { useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  FileBarChart, 
  Upload, 
  Package, 
  Wrench, 
  CheckCircle, 
  BarChart3,
  Download,
  FileSpreadsheet
} from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { queryClient, apiRequest } from '@/lib/queryClient';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Upload {
  id: number;
  filename: string;
  upload_date: string;
  total_records: number;
  user_name: string;
  processed_at: string;
}

interface Peca {
  id: number;
  data: string;
  filtro_combustivel: number;
  filtro_ar: number;
  filtro_oleo: number;
  oleo_motor_5w30: number;
  pastilha_freio_dianteira: number;
  filtro_combustivel_master_2023: number;
  pastilha_freio_traseira: number;
  disco_freio_dianteiro: number;
  disco_freio_traseiro: number;
}

interface Dado {
  id: number;
  placa: string;
  modelo: string;
  km: number;
  relato: string;
  data_agenda: string;
  focal: string;
  oficina_debito: string;
  atendimento: string;
}

interface Liberado {
  id: number;
  placa: string;
  modelo: string;
  km: number;
  relato: string;
  data_agenda: string;
  focal: string;
  reparo: string;
  tipo_manutencao: string;
  data_forms: string;
  atendimento: string;
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
}

interface Stats {
  total_em_manutencao: number;
  total_liberado: number;
  veiculos_unicos_manutencao: number;
  veiculos_unicos_liberado: number;
  preventivas: number;
  corretivas: number;
}

export default function IndicadoresManutencao() {
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedUploadId, setSelectedUploadId] = useState<number | null>(null);
  const [filterTipoManutencao, setFilterTipoManutencao] = useState<string>('');
  const [filterPlaca, setFilterPlaca] = useState<string>('');

  // Buscar uploads
  const { data: uploadsData, isLoading: uploadsLoading } = useQuery<{uploads: Upload[]}>({
    queryKey: ['/api/indicadores/uploads'],
  });

  const uploads = uploadsData?.uploads || [];

  // Selecionar o upload mais recente automaticamente
  const latestUpload = uploads.length > 0 ? uploads[0] : null;
  const currentUploadId = selectedUploadId || latestUpload?.id || 0;

  // Buscar estatísticas
  const { data: statsData } = useQuery<{stats: Stats}>({
    queryKey: ['/api/indicadores/stats', { uploadId: currentUploadId }],
    enabled: currentUploadId > 0,
  });

  const stats = statsData?.stats;

  // Buscar dados de peças
  const { data: pecasData } = useQuery<{pecas: Peca[]}>({
    queryKey: ['/api/indicadores/pecas', { uploadId: currentUploadId }],
    enabled: currentUploadId > 0,
  });

  const pecas = pecasData?.pecas || [];

  // Buscar dados em manutenção
  const { data: dadosData } = useQuery<{dados: Dado[]}>({
    queryKey: ['/api/indicadores/dados', { uploadId: currentUploadId }],
    enabled: currentUploadId > 0,
  });

  const dados = dadosData?.dados || [];

  // Buscar histórico liberado
  const { data: liberadoData } = useQuery<{liberado: Liberado[]}>({
    queryKey: ['/api/indicadores/liberado', { uploadId: currentUploadId, tipoManutencao: filterTipoManutencao, placa: filterPlaca }],
    enabled: currentUploadId > 0,
  });

  const liberado = liberadoData?.liberado || [];

  // Mutation para upload
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/indicadores/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao fazer upload');
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Upload realizado!',
        description: data.message,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/indicadores'] });
      setSelectedFile(null);
      setSelectedUploadId(data.uploadId);
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro no upload',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = () => {
    if (selectedFile) {
      uploadMutation.mutate(selectedFile);
    }
  };

  const formatDate = (date: string) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('pt-BR');
  };

  return (
    <AppLayout>
      <div className="container mx-auto py-6">
        <div className="flex flex-col gap-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold flex items-center">
                <FileBarChart className="mr-2 h-8 w-8" />
                Indicadores de Manutenção
              </h1>
              <p className="text-muted-foreground mt-1">
                Análise completa de estoque de peças, manutenções e histórico
              </p>
            </div>
          </div>

          {/* Estatísticas Gerais */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Em Manutenção
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.total_em_manutencao}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stats.veiculos_unicos_manutencao} veículos únicos
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Liberado
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.total_liberado}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stats.veiculos_unicos_liberado} veículos únicos
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Preventivas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{stats.preventivas}</div>
                  <p className="text-xs text-muted-foreground mt-1">Manutenções</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Corretivas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">{stats.corretivas}</div>
                  <p className="text-xs text-muted-foreground mt-1">Manutenções</p>
                </CardContent>
              </Card>
            </div>
          )}

          <Tabs defaultValue="upload" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="upload">
                <Upload className="h-4 w-4 mr-2" />
                Upload
              </TabsTrigger>
              <TabsTrigger value="pecas">
                <Package className="h-4 w-4 mr-2" />
                Peças
              </TabsTrigger>
              <TabsTrigger value="dados">
                <Wrench className="h-4 w-4 mr-2" />
                Em Manutenção
              </TabsTrigger>
              <TabsTrigger value="liberado">
                <CheckCircle className="h-4 w-4 mr-2" />
                Liberado
              </TabsTrigger>
              <TabsTrigger value="dashboards">
                <BarChart3 className="h-4 w-4 mr-2" />
                Dashboards
              </TabsTrigger>
            </TabsList>

            {/* Aba de Upload */}
            <TabsContent value="upload">
              <Card>
                <CardHeader>
                  <CardTitle>Upload de Planilha de Indicadores</CardTitle>
                  <CardDescription>
                    Envie a planilha Excel com os dados de Indicadores de Manutenção
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="file">Arquivo Excel (.xlsx)</Label>
                      <Input
                        id="file"
                        type="file"
                        accept=".xlsx,.xls"
                        onChange={handleFileChange}
                        disabled={uploadMutation.isPending}
                      />
                      {selectedFile && (
                        <p className="text-sm text-muted-foreground">
                          Arquivo selecionado: {selectedFile.name}
                        </p>
                      )}
                    </div>

                    <Button
                      onClick={handleUpload}
                      disabled={!selectedFile || uploadMutation.isPending}
                      className="w-full"
                    >
                      {uploadMutation.isPending ? (
                        <>Processando...</>
                      ) : (
                        <>
                          <Upload className="mr-2 h-4 w-4" />
                          Enviar e Processar
                        </>
                      )}
                    </Button>

                    {uploads.length > 0 && (
                      <div className="mt-6">
                        <h3 className="text-lg font-semibold mb-2">Histórico de Uploads</h3>
                        <div className="space-y-2">
                          {uploads.map((upload) => (
                            <div
                              key={upload.id}
                              className={`p-3 border rounded-lg cursor-pointer hover:bg-accent ${
                                currentUploadId === upload.id ? 'bg-accent border-primary' : ''
                              }`}
                              onClick={() => setSelectedUploadId(upload.id)}
                            >
                              <div className="flex justify-between items-center">
                                <div>
                                  <p className="font-medium">{upload.filename}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {formatDate(upload.upload_date)} - {upload.total_records} registros
                                  </p>
                                </div>
                                {currentUploadId === upload.id && (
                                  <Badge variant="default">Selecionado</Badge>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Aba de Peças */}
            <TabsContent value="pecas">
              <Card>
                <CardHeader>
                  <CardTitle>Controle de Estoque de Peças</CardTitle>
                  <CardDescription>
                    Acompanhamento diário do estoque de peças
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {pecas.length > 0 ? (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Data</TableHead>
                            <TableHead>Filtro Comb.</TableHead>
                            <TableHead>Filtro Ar</TableHead>
                            <TableHead>Filtro Óleo</TableHead>
                            <TableHead>Óleo 5W30</TableHead>
                            <TableHead>Pastilha Freio D/</TableHead>
                            <TableHead>Pastilha Freio T/</TableHead>
                            <TableHead>Disco Freio D/</TableHead>
                            <TableHead>Disco Freio T/</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {pecas.map((peca) => (
                            <TableRow key={peca.id}>
                              <TableCell className="font-medium">
                                {formatDate(peca.data)}
                              </TableCell>
                              <TableCell>{peca.filtro_combustivel || '-'}</TableCell>
                              <TableCell>{peca.filtro_ar || '-'}</TableCell>
                              <TableCell>{peca.filtro_oleo || '-'}</TableCell>
                              <TableCell>{peca.oleo_motor_5w30 || '-'}</TableCell>
                              <TableCell>{peca.pastilha_freio_dianteira || '-'}</TableCell>
                              <TableCell>{peca.pastilha_freio_traseira || '-'}</TableCell>
                              <TableCell>{peca.disco_freio_dianteiro || '-'}</TableCell>
                              <TableCell>{peca.disco_freio_traseiro || '-'}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <FileSpreadsheet className="mx-auto h-12 w-12 text-muted-foreground" />
                      <p className="mt-2 text-muted-foreground">
                        Nenhum dado de peças disponível. Faça o upload de uma planilha.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Aba de Dados (Em Manutenção) */}
            <TabsContent value="dados">
              <Card>
                <CardHeader>
                  <CardTitle>Veículos em Manutenção</CardTitle>
                  <CardDescription>
                    Lista de veículos atualmente em manutenção
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {dados.length > 0 ? (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Placa</TableHead>
                            <TableHead>Modelo</TableHead>
                            <TableHead>KM</TableHead>
                            <TableHead>Relato</TableHead>
                            <TableHead>Data Agenda</TableHead>
                            <TableHead>Focal</TableHead>
                            <TableHead>Atendimento</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {dados.map((dado) => (
                            <TableRow key={dado.id}>
                              <TableCell className="font-medium">{dado.placa}</TableCell>
                              <TableCell>{dado.modelo || '-'}</TableCell>
                              <TableCell>{dado.km ? dado.km.toLocaleString() : '-'}</TableCell>
                              <TableCell className="max-w-xs truncate">{dado.relato || '-'}</TableCell>
                              <TableCell>{formatDate(dado.data_agenda)}</TableCell>
                              <TableCell>{dado.focal || '-'}</TableCell>
                              <TableCell>{dado.atendimento || '-'}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Wrench className="mx-auto h-12 w-12 text-muted-foreground" />
                      <p className="mt-2 text-muted-foreground">
                        Nenhum veículo em manutenção no momento.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Aba de Liberado */}
            <TabsContent value="liberado">
              <Card>
                <CardHeader>
                  <CardTitle>Histórico de Manutenções Liberadas</CardTitle>
                  <CardDescription>
                    Registro completo de manutenções concluídas
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Filtros */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Tipo de Manutenção</Label>
                        <Select value={filterTipoManutencao} onValueChange={setFilterTipoManutencao}>
                          <SelectTrigger>
                            <SelectValue placeholder="Todos os tipos" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">Todos os tipos</SelectItem>
                            <SelectItem value="Preventiva">Preventiva</SelectItem>
                            <SelectItem value="Corretiva">Corretiva</SelectItem>
                            <SelectItem value="Motor">Motor</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Placa</Label>
                        <Input
                          placeholder="Filtrar por placa..."
                          value={filterPlaca}
                          onChange={(e) => setFilterPlaca(e.target.value)}
                        />
                      </div>
                    </div>

                    {liberado.length > 0 ? (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Placa</TableHead>
                              <TableHead>Modelo</TableHead>
                              <TableHead>Operação</TableHead>
                              <TableHead>Tipo</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>D+Manut</TableHead>
                              <TableHead>Oficina</TableHead>
                              <TableHead>Focal</TableHead>
                              <TableHead>Centro Custo</TableHead>
                              <TableHead>Data Agenda</TableHead>
                              <TableHead>Liberado</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {liberado.map((item) => (
                              <TableRow key={item.id}>
                                <TableCell className="font-medium">{item.placa}</TableCell>
                                <TableCell>{item.modelo || '-'}</TableCell>
                                <TableCell>{item.operacao || '-'}</TableCell>
                                <TableCell>
                                  <Badge 
                                    variant={
                                      item.tipo_manutencao?.toLowerCase().includes('preventiva')
                                        ? 'default'
                                        : 'destructive'
                                    }
                                  >
                                    {item.tipo_manutencao || '-'}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <Badge variant={item.status2?.includes('Fora do Prazo') ? 'destructive' : 'outline'}>
                                    {item.status2 || item.status || '-'}
                                  </Badge>
                                </TableCell>
                                <TableCell>{item.d_manut || '-'}</TableCell>
                                <TableCell className="max-w-xs truncate">{item.oficina || '-'}</TableCell>
                                <TableCell>{item.focal || '-'}</TableCell>
                                <TableCell>{item.centro_custo || '-'}</TableCell>
                                <TableCell>{formatDate(item.data_agenda)}</TableCell>
                                <TableCell>{formatDate(item.liberado)}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <CheckCircle className="mx-auto h-12 w-12 text-muted-foreground" />
                        <p className="mt-2 text-muted-foreground">
                          Nenhum registro de manutenção liberada encontrado.
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Aba de Dashboards */}
            <TabsContent value="dashboards">
              <Card>
                <CardHeader>
                  <CardTitle>Dashboards e Análises</CardTitle>
                  <CardDescription>
                    Visualizações gráficas e análises avançadas
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <BarChart3 className="mx-auto h-12 w-12 text-muted-foreground" />
                    <p className="mt-2 text-muted-foreground">
                      Dashboards interativos em desenvolvimento
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AppLayout>
  );
}
