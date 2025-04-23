import React, { useEffect, useState } from 'react';
import { getTireActivities, type TireActivity } from '@/services/tireActivityLogService';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ClipboardList, Tool, Truck, Trash2, ArrowDownUp, FileEdit, AlertTriangle } from 'lucide-react';

interface TireActivityHistoryProps {
  tireId: number;
}

export default function TireActivityHistory({ tireId }: TireActivityHistoryProps) {
  const [activities, setActivities] = useState<TireActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadActivities() {
      try {
        setLoading(true);
        setError(null);
        const tireActivities = await getTireActivities(tireId);
        setActivities(tireActivities);
      } catch (err) {
        console.error('Erro ao carregar atividades do pneu:', err);
        setError('Não foi possível carregar o histórico de atividades');
      } finally {
        setLoading(false);
      }
    }

    if (tireId) {
      loadActivities();
    }
  }, [tireId]);

  // Função para obter ícone baseado no tipo de atividade
  const getActivityIcon = (tipo: string) => {
    switch (tipo) {
      case 'montagem':
        return <Truck className="h-5 w-5 mr-2 text-green-500" />;
      case 'remocao':
        return <ArrowDownUp className="h-5 w-5 mr-2 text-amber-500" />;
      case 'descarte':
        return <Trash2 className="h-5 w-5 mr-2 text-red-500" />;
      case 'manutencao':
        return <Tool className="h-5 w-5 mr-2 text-blue-500" />;
      case 'cadastro':
        return <ClipboardList className="h-5 w-5 mr-2 text-purple-500" />;
      case 'atualizacao':
        return <FileEdit className="h-5 w-5 mr-2 text-sky-500" />;
      default:
        return <AlertTriangle className="h-5 w-5 mr-2 text-gray-500" />;
    }
  };

  // Função para obter a cor da badge de status
  const getActivityBadgeVariant = (tipo: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (tipo) {
      case 'montagem':
        return 'default';
      case 'remocao':
        return 'secondary';
      case 'descarte':
        return 'destructive';
      case 'manutencao':
        return 'outline';
      default:
        return 'outline';
    }
  };

  // Formatar data para exibição
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
    } catch (e) {
      return dateString;
    }
  };

  // Agrupar atividades por mês e ano
  const groupActivitiesByMonthYear = () => {
    const groups: Record<string, TireActivity[]> = {};
    
    activities.forEach(activity => {
      if (activity.data) {
        const date = new Date(activity.data);
        const monthYear = format(date, 'MMMM yyyy', { locale: ptBR });
        
        if (!groups[monthYear]) {
          groups[monthYear] = [];
        }
        
        groups[monthYear].push(activity);
      }
    });
    
    return groups;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center text-red-500">
        <AlertTriangle className="h-6 w-6 mx-auto mb-2" />
        <p>{error}</p>
      </div>
    );
  }

  const groupedActivities = groupActivitiesByMonthYear();
  const activityMonths = Object.keys(groupedActivities);

  return (
    <Card className="w-full">
      <CardHeader className="bg-muted/50">
        <CardTitle className="text-xl">
          <ClipboardList className="h-5 w-5 inline-block mr-2 text-primary" />
          Histórico de Atividades do Pneu
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        {activities.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <ClipboardList className="h-10 w-10 mx-auto mb-2 opacity-30" />
            <p>Nenhuma atividade registrada para este pneu</p>
          </div>
        ) : (
          <Tabs defaultValue="timeline" className="w-full">
            <TabsList className="mb-4 w-full">
              <TabsTrigger value="timeline" className="flex-1">Linha do Tempo</TabsTrigger>
              <TabsTrigger value="grouped" className="flex-1">Agrupado por Mês</TabsTrigger>
            </TabsList>
            
            <TabsContent value="timeline" className="space-y-4">
              <div className="space-y-3">
                {activities.map((activity, index) => (
                  <div key={activity.id || index} className="flex items-start p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="mr-3 mt-1">{getActivityIcon(activity.acao)}</div>
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <Badge variant={getActivityBadgeVariant(activity.acao)} className="capitalize">
                          {activity.acao}
                        </Badge>
                        {activity.veiculo_placa && (
                          <Badge variant="outline">
                            <Truck className="h-3 w-3 mr-1" /> {activity.veiculo_placa}
                          </Badge>
                        )}
                        <span className="text-xs text-muted-foreground ml-auto">
                          {activity.data && formatDate(activity.data)}
                        </span>
                      </div>
                      <p className="text-sm">
                        <span className="font-semibold">Responsável:</span> {activity.usuario_nome || 'Não informado'}
                      </p>
                      {activity.detalhes && Object.keys(activity.detalhes).length > 0 && (
                        <div className="mt-2 text-xs text-muted-foreground">
                          <details className="cursor-pointer">
                            <summary className="font-medium">Detalhes adicionais</summary>
                            <pre className="mt-2 whitespace-pre-wrap bg-muted p-2 rounded text-xs">
                              {JSON.stringify(activity.detalhes, null, 2)}
                            </pre>
                          </details>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="grouped">
              <Accordion type="single" collapsible className="w-full">
                {activityMonths.map((month, index) => (
                  <AccordionItem key={index} value={month}>
                    <AccordionTrigger className="text-left">
                      <span className="capitalize">{month}</span>
                      <Badge className="ml-2" variant="outline">{groupedActivities[month].length}</Badge>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-3 pt-2">
                        {groupedActivities[month].map((activity, actIndex) => (
                          <div key={actIndex} className="flex items-start p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                            <div className="mr-3 mt-1">{getActivityIcon(activity.acao)}</div>
                            <div className="flex-1">
                              <div className="flex flex-wrap items-center gap-2 mb-1">
                                <Badge variant={getActivityBadgeVariant(activity.acao)} className="capitalize">
                                  {activity.acao}
                                </Badge>
                                {activity.veiculo_placa && (
                                  <Badge variant="outline">
                                    <Truck className="h-3 w-3 mr-1" /> {activity.veiculo_placa}
                                  </Badge>
                                )}
                                <span className="text-xs text-muted-foreground ml-auto">
                                  {activity.data && formatDate(activity.data)}
                                </span>
                              </div>
                              <p className="text-sm">
                                <span className="font-semibold">Responsável:</span> {activity.usuario_nome || 'Não informado'}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}