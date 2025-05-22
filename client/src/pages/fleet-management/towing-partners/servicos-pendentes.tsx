import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';

// Componentes UI
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import PageHeader from '@/components/layout/PageHeader';
import ServicoPrestadoCard from '@/components/ServicoPrestadoCard';
import AppLayout from '@/components/AppLayout';

// Ícones
import { Search, AlertCircle, FileText, CheckCircle, XCircle } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

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
        />

        <div className="flex flex-col md:flex-row justify-between gap-4 mb-6 items-start md:items-center">
          <Input
            placeholder="Buscar por parceiro, placa ou tipo de serviço..."
            className="max-w-md"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            startIcon={<Search className="h-4 w-4 text-muted-foreground" />}
          />
          
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredServicos.map(servico => (
                  <ServicoPrestadoCard
                    key={servico.id}
                    servico={servico}
                    onAprovar={() => aprovarServicoMutation.mutate(servico.id)}
                    onRejeitar={() => rejeitarServicoMutation.mutate(servico.id)}
                    onDetalhar={(id) => {
                      // Na implementação final, navegue para a página de detalhes do serviço
                      toast({
                        title: "Visualizando detalhes",
                        description: `Detalhes do serviço #${id}`,
                      });
                    }}
                  />
                ))}
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
    </AppLayout>
  );
}