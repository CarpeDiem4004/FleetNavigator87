import React, { useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldCheck, CheckCircle, Clock, LineChart, FileText, Users, UserPlus, ClipboardList, ExternalLink, Copy, Check, Share2, AlertTriangle, AlertCircle, Car, Flame, Eye, EyeOff, X, AlertOctagon, Download, Table } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import * as XLSX from 'xlsx';

export default function WorkSafetyPage() {
  const [copied, setCopied] = useState(false);
  const [showOccurrences, setShowOccurrences] = useState(false);
  const [occurrencesModalOpen, setOccurrencesModalOpen] = useState(false);
  const [selectedAccident, setSelectedAccident] = useState<any>(null);
  const { toast } = useToast();
  
  const { data: statsData } = useQuery<{ success: boolean; data: { total: number; pgrAprovados: number; comEar: number; totalBases: number } }>({
    queryKey: ['/api/work-safety/stats'],
  });

  const { data: accidentStatsData } = useQuery<{ success: boolean; data: { 
    total: number; 
    acidentes: number; 
    quase_acidentes: number; 
    danos_materiais: number; 
    danos_ambientais: number;
    com_vitima: number;
    dias_sem_acidente: number;
  }}>({
    queryKey: ['/api/work-safety/accidents/stats'],
  });

  const { data: recentAccidentsData } = useQuery<{ success: boolean; data: any[] }>({
    queryKey: ['/api/work-safety/accidents'],
  });

  const { data: deviationStatsData } = useQuery<{ success: boolean; data: { 
    total: number; 
    recurrentDrivers: number;
    byStatus: { status: string; label: string; count: number }[];
  }}>({
    queryKey: ['/api/work-safety/deviations/stats'],
  });

  const stats = statsData?.data || { total: 0, pgrAprovados: 0, comEar: 0, totalBases: 0 };
  const deviationStats = deviationStatsData?.data || { total: 0, recurrentDrivers: 0, byStatus: [] };
  const accidentStats = accidentStatsData?.data || { 
    total: 0, acidentes: 0, quase_acidentes: 0, danos_materiais: 0, danos_ambientais: 0, com_vitima: 0, dias_sem_acidente: 0 
  };
  const recentAccidents = (recentAccidentsData?.data || []).slice(0, 5);

  const portalLink = typeof window !== 'undefined' 
    ? `${window.location.origin}/work-safety/portal`
    : '/work-safety/portal';

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(portalLink);
      setCopied(true);
      toast({
        title: "Link copiado!",
        description: "O link do portal foi copiado para a área de transferência.",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: "Erro ao copiar",
        description: "Não foi possível copiar o link. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const shareLink = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Portal de Segurança do Trabalho - Murici',
          text: 'Acesse o Portal de Segurança do Trabalho da Murici Transportes',
          url: portalLink,
        });
      } catch (err) {
        copyLink();
      }
    } else {
      copyLink();
    }
  };

  const allAccidents = recentAccidentsData?.data || [];

  const exportAccidentsToExcel = () => {
    if (allAccidents.length === 0) {
      toast({
        title: 'Sem dados para exportar',
        description: 'Não há ocorrências registradas para exportar.',
        variant: 'destructive'
      });
      return;
    }

    const exportData = allAccidents.map((acc: any) => ({
      'Data Ocorrência': acc.data_ocorrencia ? format(new Date(acc.data_ocorrencia), "dd/MM/yyyy", { locale: ptBR }) : 'N/A',
      'Horário': acc.horario_ocorrencia || 'N/A',
      'Tipo Ocorrência': acc.causa_imediata || acc.operacao || 'N/A',
      'Base/Unidade': acc.base_unidade || acc.base || 'N/A',
      'Colaborador': acc.nome_colaborador || 'N/A',
      'Placa Veículo': acc.placa_veiculo || 'N/A',
      'Modelo Veículo': acc.modelo_veiculo || 'N/A',
      'Descrição': acc.descricao_detalhada || acc.descricao || 'N/A',
      'Local': acc.endereco_ocorrencia || acc.local || 'N/A',
      'Houve Vítima': acc.houve_vitima ? 'Sim' : 'Não',
      'Dias Afastado': acc.dias_afastado || 0,
      'Foi Socorrido': acc.foi_socorrido ? 'Sim' : 'Não',
      'Atendimento Médico': acc.atendimento_medico ? 'Sim' : 'Não',
      'Status': acc.status || 'Reportado',
      'Reportado Por': acc.reportado_por || 'N/A',
      'Data Registro': acc.created_at ? format(new Date(acc.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR }) : 'N/A'
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Ocorrências');
    
    const colWidths = [
      { wch: 15 }, { wch: 10 }, { wch: 25 }, { wch: 20 }, { wch: 25 },
      { wch: 12 }, { wch: 20 }, { wch: 40 }, { wch: 30 }, { wch: 12 },
      { wch: 12 }, { wch: 12 }, { wch: 15 }, { wch: 12 }, { wch: 20 }, { wch: 18 }
    ];
    worksheet['!cols'] = colWidths;
    
    const fileName = `ocorrencias_seguranca_${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
    XLSX.writeFile(workbook, fileName);
    
    toast({
      title: 'Excel exportado com sucesso!',
      description: `Arquivo ${fileName} foi baixado.`
    });
  };

  return (
    <AppLayout>
      <div className="container mx-auto py-6">
        <div className="flex flex-col gap-6">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold flex items-center">
                <ShieldCheck className="mr-2 h-8 w-8" />
                Segurança do Trabalho
              </h1>
              <p className="text-muted-foreground mt-1">
                Gestão de segurança ocupacional e treinamentos
              </p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Link href="/work-safety/motoristas">
                <Button variant="outline" data-testid="button-view-drivers">
                  <ClipboardList className="mr-2 h-4 w-4" />
                  Ver Motoristas ({stats.total})
                </Button>
              </Link>
              <Button onClick={shareLink} variant="outline" data-testid="button-share-portal">
                <Share2 className="mr-2 h-4 w-4" />
                Compartilhar Portal
              </Button>
              <Button onClick={copyLink} variant="outline" data-testid="button-copy-portal-link">
                {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
                {copied ? 'Copiado!' : 'Copiar Link'}
              </Button>
              <Button>
                <FileText className="mr-2 h-4 w-4" />
                Novo Relatório de Segurança
              </Button>
            </div>
          </div>

          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-900">
                <Users className="h-5 w-5" />
                Motoristas Cadastrados
              </CardTitle>
              <CardDescription>
                Sistema de cadastro de motoristas para Segurança do Trabalho
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                  <p className="text-3xl font-bold text-blue-600">{stats.total}</p>
                  <p className="text-sm text-gray-600">Total Cadastrados</p>
                </div>
                <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                  <p className="text-3xl font-bold text-green-600">{stats.pgrAprovados}</p>
                  <p className="text-sm text-gray-600">PGR Aprovados</p>
                </div>
                <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                  <p className="text-3xl font-bold text-purple-600">{stats.comEar}</p>
                  <p className="text-sm text-gray-600">Com EAR</p>
                </div>
                <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                  <p className="text-3xl font-bold text-orange-600">{stats.totalBases}</p>
                  <p className="text-sm text-gray-600">Bases Ativas</p>
                </div>
              </div>
              <div className="mt-4 flex gap-2 justify-center">
                <Link href="/work-safety/motoristas">
                  <Button className="bg-blue-600 hover:bg-blue-700" data-testid="button-manage-drivers">
                    <ClipboardList className="mr-2 h-4 w-4" />
                    Gerenciar Motoristas
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-900">
                <AlertTriangle className="h-5 w-5" />
                Acidentes e Incidentes
              </CardTitle>
              <CardDescription>
                Registro e acompanhamento de ocorrências de segurança
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                <div className="text-center p-4 bg-white rounded-lg shadow-sm border-l-4 border-red-500">
                  <p className="text-3xl font-bold text-red-600">{accidentStats.acidentes}</p>
                  <p className="text-sm text-gray-600">Acidentes</p>
                </div>
                <div className="text-center p-4 bg-white rounded-lg shadow-sm border-l-4 border-orange-500">
                  <p className="text-3xl font-bold text-orange-600">{accidentStats.quase_acidentes}</p>
                  <p className="text-sm text-gray-600">Quase Acidentes</p>
                </div>
                <div className="text-center p-4 bg-white rounded-lg shadow-sm border-l-4 border-yellow-500">
                  <p className="text-3xl font-bold text-yellow-600">{accidentStats.danos_materiais}</p>
                  <p className="text-sm text-gray-600">Danos Materiais</p>
                </div>
                <div className="text-center p-4 bg-white rounded-lg shadow-sm border-l-4 border-green-500">
                  <p className="text-3xl font-bold text-green-600">{accidentStats.danos_ambientais}</p>
                  <p className="text-sm text-gray-600">Danos Ambientais</p>
                </div>
                <div className="text-center p-4 bg-white rounded-lg shadow-sm border-l-4 border-purple-500">
                  <p className="text-3xl font-bold text-purple-600">{accidentStats.com_vitima}</p>
                  <p className="text-sm text-gray-600">Com Vítima</p>
                </div>
              </div>

              {recentAccidents.length === 0 && (
                <div className="bg-white rounded-lg p-6 mt-4 text-center">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
                  <p className="text-gray-600">Nenhuma ocorrência registrada ainda.</p>
                  <p className="text-sm text-gray-500 mt-1">As ocorrências reportadas aparecerão aqui.</p>
                </div>
              )}

              {recentAccidents.length > 0 && showOccurrences && (
                <div className="bg-white rounded-lg p-4 mt-4">
                  <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Últimas Ocorrências Registradas
                  </h4>
                  <div className="space-y-2">
                    {recentAccidents.map((accident: any, index: number) => {
                      const isColisao = accident.causa_imediata?.toLowerCase().includes('colisão') || accident.causa_imediata?.toLowerCase().includes('colisao');
                      const isTombamento = accident.causa_imediata?.toLowerCase().includes('tombamento');
                      const isAtropelamento = accident.causa_imediata?.toLowerCase().includes('atropelamento');
                      
                      return (
                        <div 
                          key={accident.id || index} 
                          className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                          onClick={() => setSelectedAccident(accident)}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-full ${
                              isColisao ? 'bg-red-100' :
                              isTombamento ? 'bg-orange-100' :
                              isAtropelamento ? 'bg-yellow-100' :
                              'bg-blue-100'
                            }`}>
                              {isColisao ? <Car className="h-4 w-4 text-red-600" /> :
                               isTombamento ? <AlertTriangle className="h-4 w-4 text-orange-600" /> :
                               isAtropelamento ? <AlertCircle className="h-4 w-4 text-yellow-600" /> :
                               <AlertTriangle className="h-4 w-4 text-blue-600" />}
                            </div>
                            <div>
                              <p className="font-medium text-sm">{accident.causa_imediata || accident.operacao || 'Ocorrência'}</p>
                              <p className="text-xs text-gray-500">
                                {accident.data_ocorrencia 
                                  ? format(new Date(accident.data_ocorrencia), "dd/MM/yyyy", { locale: ptBR })
                                  : accident.created_at 
                                    ? format(new Date(accident.created_at), "dd/MM/yyyy", { locale: ptBR })
                                    : 'Data não informada'
                                }
                                {accident.horario_ocorrencia && ` às ${accident.horario_ocorrencia}`}
                                {accident.base_unidade && ` - ${accident.base_unidade}`}
                              </p>
                              <p className="text-xs text-gray-400 mt-1">
                                Reportado por: {accident.reportado_por || 'Não informado'}
                              </p>
                            </div>
                          </div>
                          <Badge variant={accident.status === 'reportado' ? 'secondary' : 'outline'}>
                            {accident.status === 'reportado' ? 'Reportado' : accident.status || 'Pendente'}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="mt-4 flex gap-2 justify-center">
                <Link href="/work-safety/acidentes">
                  <Button 
                    className="bg-red-600 hover:bg-red-700" 
                    data-testid="button-view-all-accidents"
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    Ver Todas as Ocorrências
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          <Dialog open={occurrencesModalOpen} onOpenChange={setOccurrencesModalOpen}>
            <DialogContent className="max-w-4xl max-h-[80vh]">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  Todas as Ocorrências de Segurança
                </DialogTitle>
                <DialogDescription>
                  Lista completa de acidentes e incidentes registrados no sistema
                </DialogDescription>
              </DialogHeader>
              
              <div className="flex justify-end mb-4">
                <Button 
                  onClick={exportAccidentsToExcel}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Exportar Excel
                </Button>
              </div>

              <ScrollArea className="h-[50vh]">
                {allAccidents.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
                    <p className="text-gray-600">Nenhuma ocorrência registrada.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {allAccidents.map((accident: any, index: number) => {
                      const isColisao = accident.causa_imediata?.toLowerCase().includes('colisão') || accident.causa_imediata?.toLowerCase().includes('colisao');
                      const isTombamento = accident.causa_imediata?.toLowerCase().includes('tombamento');
                      const isAtropelamento = accident.causa_imediata?.toLowerCase().includes('atropelamento');
                      
                      return (
                        <div 
                          key={accident.id || index} 
                          className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-full flex-shrink-0 ${
                                isColisao ? 'bg-red-100' :
                                isTombamento ? 'bg-orange-100' :
                                isAtropelamento ? 'bg-yellow-100' :
                                'bg-blue-100'
                              }`}>
                                {isColisao ? <Car className="h-5 w-5 text-red-600" /> :
                                 isTombamento ? <AlertTriangle className="h-5 w-5 text-orange-600" /> :
                                 isAtropelamento ? <AlertCircle className="h-5 w-5 text-yellow-600" /> :
                                 <AlertTriangle className="h-5 w-5 text-blue-600" />}
                              </div>
                              <div>
                                <p className="font-semibold">{accident.causa_imediata || accident.operacao || 'Ocorrência'}</p>
                                <p className="text-sm text-gray-500">
                                  {accident.data_ocorrencia 
                                    ? format(new Date(accident.data_ocorrencia), "dd/MM/yyyy", { locale: ptBR })
                                    : 'Data não informada'
                                  }
                                  {accident.horario_ocorrencia && ` às ${accident.horario_ocorrencia}`}
                                </p>
                                <div className="flex flex-wrap gap-2 mt-1">
                                  {accident.base_unidade && (
                                    <Badge variant="outline" className="text-xs">{accident.base_unidade}</Badge>
                                  )}
                                  {accident.placa_veiculo && (
                                    <Badge variant="secondary" className="text-xs">{accident.placa_veiculo}</Badge>
                                  )}
                                  {accident.houve_vitima && (
                                    <Badge variant="destructive" className="text-xs">Com Vítima</Badge>
                                  )}
                                </div>
                                <p className="text-xs text-gray-400 mt-2">
                                  Reportado por: {accident.reportado_por || 'Não informado'}
                                </p>
                              </div>
                            </div>
                            <Badge variant={accident.status === 'reportado' ? 'secondary' : 'outline'}>
                              {accident.status === 'reportado' ? 'Reportado' : accident.status || 'Pendente'}
                            </Badge>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
            </DialogContent>
          </Dialog>

          <Card className="border-orange-200 bg-orange-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-900">
                <AlertOctagon className="h-5 w-5" />
                Desvios Operacionais
              </CardTitle>
              <CardDescription>
                Registro e acompanhamento de desvios comportamentais de motoristas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="text-center p-4 bg-white rounded-lg shadow-sm border-l-4 border-orange-500">
                  <p className="text-3xl font-bold text-orange-600">{deviationStats.total}</p>
                  <p className="text-sm text-gray-600">Total de Desvios</p>
                </div>
                <div className="text-center p-4 bg-white rounded-lg shadow-sm border-l-4 border-red-500">
                  <p className="text-3xl font-bold text-red-600">{deviationStats.recurrentDrivers}</p>
                  <p className="text-sm text-gray-600">Motoristas Reincidentes</p>
                </div>
                <div className="text-center p-4 bg-white rounded-lg shadow-sm border-l-4 border-yellow-500">
                  <p className="text-3xl font-bold text-yellow-600">
                    {deviationStats.byStatus.find(s => s.status === 'em_acompanhamento')?.count || 0}
                  </p>
                  <p className="text-sm text-gray-600">Em Acompanhamento</p>
                </div>
                <div className="text-center p-4 bg-white rounded-lg shadow-sm border-l-4 border-green-500">
                  <p className="text-3xl font-bold text-green-600">
                    {deviationStats.byStatus.find(s => s.status === 'tratado')?.count || 0}
                  </p>
                  <p className="text-sm text-gray-600">Tratados</p>
                </div>
              </div>

              <div className="mt-4 flex gap-2 justify-center">
                <Link href="/work-safety/desvios">
                  <Button className="bg-orange-600 hover:bg-orange-700" data-testid="button-manage-deviations">
                    <ClipboardList className="mr-2 h-4 w-4" />
                    Gerenciar Desvios
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-2xl font-bold">98.5%</CardTitle>
                <CardDescription>Índice de Conformidade</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="w-full bg-secondary rounded-full h-2 mt-1">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: '98.5%' }}></div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-2xl font-bold">{accidentStats.dias_sem_acidente > 0 ? accidentStats.dias_sem_acidente : '—'}</CardTitle>
                <CardDescription>Dias sem acidentes</CardDescription>
              </CardHeader>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-2xl font-bold">96%</CardTitle>
                <CardDescription>Treinamentos em Dia</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="w-full bg-secondary rounded-full h-2 mt-1">
                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: '96%' }}></div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-2xl font-bold">3</CardTitle>
                <CardDescription>Inspeções Pendentes</CardDescription>
              </CardHeader>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LineChart className="h-5 w-5 text-primary" />
                  Estatísticas de Segurança
                </CardTitle>
                <CardDescription>
                  Indicadores de desempenho em segurança
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-5">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Índice de Frequência de Acidentes</span>
                      <span className="text-sm font-bold text-green-600">0.8 ↓</span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-3">
                      <div className="bg-green-500 h-3 rounded-full" style={{ width: '10%' }}></div>
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Meta: &lt; 1.0</span>
                      <span>Média do setor: 2.3</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Índice de Gravidade</span>
                      <span className="text-sm font-bold text-green-600">3.2 ↓</span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-3">
                      <div className="bg-green-500 h-3 rounded-full" style={{ width: '15%' }}></div>
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Meta: &lt; 5.0</span>
                      <span>Média do setor: 8.7</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Quase Acidentes Reportados</span>
                      <span className="text-sm font-bold text-amber-600">12 ↑</span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-3">
                      <div className="bg-amber-500 h-3 rounded-full" style={{ width: '75%' }}></div>
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Meta: &gt; 15</span>
                      <span>Período anterior: 8</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  Próximos Treinamentos
                </CardTitle>
                <CardDescription>
                  Capacitações agendadas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    {
                      id: 1,
                      title: 'Direção Defensiva',
                      date: '25/04/2025',
                      participants: 42,
                      status: 'Confirmado'
                    },
                    {
                      id: 2,
                      title: 'Primeiros Socorros',
                      date: '03/05/2025',
                      participants: 28,
                      status: 'Agendado'
                    },
                    {
                      id: 3,
                      title: 'Reciclagem NR-11',
                      date: '12/05/2025',
                      participants: 15,
                      status: 'Aguardando aprovação'
                    }
                  ].map((item) => (
                    <div key={item.id} className="border rounded-lg p-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium">{item.title}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-muted-foreground">{item.date}</span>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Users className="h-3 w-3" />
                              <span>{item.participants}</span>
                            </div>
                          </div>
                        </div>
                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                          item.status === 'Confirmado' 
                            ? 'bg-green-100 text-green-800' 
                            : item.status === 'Agendado'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {item.status}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-primary" />
                Checklist de Conformidade
              </CardTitle>
              <CardDescription>
                Requisitos de segurança aplicáveis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { id: 1, name: 'Documentação de Motoristas', status: 'Conforme', lastUpdate: '10/04/2025', responsável: 'José Silva' },
                  { id: 2, name: 'Extintores e Equipamentos', status: 'Conforme', lastUpdate: '05/04/2025', responsável: 'Ana Souza' },
                  { id: 3, name: 'EPI - Equipamentos de Proteção', status: 'Atenção', lastUpdate: '01/04/2025', responsável: 'Carlos Oliveira' },
                  { id: 4, name: 'Sinalização de Segurança', status: 'Conforme', lastUpdate: '08/04/2025', responsável: 'Marina Lima' },
                  { id: 5, name: 'Treinamentos Obrigatórios', status: 'Conforme', lastUpdate: '11/04/2025', responsável: 'Pedro Santos' },
                  { id: 6, name: 'Inspeções de Veículos', status: 'Não Conforme', lastUpdate: '02/04/2025', responsável: 'Fernanda Costa' }
                ].map((item) => (
                  <div key={item.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <h3 className="font-medium">{item.name}</h3>
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                        item.status === 'Conforme' 
                          ? 'bg-green-100 text-green-800' 
                          : item.status === 'Atenção'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                      }`}>
                        {item.status}
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground">
                      Atualizado em {item.lastUpdate}
                    </div>
                    <div className="mt-1 text-xs">
                      Responsável: {item.responsável}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={!!selectedAccident} onOpenChange={(open) => !open && setSelectedAccident(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="h-5 w-5" />
              Detalhes da Ocorrência
            </DialogTitle>
            <DialogDescription>
              Informações completas do registro de acidente/incidente
            </DialogDescription>
          </DialogHeader>
          
          {selectedAccident && (
            <ScrollArea className="h-[60vh] pr-4">
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500 uppercase font-medium">Tipo de Ocorrência</p>
                    <p className="font-semibold text-red-600">{selectedAccident.causa_imediata || 'Não informado'}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500 uppercase font-medium">Status</p>
                    <Badge variant={selectedAccident.status === 'reportado' ? 'secondary' : 'outline'} className="mt-1">
                      {selectedAccident.status === 'reportado' ? 'Reportado' : selectedAccident.status || 'Pendente'}
                    </Badge>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-semibold text-gray-800 mb-3">Identificação</h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-gray-500">Operação/Projeto</p>
                      <p className="font-medium">{selectedAccident.operacao || 'Não informado'}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Base/Unidade</p>
                      <p className="font-medium">{selectedAccident.base_unidade || 'Não informado'}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Milha</p>
                      <p className="font-medium">{selectedAccident.milha || 'Não informado'}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Regional</p>
                      <p className="font-medium">{selectedAccident.regional || 'Não informado'}</p>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-semibold text-gray-800 mb-3">Data e Local</h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-gray-500">Data da Ocorrência</p>
                      <p className="font-medium">
                        {selectedAccident.data_ocorrencia 
                          ? format(new Date(selectedAccident.data_ocorrencia), "dd/MM/yyyy", { locale: ptBR })
                          : 'Não informada'}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Horário</p>
                      <p className="font-medium">{selectedAccident.horario_ocorrencia || 'Não informado'}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-gray-500">Endereço da Ocorrência</p>
                      <p className="font-medium">{selectedAccident.endereco_ocorrencia || 'Não informado'}</p>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-semibold text-gray-800 mb-3">Reportado por</h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-gray-500">Nome</p>
                      <p className="font-medium">{selectedAccident.reportado_por || 'Não informado'}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">E-mail</p>
                      <p className="font-medium">{selectedAccident.email_corporativo || 'Não informado'}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Telefone/WhatsApp</p>
                      <p className="font-medium">{selectedAccident.telefone_whatsapp || 'Não informado'}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Coordenador da Base</p>
                      <p className="font-medium">{selectedAccident.coordenador_base || 'Não informado'}</p>
                    </div>
                  </div>
                </div>

                {selectedAccident.descricao_detalhada && (
                  <div className="border-t pt-4">
                    <h4 className="font-semibold text-gray-800 mb-3">Descrição Detalhada</h4>
                    <p className="text-sm bg-gray-50 p-3 rounded-lg whitespace-pre-wrap">{selectedAccident.descricao_detalhada}</p>
                  </div>
                )}

                <div className="border-t pt-4">
                  <h4 className="font-semibold text-gray-800 mb-3">Veículo</h4>
                  <div className="grid grid-cols-3 gap-3 text-sm">
                    <div>
                      <p className="text-gray-500">Placa</p>
                      <p className="font-medium">{selectedAccident.placa_veiculo || 'Não informado'}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Modelo</p>
                      <p className="font-medium">{selectedAccident.modelo_veiculo || 'Não informado'}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Ano</p>
                      <p className="font-medium">{selectedAccident.ano_veiculo || 'Não informado'}</p>
                    </div>
                  </div>
                </div>

                {(selectedAccident.nome_colaborador || selectedAccident.id_matricula) && (
                  <div className="border-t pt-4">
                    <h4 className="font-semibold text-gray-800 mb-3">Colaborador Envolvido</h4>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-gray-500">Nome</p>
                        <p className="font-medium">{selectedAccident.nome_colaborador || 'Não informado'}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">ID/Matrícula</p>
                        <p className="font-medium">{selectedAccident.id_matricula || 'Não informado'}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Função</p>
                        <p className="font-medium">{selectedAccident.funcao || 'Não informado'}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Idade</p>
                        <p className="font-medium">{selectedAccident.idade || 'Não informado'}</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="border-t pt-4">
                  <h4 className="font-semibold text-gray-800 mb-3">Informações Adicionais</h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-gray-500">Terceiro Envolvido?</p>
                      <p className="font-medium">{selectedAccident.terceiro_envolvido ? 'Sim' : 'Não'}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Foi Socorrido?</p>
                      <p className="font-medium">{selectedAccident.foi_socorrido || 'Não informado'}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Atendimento Médico</p>
                      <p className="font-medium">{selectedAccident.atendimento_medico || 'Não informado'}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Local Atendimento</p>
                      <p className="font-medium">{selectedAccident.local_atendimento || 'Não informado'}</p>
                    </div>
                  </div>
                </div>

                {selectedAccident.protocolo_bo && (
                  <div className="border-t pt-4">
                    <h4 className="font-semibold text-gray-800 mb-3">Registro Policial</h4>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-gray-500">Registro Policial</p>
                        <p className="font-medium">{selectedAccident.registro_policial || 'Não'}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Protocolo B.O.</p>
                        <p className="font-medium">{selectedAccident.protocolo_bo || 'Não informado'}</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="border-t pt-4 text-xs text-gray-400">
                  <p>Registrado em: {selectedAccident.created_at ? format(new Date(selectedAccident.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : 'Data não disponível'}</p>
                </div>
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}