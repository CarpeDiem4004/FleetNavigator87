import React, { useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldCheck, CheckCircle, Clock, LineChart, FileText, Users, UserPlus, ClipboardList, ExternalLink, Copy, Check, Share2, AlertTriangle, AlertCircle, Car, Flame, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function WorkSafetyPage() {
  const [copied, setCopied] = useState(false);
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

  const stats = statsData?.data || { total: 0, pgrAprovados: 0, comEar: 0, totalBases: 0 };
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

              {recentAccidents.length > 0 && (
                <div className="bg-white rounded-lg p-4 mt-4">
                  <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Últimas Ocorrências Registradas
                  </h4>
                  <div className="space-y-2">
                    {recentAccidents.map((accident: any, index: number) => (
                      <div key={accident.id || index} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-full ${
                            accident.tipo_ocorrencia === 'acidente' ? 'bg-red-100' :
                            accident.tipo_ocorrencia === 'quase_acidente' ? 'bg-orange-100' :
                            accident.tipo_ocorrencia === 'danos_materiais' ? 'bg-yellow-100' :
                            'bg-green-100'
                          }`}>
                            {accident.tipo_ocorrencia === 'acidente' ? <AlertTriangle className="h-4 w-4 text-red-600" /> :
                             accident.tipo_ocorrencia === 'quase_acidente' ? <AlertCircle className="h-4 w-4 text-orange-600" /> :
                             accident.tipo_ocorrencia === 'danos_materiais' ? <Car className="h-4 w-4 text-yellow-600" /> :
                             <Flame className="h-4 w-4 text-green-600" />}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{accident.operacao || 'Operação não especificada'}</p>
                            <p className="text-xs text-gray-500">
                              {accident.data_hora ? format(new Date(accident.data_hora), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : 'Data não informada'}
                              {accident.local && ` - ${accident.local}`}
                            </p>
                          </div>
                        </div>
                        <Badge variant={
                          accident.tipo_ocorrencia === 'acidente' ? 'destructive' :
                          accident.tipo_ocorrencia === 'quase_acidente' ? 'secondary' : 'outline'
                        }>
                          {accident.tipo_ocorrencia === 'acidente' ? 'Acidente' :
                           accident.tipo_ocorrencia === 'quase_acidente' ? 'Quase Acidente' :
                           accident.tipo_ocorrencia === 'danos_materiais' ? 'Danos Materiais' : 'Danos Ambientais'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {recentAccidents.length === 0 && (
                <div className="bg-white rounded-lg p-6 mt-4 text-center">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
                  <p className="text-gray-600">Nenhuma ocorrência registrada ainda.</p>
                  <p className="text-sm text-gray-500 mt-1">As ocorrências reportadas aparecerão aqui.</p>
                </div>
              )}

              <div className="mt-4 flex gap-2 justify-center">
                <Link href="/work-safety/portal">
                  <Button variant="outline" className="border-red-300 text-red-700 hover:bg-red-100" data-testid="button-access-portal">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Acessar Portal
                  </Button>
                </Link>
                <Button className="bg-red-600 hover:bg-red-700" data-testid="button-view-all-accidents">
                  <Eye className="mr-2 h-4 w-4" />
                  Ver Todas as Ocorrências
                </Button>
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
    </AppLayout>
  );
}