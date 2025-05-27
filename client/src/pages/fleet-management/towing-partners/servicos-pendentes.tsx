import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { formatDateShortBrasilia } from '@/lib/date-utils';

// Componentes UI
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import PageHeader from '@/components/layout/PageHeader';
import ServicoPrestadoCard from '@/components/ServicoPrestadoCard';
import AppLayout from '@/components/AppLayout';
import { SincronizarServicosButton } from '@/components/SincronizarServicosButton';

// Ícones
import { Search, AlertCircle, FileText, CheckCircle, XCircle, RefreshCw, Check, X, Eye, Trash2 } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { formatDateTimeBrasilia, formatDateBrasilia } from '@/lib/date-utils';

// Tipos
interface Parceiro {
  id: number;
  nome: string;
  cidade: string;
  estado: string;
  avaliacao: number;
}

interface ServicoPrestado {
  id: number;
  parceiro: Parceiro;
  placa: string;
  veiculo: string;
  tipo_servico: string;
  valor: number;
  data_servico: string;
  status: "pendente" | "aprovado" | "rejeitado";
  observacoes?: string;
  local_atendimento?: string;
  km_reboque?: number;
  fotos_servico?: string[];
}

export default function ServicosPendentesPage() {
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'todos' | 'pendente' | 'aprovado' | 'rejeitado'>('todos');
  const [loadingServico, setLoadingServico] = useState<number | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedServico, setSelectedServico] = useState<ServicoPrestado | null>(null);

  // Consulta para obter serviços prestados
  const { data: servicos, isLoading, error } = useQuery<ServicoPrestado[]>({
    queryKey: ['/api/towing/servicos'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/towing/servicos', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Erro ao buscar serviços');
        }
        
        return await response.json();
      } catch (error: any) {
        toast({
          title: "Erro ao carregar serviços",
          description: error.message || "Não foi possível carregar os serviços prestados.",
          variant: "destructive"
        });
        return [];
      }
    }
  });

  // Aprovar serviço
  const aprovarServicoMutation = useMutation({
    mutationFn: async (id: number) => {
      setLoadingServico(id);
      
      const response = await fetch(`/api/towing/servicos/${id}/aprovar`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao aprovar serviço');
      }
      
      return id;
    },
    onSuccess: (id) => {
      toast({
        title: "Serviço aprovado",
        description: `O serviço #${id} foi aprovado com sucesso.`,
        variant: "default"
      });
      
      // Invalidar cache para recarregar os dados
      queryClient.invalidateQueries({ queryKey: ['/api/towing/servicos'] });
      
      setLoadingServico(null);
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao aprovar serviço",
        description: error.message || "Ocorreu um erro ao aprovar o serviço. Tente novamente.",
        variant: "destructive"
      });
      setLoadingServico(null);
    }
  });

  // Rejeitar serviço
  const rejeitarServicoMutation = useMutation({
    mutationFn: async (id: number) => {
      setLoadingServico(id);
      
      const response = await fetch(`/api/towing/servicos/${id}/rejeitar`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao rejeitar serviço');
      }
      
      return id;
    },
    onSuccess: (id) => {
      toast({
        title: "Serviço rejeitado",
        description: `O serviço #${id} foi rejeitado.`,
        variant: "default"
      });
      
      // Invalidar cache para recarregar os dados
      queryClient.invalidateQueries({ queryKey: ['/api/towing/servicos'] });
      
      setLoadingServico(null);
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao rejeitar serviço",
        description: error.message || "Ocorreu um erro ao rejeitar o serviço. Tente novamente.",
        variant: "destructive"
      });
      setLoadingServico(null);
    }
  });

  // Mutation para excluir serviço
  const deleteServicoMutation = useMutation({
    mutationFn: async (id: number) => {
      setLoadingServico(id);
      const response = await apiRequest('DELETE', `/api/towing/servicos/${id}`);
      return response;
    },
    onSuccess: (_, id) => {
      toast({
        title: "Serviço excluído",
        description: `O serviço #${id} foi excluído com sucesso.`,
        variant: "default"
      });
      
      // Invalidar cache para recarregar os dados
      queryClient.invalidateQueries({ queryKey: ['/api/towing/servicos'] });
      
      setLoadingServico(null);
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao excluir serviço",
        description: error.message || "Ocorreu um erro ao excluir o serviço. Tente novamente.",
        variant: "destructive"
      });
      setLoadingServico(null);
    }
  });

  // Filtrar serviços com base na pesquisa e na aba ativa
  const filteredServicos = servicos
    ? servicos.filter(servico => {
        // Filtro de pesquisa
        const matchesSearch = 
          servico.parceiro.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
          servico.placa.toLowerCase().includes(searchTerm.toLowerCase()) ||
          servico.veiculo.toLowerCase().includes(searchTerm.toLowerCase()) ||
          servico.tipo_servico.toLowerCase().includes(searchTerm.toLowerCase());
        
        // Filtro de status
        const matchesStatus = 
          activeTab === 'todos' || 
          servico.status === activeTab;
        
        return matchesSearch && matchesStatus;
      })
    : [];

  // Verificar se há erro na busca
  if (error) {
    console.error('Erro ao buscar serviços prestados:', error);
  }

  // Componentes de carregamento para diferentes partes da UI
  const renderSkeletonCards = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <Card key={i} className="overflow-hidden">
          <CardHeader className="pb-2">
            <Skeleton className="h-6 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </CardContent>
          <div className="px-6 py-4 border-t flex justify-between">
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-9 w-24" />
          </div>
        </Card>
      ))}
    </div>
  );

  return (
    <AppLayout>
      <div className="container px-4 py-6 max-w-7xl mx-auto">
        <PageHeader
          title="Serviços Prestados por Parceiros"
          description="Gerencie e aprove os serviços prestados pelos parceiros de guincho"
          actions={
            <SincronizarServicosButton 
              onSuccess={() => {
                queryClient.invalidateQueries({ queryKey: ['/api/towing/servicos'] });
                toast({
                  title: "Serviços sincronizados",
                  description: "Os serviços de guincho foram atualizados no sistema",
                });
              }}
            >
              Sincronizar Serviços
            </SincronizarServicosButton>
          }
        />

        <div className="flex flex-col md:flex-row justify-between gap-4 mb-6 items-start md:items-center">
          <div className="relative max-w-md">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por parceiro, placa ou tipo de serviço..."
              className="w-full pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigate('/fleet-management/towing-partners')}
              className="gap-2"
            >
              <FileText size={16} />
              Voltar para Parceiros
            </Button>
          </div>
        </div>
        
        {/* Abas para filtrar por status */}
        <Tabs defaultValue="todos" value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
          <TabsList>
            <TabsTrigger value="todos">Todos</TabsTrigger>
            <TabsTrigger value="pendente">Pendentes</TabsTrigger>
            <TabsTrigger value="aprovado">Aprovados</TabsTrigger>
            <TabsTrigger value="rejeitado">Rejeitados</TabsTrigger>
          </TabsList>
          
          <TabsContent value={activeTab} className="mt-6">
            {isLoading ? (
              renderSkeletonCards()
            ) : filteredServicos.length > 0 ? (
              <div className="w-full overflow-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="py-3 px-4 text-left font-medium">Parceiro</th>
                      <th className="py-3 px-4 text-left font-medium">Veículo</th>
                      <th className="py-3 px-4 text-left font-medium">Tipo</th>
                      <th className="py-3 px-4 text-left font-medium">Data</th>
                      <th className="py-3 px-4 text-left font-medium">Valor</th>
                      <th className="py-3 px-4 text-left font-medium">KM</th>
                      <th className="py-3 px-4 text-left font-medium">Local</th>
                      <th className="py-3 px-4 text-center font-medium">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredServicos.map((servico, index) => (
                      <tr 
                        key={servico.id} 
                        className={`border-b hover:bg-muted/20 transition-colors ${
                          index % 2 === 0 ? 'bg-background' : 'bg-muted/10'
                        }`}
                      >
                        <td className="py-3 px-4">
                          <div className="font-medium">{servico.parceiro.nome}</div>
                          <div className="text-xs text-muted-foreground">{servico.parceiro.cidade}</div>
                        </td>
                        <td className="py-3 px-4">
                          <div>{servico.veiculo || 'Não especificado'}</div>
                          <div className="text-xs text-muted-foreground">{servico.placa}</div>
                        </td>
                        <td className="py-3 px-4">{servico.tipo_servico}</td>
                        <td className="py-3 px-4">{formatDateShortBrasilia(servico.data_servico)}</td>
                        <td className="py-3 px-4 font-medium">R$ {parseFloat(servico.valor).toFixed(2)}</td>
                        <td className="py-3 px-4">{servico.km_reboque ? `${servico.km_reboque} km` : '-'}</td>
                        <td className="py-3 px-4">
                          <div className="text-xs max-w-[150px] truncate" title={servico.local_atendimento}>
                            {servico.local_atendimento}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex justify-center gap-2">
                            {servico.status === 'pendente' && (
                              <>
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  className="h-8 px-2 text-green-600 hover:text-green-700 hover:bg-green-50"
                                  onClick={() => aprovarServicoMutation.mutate(servico.id)}
                                >
                                  <Check className="h-4 w-4 mr-1" />
                                  Aprovar
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  className="h-8 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                                  onClick={() => rejeitarServicoMutation.mutate(servico.id)}
                                >
                                  <X className="h-4 w-4 mr-1" />
                                  Rejeitar
                                </Button>
                              </>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 px-2"
                              onClick={() => {
                                setSelectedServico(servico);
                                setDetailsModalOpen(true);
                              }}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Detalhes
                            </Button>
                            {/* Botão de exclusão apenas para administradores */}
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => {
                                if (window.confirm(`Tem certeza que deseja excluir o serviço #${servico.id}?`)) {
                                  deleteServicoMutation.mutate(servico.id);
                                }
                              }}
                              disabled={loadingServico === servico.id}
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Excluir
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <Alert variant="default" className="bg-muted/30">
                <AlertCircle className="h-5 w-5" />
                <AlertTitle>Nenhum serviço encontrado</AlertTitle>
                <AlertDescription>
                  Não foram encontrados serviços com os filtros aplicados.
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Modal de Detalhes do Serviço */}
      <Dialog open={detailsModalOpen} onOpenChange={setDetailsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes do Serviço #{selectedServico?.id}</DialogTitle>
            <DialogDescription>
              Informações completas do serviço prestado
            </DialogDescription>
          </DialogHeader>
          
          {selectedServico && (
            <div className="space-y-6">
              {/* Informações do Parceiro */}
              <div className="bg-muted/30 p-4 rounded-lg">
                <h3 className="font-semibold text-lg mb-3">Informações do Parceiro</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Nome</label>
                    <p className="font-medium">{selectedServico.parceiro.nome}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Cidade/Estado</label>
                    <p>{selectedServico.parceiro.cidade}, {selectedServico.parceiro.estado}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Avaliação</label>
                    <p>⭐ {selectedServico.parceiro.avaliacao}/5</p>
                  </div>
                </div>
              </div>

              {/* Informações do Veículo */}
              <div className="bg-muted/30 p-4 rounded-lg">
                <h3 className="font-semibold text-lg mb-3">Informações do Veículo</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Placa</label>
                    <p className="font-medium">{selectedServico.placa}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Veículo</label>
                    <p>{selectedServico.veiculo || 'Não especificado'}</p>
                  </div>
                </div>
              </div>

              {/* Informações do Serviço */}
              <div className="bg-muted/30 p-4 rounded-lg">
                <h3 className="font-semibold text-lg mb-3">Informações do Serviço</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Tipo de Serviço</label>
                    <p className="font-medium">{selectedServico.tipo_servico}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Data do Serviço</label>
                    <p>{formatDateShortBrasilia(selectedServico.data_servico)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Valor</label>
                    <p className="font-medium text-green-600">R$ {parseFloat(selectedServico.valor).toFixed(2)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Status</label>
                    <p className={`font-medium ${
                      selectedServico.status === 'pendente' ? 'text-yellow-600' :
                      selectedServico.status === 'aprovado' ? 'text-green-600' :
                      'text-red-600'
                    }`}>
                      {selectedServico.status === 'pendente' ? 'Pendente' :
                       selectedServico.status === 'aprovado' ? 'Aprovado' :
                       'Rejeitado'}
                    </p>
                  </div>
                  {selectedServico.km_reboque && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">KM Reboque</label>
                      <p>{selectedServico.km_reboque} km</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Local de Atendimento */}
              {selectedServico.local_atendimento && (
                <div className="bg-muted/30 p-4 rounded-lg">
                  <h3 className="font-semibold text-lg mb-3">Local de Atendimento</h3>
                  <p>{selectedServico.local_atendimento}</p>
                </div>
              )}

              {/* Observações */}
              {selectedServico.observacoes && (
                <div className="bg-muted/30 p-4 rounded-lg">
                  <h3 className="font-semibold text-lg mb-3">Observações</h3>
                  <p className="whitespace-pre-wrap">{selectedServico.observacoes}</p>
                </div>
              )}

              {/* Fotos do Serviço */}
              {selectedServico.fotos_servico && selectedServico.fotos_servico.length > 0 && (
                <div className="bg-muted/30 p-4 rounded-lg">
                  <h3 className="font-semibold text-lg mb-3">Fotos do Serviço</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {selectedServico.fotos_servico.map((foto, index) => (
                      <div key={index} className="relative group">
                        <img 
                          src={foto} 
                          alt={`Foto do serviço ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => window.open(foto, '_blank')}
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all rounded-lg flex items-center justify-center">
                          <Eye className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

    </AppLayout>
  );
}