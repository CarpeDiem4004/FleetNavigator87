import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { queryClient } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
} from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Search, Plus, FileEdit, Trash2, ArrowUpCircle, ShoppingBag, CheckCircle, XCircle, AlertCircle, Package, DollarSign, MessageCircle } from 'lucide-react';
import MainLayoutSimple from '@/components/layout/MainLayoutSimple';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { Tire, TireModel, TireStockStats, getAllTires, createTire, updateTire, deleteTire, getTireModels, getTireStockStats } from '@/services/tiresService';
import { TireRequest, getAllTireRequests, updateTireRequestStatus } from '@/services/tireRequestsService';
import TireRequestForm from '@/components/tire/TireRequestForm';
import TireMountingHistory from '@/components/tires/TireMountingHistory';

// Função para traduzir os status de pneus
const translateTireStatus = (status: string): string => {
  const statuses: Record<string, string> = {
    em_uso: 'Em Uso',
    estoque: 'Em Estoque',
    descartado: 'Descartado'
  };
  return statuses[status] || status;
};

// Função para obter a classe CSS para o badge de status
const getStatusBadgeClass = (status: string): string => {
  const classes: Record<string, string> = {
    em_uso: 'bg-green-100 text-green-800',
    estoque: 'bg-blue-100 text-blue-800',
    descartado: 'bg-gray-100 text-gray-800'
  };
  return classes[status] || 'bg-gray-100 text-gray-800';
};

// Função para calcular a vida útil restante do pneu
const calculateTireLife = (treadDepth: number): number => {
  // Considerando 12mm como profundidade inicial e 2mm como limite mínimo
  const initialDepth = 12;
  const minDepth = 2;
  const usableDepth = initialDepth - minDepth;
  const currentUsable = treadDepth - minDepth;
  
  if (currentUsable <= 0) return 0;
  return Math.round((currentUsable / usableDepth) * 100);
};

// Função para formatar datas
const formatDate = (dateString: string): string => {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR').format(date);
  } catch (error) {
    return dateString;
  }
};

// Função para traduzir status de solicitações de pneus
const translateRequestStatus = (status: string): string => {
  const statuses: Record<string, string> = {
    pendente: 'Pendente',
    aprovado: 'Aprovado',
    negado: 'Rejeitado',
    em_analise: 'Em Análise',
    concluido: 'Concluído'
  };
  return statuses[status] || status;
};

// Função para obter a classe CSS para o badge de status de requisição
const getRequestStatusBadgeClass = (status: string): string => {
  const classes: Record<string, string> = {
    pendente: 'bg-yellow-100 text-yellow-800',
    aprovado: 'bg-green-100 text-green-800',
    negado: 'bg-red-100 text-red-800',
    em_analise: 'bg-blue-100 text-blue-800',
    concluido: 'bg-purple-100 text-purple-800'
  };
  return classes[status] || 'bg-gray-100 text-gray-800';
};

const TiresPage: React.FC = () => {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [tires, setTires] = useState<Tire[]>([]);
  const [tireRequests, setTireRequests] = useState<TireRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingRequests, setIsLoadingRequests] = useState(true);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [stockStats, setStockStats] = useState<TireStockStats>({ quantidade: 0, valor_total: 0 });
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState("inventory");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false); // Estado para dialog de edição
  const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false);
  const [tireModels, setTireModels] = useState<TireModel[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [currentTire, setCurrentTire] = useState<Tire | null>(null); // Estado para o pneu sendo editado
  const [newTire, setNewTire] = useState<Partial<Tire>>({
    codigo: '',
    marca: '',
    modelo: '',
    medida: '',
    aro: '',
    tipo: '',
    origem: 'novo',
    data_aquisicao: new Date().toISOString().split('T')[0],
    veiculo_placa: null,
    posicao: null,
    km_atual: 0,
    localizacao: 'almoxarifado',
    status: 'estoque',
    observacao: '',
    quantidade: 1,
    valor_unitario: 0
  });

  // Buscar pneus da API
  useEffect(() => {
    const loadTires = async () => {
      setIsLoading(true);
      try {
        // Usar a nova API de pneus
        const response = await getAllTires();
        if (response.success) {
          setTires(response.data);
        } else {
          toast({
            title: "Erro ao carregar pneus",
            description: "Não foi possível carregar a lista de pneus.",
            variant: "destructive"
          });
        }
      } catch (error) {
        console.error("Erro ao buscar pneus:", error);
        toast({
          title: "Erro ao carregar pneus",
          description: error instanceof Error ? error.message : "Erro desconhecido",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadTires();
  }, [toast]);
  
  // Função para carregar estatísticas de estoque (definida fora do useEffect para poder ser chamada de outros lugares)
  const loadStockStats = async () => {
    setIsLoadingStats(true);
    try {
      const response = await getTireStockStats();
      if (response && response.success) {
        setStockStats(response.data);
      } else {
        console.error("Falha ao carregar estatísticas de estoque");
      }
    } catch (error) {
      console.error("Erro ao buscar estatísticas de estoque:", error);
    } finally {
      setIsLoadingStats(false);
    }
  };

  // Carregar estatísticas de estoque quando a lista de pneus mudar
  useEffect(() => {
    loadStockStats();
  }, [tires]); // Recarregar quando a lista de pneus mudar

  // Carregar modelos de pneus quando o diálogo é aberto
  useEffect(() => {
    if (isAddDialogOpen || isEditDialogOpen) {
      const loadTireModels = async () => {
        setIsLoadingModels(true);
        try {
          const response = await getTireModels();
          if (response.success) {
            setTireModels(response.data);
          } else {
            console.error("Falha ao carregar modelos de pneus:", response.error);
          }
        } catch (error) {
          console.error("Erro ao buscar modelos de pneus:", error);
        } finally {
          setIsLoadingModels(false);
        }
      };
      
      loadTireModels();
    }
  }, [isAddDialogOpen, isEditDialogOpen]);

  // Carregar solicitações de pneus usando a nova API
  useEffect(() => {
    const loadTireRequests = async () => {
      setIsLoadingRequests(true);
      try {
        const response = await getAllTireRequests();
        if (response.success) {
          setTireRequests(response.data);
        } else {
          console.error("Falha ao carregar solicitações de pneus:", response.error);
          toast({
            title: "Erro ao carregar solicitações",
            description: "Não foi possível carregar a lista de solicitações de pneus.",
            variant: "destructive"
          });
        }
      } catch (error) {
        console.error("Erro ao buscar solicitações de pneus:", error);
        toast({
          title: "Erro ao carregar solicitações",
          description: error instanceof Error ? error.message : "Erro desconhecido",
          variant: "destructive"
        });
      } finally {
        setIsLoadingRequests(false);
      }
    };

    loadTireRequests();
  }, [toast]);

  // Filtrar pneus com base no termo de busca
  const filteredTires = tires.filter(
    (tire) => 
      (tire.codigo && tire.codigo.toLowerCase().includes(searchTerm.toLowerCase())) || 
      (tire.marca && tire.marca.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (tire.modelo && tire.modelo.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (tire.veiculo_placa && tire.veiculo_placa.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Adicionar novo pneu
  const handleAddTire = async () => {
    if (!newTire.codigo || !newTire.marca || !newTire.modelo) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive"
      });
      return;
    }

    try {
      const quantidade = newTire.quantidade || 1;
      let addedPneus = [];
      
      // Se a quantidade for 1, adiciona normalmente
      if (quantidade === 1) {
        const response = await createTire({
          ...newTire,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          change_date: new Date().toISOString() // Adicionando campo obrigatório
        });
        
        if (response.success && response.data) {
          addedPneus.push(response.data);
        } else {
          throw new Error(response.error || "Erro ao adicionar pneu");
        }
      } else {
        // Se a quantidade for maior que 1, cria múltiplos pneus
        for (let i = 0; i < quantidade; i++) {
          // Gera um código único para cada pneu se estiver criando múltiplos
          const novoCodigo = i === 0 
            ? newTire.codigo 
            : `${newTire.codigo}-${(i + 1).toString().padStart(2, '0')}`;
          
          const response = await createTire({
            ...newTire,
            codigo: novoCodigo,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            change_date: new Date().toISOString(), // Adicionando campo obrigatório
            // Define quantidade como 1 para cada pneu individual
            quantidade: 1
          });
          
          if (response.success && response.data) {
            addedPneus.push(response.data);
          } else {
            throw new Error(response.error || `Erro ao adicionar pneu ${novoCodigo}`);
          }
        }
      }
      
      // Atualiza a lista de pneus
      setTires([...tires, ...addedPneus]);
      setIsAddDialogOpen(false);
      
      // Invalida o cache das estatísticas e força recarregamento
      queryClient.invalidateQueries({ queryKey: ['/api/pneus/estatisticas/estoque'] });
      
      // Força atualização das estatísticas
      loadStockStats();
      
      toast({
        title: "Registrado com sucesso!",
        description: quantidade > 1 
          ? `${quantidade} pneus adicionados ao sistema.` 
          : `Pneu ${addedPneus[0].codigo} adicionado ao sistema.`,
        variant: "default"
      });
      
      // Resetar formulário
      setNewTire({
        codigo: '',
        marca: '',
        modelo: '',
        medida: '',
        aro: '',
        tipo: '',
        origem: 'novo',
        data_aquisicao: new Date().toISOString().split('T')[0],
        veiculo_placa: null,
        posicao: null,
        km_atual: 0,
        localizacao: 'almoxarifado',
        status: 'estoque',
        observacao: '',
        quantidade: 1,
        valor_unitario: 0
      });
    } catch (error) {
      console.error("Erro ao adicionar pneu:", error);
      toast({
        title: "Erro ao adicionar pneu",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive"
      });
    }
  };

  // Função para iniciar a edição de um pneu
  const handleEditTire = (tire: Tire) => {
    setCurrentTire(tire);
    setIsEditDialogOpen(true);
  };
  
  // Função para atualizar um pneu
  const handleUpdateTire = async () => {
    if (!currentTire || !currentTire.id) {
      toast({
        title: "Erro ao editar",
        description: "Pneu inválido ou não selecionado.",
        variant: "destructive"
      });
      return;
    }
    
    if (!currentTire.codigo || !currentTire.marca || !currentTire.modelo) {
      toast({
        title: "Campos obrigatórios",
        description: "Código, marca e modelo são campos obrigatórios.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      // Remover campos que possam causar problemas na atualização
      const { total_movimentacoes, ultima_movimentacao, updated_at, ...tireToUpdate } = currentTire;
      
      // Atualizando o pneu via API - não enviar updated_at, o banco de dados vai definir automaticamente
      const response = await updateTire(currentTire.id, tireToUpdate);
      
      if (response.success && response.data) {
        // Atualizar a lista de pneus
        setTires(tires.map(tire => 
          tire.id === currentTire.id ? response.data : tire
        ));
        
        setIsEditDialogOpen(false);
        setCurrentTire(null);
        
        toast({
          title: "Pneu atualizado",
          description: `Pneu ${response.data.codigo} atualizado com sucesso.`,
          variant: "default"
        });
      } else {
        throw new Error(response.error || "Erro ao atualizar pneu");
      }
    } catch (error) {
      console.error("Erro ao atualizar pneu:", error);
      toast({
        title: "Erro ao atualizar pneu",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive"
      });
    }
  };
  
  // Deletar pneu
  const handleDeleteTire = async (id: number) => {
    if (!confirm("Tem certeza que deseja excluir este pneu? Esta ação não pode ser desfeita.")) {
      return;
    }

    try {
      // Usar a nova API para deletar pneus
      const response = await deleteTire(id);
      
      if (response.success) {
        setTires(tires.filter(tire => tire.id !== id));
        
        toast({
          title: "Pneu excluído",
          description: "O pneu foi excluído com sucesso.",
          variant: "default"
        });
      }
    } catch (error) {
      console.error("Erro ao excluir pneu:", error);
      toast({
        title: "Erro ao excluir pneu",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive"
      });
    }
  };

  // Handle tire requests logic moved to TireRequestForm component

  // Aprovar solicitação de pneus usando a nova API
  const handleApproveRequest = async (requestId: number) => {
    try {
      // Valores simulados para teste - em produção viria do usuário logado
      const currentUser = {
        id: 12,
        name: "Administrador"
      };
      
      const response = await updateTireRequestStatus(
        requestId,
        'aprovado',
        currentUser.id,
        currentUser.name
      );
      
      if (response.success && response.data) {
        // Atualizar a lista de solicitações
        setTireRequests((currentRequests) => 
          currentRequests ? currentRequests.map(req => 
            req.id === requestId ? response.data : req
          ) : []
        );
        
        toast({
          title: "Solicitação aprovada",
          description: "A solicitação de pneus foi aprovada com sucesso.",
          variant: "default"
        });
      } else {
        throw new Error(response.error || "Erro ao aprovar solicitação");
      }
    } catch (error) {
      console.error("Erro ao aprovar solicitação:", error);
      toast({
        title: "Erro ao aprovar solicitação",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive"
      });
    }
  };

  // Rejeitar solicitação de pneus usando a nova API
  const handleRejectRequest = async (requestId: number) => {
    try {
      // Valores simulados para teste - em produção viria do usuário logado
      const currentUser = {
        id: 12,
        name: "Administrador"
      };
      
      const response = await updateTireRequestStatus(
        requestId,
        'negado',
        currentUser.id,
        currentUser.name
      );
      
      if (response.success && response.data) {
        // Atualizar a lista de solicitações
        setTireRequests((currentRequests) => 
          currentRequests ? currentRequests.map(req => 
            req.id === requestId ? response.data : req
          ) : []
        );
        
        toast({
          title: "Solicitação rejeitada",
          description: "A solicitação de pneus foi rejeitada.",
          variant: "default"
        });
      } else {
        throw new Error(response.error || "Erro ao rejeitar solicitação");
      }
    } catch (error) {
      console.error("Erro ao rejeitar solicitação:", error);
      toast({
        title: "Erro ao rejeitar solicitação",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive"
      });
    }
  };

  const tiposOptions = [
    { value: 'direcao', label: 'Direção' },
    { value: 'tracao', label: 'Tração' },
    { value: 'trailer', label: 'Trailer/Carreta' },
  ];

  const origensOptions = [
    { value: 'novo', label: 'Novo' },
    { value: 'recapado', label: 'Recapado' },
    { value: 'usado', label: 'Usado' },
  ];

  const localizacoesOptions = [
    { value: 'almoxarifado', label: 'Almoxarifado' },
    { value: 'estoque_borracharia', label: 'Estoque Borracharia' },
    { value: 'transito', label: 'Em Trânsito' },
  ];

  return (
    <MainLayoutSimple>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold mb-2">Pneus</h1>
            <p className="text-gray-500">
              Gestão e rastreamento de pneus da frota
            </p>
          </div>
          
          <div className="flex space-x-3">
            <Button 
              variant="outline" 
              className="flex items-center"
              onClick={() => navigate('/tires/entrada')}
            >
              <ArrowUpCircle className="mr-2 h-4 w-4" />
              Entrada em Lote
            </Button>
            
            <TireRequestForm 
              onRequestSubmitted={() => {
                // Recarregar as solicitações após criar uma nova
                const loadTireRequests = async () => {
                  setIsLoadingRequests(true);
                  try {
                    const response = await getAllTireRequests();
                    if (response.success) {
                      setTireRequests(response.data);
                    }
                  } catch (error) {
                    console.error("Erro ao buscar solicitações de pneus:", error);
                  } finally {
                    setIsLoadingRequests(false);
                  }
                };
                
                loadTireRequests();
              }}
            />
            
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center">
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar Pneu
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>Registrar Novo Pneu</DialogTitle>
                  <DialogDescription>
                    Preencha os detalhes do pneu abaixo
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4 max-h-[500px] overflow-y-auto">
                  {/* Identificação */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="codigo">Código/Nº de Série *</Label>
                      <Input
                        id="codigo"
                        value={newTire.codigo || ''}
                        onChange={(e) => setNewTire({...newTire, codigo: e.target.value})}
                        placeholder="Ex: P001"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="data_aquisicao">Data de Aquisição</Label>
                      <Input
                        id="data_aquisicao"
                        type="date"
                        value={newTire.data_aquisicao || ''}
                        onChange={(e) => setNewTire({...newTire, data_aquisicao: e.target.value})}
                      />
                    </div>
                  </div>
                  

                  
                  {/* Marca e Modelo */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="marca">Marca *</Label>
                      <Input
                        id="marca"
                        value={newTire.marca || ''}
                        onChange={(e) => setNewTire({...newTire, marca: e.target.value})}
                        placeholder="Ex: Pirelli"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="modelo">Modelo *</Label>
                      <Input
                        id="modelo"
                        value={newTire.modelo || ''}
                        onChange={(e) => setNewTire({...newTire, modelo: e.target.value})}
                        placeholder="Ex: Formula Energy"
                        required
                      />
                    </div>
                  </div>
                  
                  {/* Medida e Aro */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="medida">Medida</Label>
                      <Input
                        id="medida"
                        value={newTire.medida || ''}
                        onChange={(e) => setNewTire({...newTire, medida: e.target.value})}
                        placeholder="Ex: 295/80R22.5"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="aro">Aro</Label>
                      <Input
                        id="aro"
                        value={newTire.aro || ''}
                        onChange={(e) => setNewTire({...newTire, aro: e.target.value})}
                        placeholder="Ex: 22.5"
                      />
                    </div>
                  </div>
                  

                  
                  {/* Tipo e Origem */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="tipo">Tipo</Label>
                      <Select 
                        value={newTire.tipo} 
                        onValueChange={(value) => setNewTire({...newTire, tipo: value})}
                      >
                        <SelectTrigger id="tipo">
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          {tiposOptions.map(option => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="origem">Origem</Label>
                      <Select 
                        value={newTire.origem} 
                        onValueChange={(value) => setNewTire({...newTire, origem: value})}
                      >
                        <SelectTrigger id="origem">
                          <SelectValue placeholder="Selecione a origem" />
                        </SelectTrigger>
                        <SelectContent>
                          {origensOptions.map(option => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  {/* Status e Localização */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="status">Status</Label>
                      <Select 
                        value={newTire.status} 
                        onValueChange={(value: 'em_uso' | 'estoque' | 'descartado') => setNewTire({...newTire, status: value})}
                      >
                        <SelectTrigger id="status">
                          <SelectValue placeholder="Selecione o status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="estoque">Em Estoque</SelectItem>
                          <SelectItem value="em_uso">Em Uso</SelectItem>
                          <SelectItem value="descartado">Descartado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="localizacao">Localização</Label>
                      <Select 
                        value={newTire.localizacao} 
                        onValueChange={(value) => setNewTire({...newTire, localizacao: value})}
                      >
                        <SelectTrigger id="localizacao">
                          <SelectValue placeholder="Selecione a localização" />
                        </SelectTrigger>
                        <SelectContent>
                          {localizacoesOptions.map(option => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  {/* Espaço removido - o campo KM Inicial foi removido */}
                  
                  {/* Quantidade e Valor Unitário */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="quantidade">Quantidade</Label>
                      <Input
                        id="quantidade"
                        type="number"
                        min="1"
                        value={newTire.quantidade?.toString() || '1'}
                        onChange={(e) => setNewTire({...newTire, quantidade: parseInt(e.target.value) || 1})}
                      />
                      <p className="text-xs text-muted-foreground">
                        Para múltiplos pneus idênticos
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="valor_unitario">Valor Unitário (R$)</Label>
                      <Input
                        id="valor_unitario"
                        type="number"
                        step="0.01"
                        min="0"
                        value={newTire.valor_unitario?.toString() || '0'}
                        onChange={(e) => setNewTire({...newTire, valor_unitario: parseFloat(e.target.value) || 0})}
                      />
                    </div>
                  </div>
                  
                  {/* Valor Total - Calculado automaticamente */}
                  <div className="p-4 bg-muted rounded-md">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Valor Total:</span>
                      <span className="text-lg font-bold">
                        R$ {(((newTire.quantidade || 1) * (typeof newTire.valor_unitario === 'number' ? newTire.valor_unitario : 0)) || 0).toFixed(2)}
                      </span>
                    </div>
                  </div>
                  
                  {/* Observações */}
                  <div className="space-y-2">
                    <Label htmlFor="observacao">Observações</Label>
                    <Input
                      id="observacao"
                      value={newTire.observacao || ''}
                      onChange={(e) => setNewTire({...newTire, observacao: e.target.value})}
                      placeholder="Observações adicionais"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancelar</Button>
                  <Button onClick={handleAddTire}>Adicionar Pneu</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
          <TabsList className="grid w-full md:w-[600px] grid-cols-3">
            <TabsTrigger value="inventory">Inventário</TabsTrigger>
            <TabsTrigger value="requests">Solicitações</TabsTrigger>
            <TabsTrigger value="mounting">Histórico de Montagem</TabsTrigger>
          </TabsList>
          
          <TabsContent value="inventory" className="mt-4">
            {/* Card de estatísticas de estoque */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xl">Estatísticas de Estoque</CardTitle>
                  <CardDescription>Quantidade e valor total de pneus em estoque</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingStats ? (
                    <div className="flex items-center justify-center h-24">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-blue-50 rounded-lg flex flex-col items-center">
                        <div className="bg-blue-100 p-2 rounded-full mb-2">
                          <Package className="h-5 w-5 text-blue-700" />
                        </div>
                        <span className="text-2xl font-bold text-blue-700">{stockStats.quantidade}</span>
                        <span className="text-sm text-blue-700">Pneus em Estoque</span>
                      </div>
                      <div className="p-4 bg-green-50 rounded-lg flex flex-col items-center">
                        <div className="bg-green-100 p-2 rounded-full mb-2">
                          <DollarSign className="h-5 w-5 text-green-700" />
                        </div>
                        <span className="text-2xl font-bold text-green-700">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stockStats.valor_total)}
                        </span>
                        <span className="text-sm text-green-700">Valor Total</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    type="search"
                    placeholder="Buscar pneus..."
                    className="pl-8 w-[300px]"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  onClick={() => navigate("/tires/solicitacoes")}
                  className="flex items-center gap-1"
                  variant="outline"
                >
                  <MessageCircle className="h-4 w-4" />
                  Gestão de Solicitações
                </Button>
              </div>
            </div>

            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableCaption>Lista de pneus cadastrados no sistema</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Código</TableHead>
                      <TableHead>Marca/Modelo</TableHead>
                      <TableHead>Medida</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Veículo</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTires.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="h-24 text-center">
                          Nenhum pneu encontrado.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredTires.map((tire) => (
                        <TableRow key={tire.id}>
                          <TableCell className="font-medium">{tire.codigo}</TableCell>
                          <TableCell>{tire.marca} {tire.modelo}</TableCell>
                          <TableCell>{tire.medida}</TableCell>
                          <TableCell>{tire.tipo}</TableCell>
                          <TableCell>{tire.veiculo_placa || '-'}</TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded-full text-xs ${getStatusBadgeClass(tire.status)}`}>
                              {translateTireStatus(tire.status)}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                title="Editar"
                                onClick={() => handleEditTire(tire)}
                              >
                                <FileEdit className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                title="Excluir"
                                onClick={() => handleDeleteTire(tire.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="requests" className="mt-4">
            <div className="bg-white p-4 rounded-lg shadow-sm mb-6 flex flex-wrap gap-4 items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Solicitações de Pneus</h2>
                <p className="text-gray-500 text-sm">Gerencie todas as solicitações de pneus no sistema</p>
              </div>
              <div className="flex gap-3">
                <Button 
                  onClick={() => navigate("/tires/solicitacoes")}
                  variant="outline"
                  className="flex items-center"
                >
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Painel de Gestão
                </Button>
                <Button 
                  onClick={() => setIsRequestDialogOpen(true)}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <ShoppingBag className="mr-2 h-4 w-4" />
                  Nova Solicitação
                </Button>
              </div>
            </div>
          
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Card para Solicitações pendentes */}
              <Card className="border-l-4 border-l-yellow-400 shadow-sm">
                <CardHeader className="pb-2 border-b">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center">
                      <AlertCircle className="mr-2 h-5 w-5 text-yellow-500" />
                      Solicitações Pendentes
                    </CardTitle>
                    <Badge variant="outline" className="bg-yellow-50 text-yellow-800 border-yellow-300">
                      {tireRequests && tireRequests.length > 0 ? tireRequests.filter(req => req.status === 'pendente').length : 0}
                    </Badge>
                  </div>
                  <CardDescription className="text-xs">
                    Solicitações aguardando aprovação
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  {isLoadingRequests ? (
                    <div className="flex justify-center items-center h-32">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                    </div>
                  ) : (
                    <div className="max-h-[350px] overflow-y-auto py-2 px-3">
                      {!tireRequests || tireRequests.length === 0 || tireRequests.filter(req => req.status === 'pendente').length === 0 ? (
                        <div className="text-center text-gray-500 my-8 flex flex-col items-center">
                          <AlertCircle className="h-10 w-10 text-gray-300 mb-2" />
                          <p>Não há solicitações pendentes</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {tireRequests
                            .filter(req => req.status === 'pendente')
                            .map(request => (
                              <div key={request.id} className="border rounded-lg p-3 bg-white hover:bg-gray-50 transition-colors">
                                <div className="flex justify-between items-start mb-3">
                                  <div>
                                    <h4 className="font-semibold text-gray-800">{request.marca} {request.modelo}</h4>
                                    <div className="flex items-center gap-2 mt-1">
                                      <Badge variant="outline" className="bg-gray-100 px-2 py-0 h-5 text-xs">
                                        {request.tipo}
                                      </Badge>
                                      {request.medida && (
                                        <Badge variant="outline" className="bg-gray-100 px-2 py-0 h-5 text-xs">
                                          {request.medida}
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                  <Badge variant="outline" className="bg-yellow-50 text-yellow-800 border-yellow-300">
                                    Pendente
                                  </Badge>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm mb-3 bg-gray-50 p-2 rounded">
                                  <div className="flex items-center">
                                    <span className="text-gray-500 w-24">Base:</span> 
                                    <span className="font-medium">{request.base_nome}</span>
                                  </div>
                                  <div className="flex items-center">
                                    <span className="text-gray-500 w-24">Quantidade:</span> 
                                    <span className="font-medium">{request.quantidade}</span>
                                  </div>
                                  <div className="flex items-center">
                                    <span className="text-gray-500 w-24">Solicitante:</span> 
                                    <span className="font-medium">{request.usuario_nome}</span>
                                  </div>
                                  <div className="flex items-center">
                                    <span className="text-gray-500 w-24">Data:</span> 
                                    <span className="font-medium">{formatDate(request.data_solicitacao)}</span>
                                  </div>
                                  {request.placa_veiculo && (
                                    <div className="flex items-center">
                                      <span className="text-gray-500 w-24">Veículo:</span> 
                                      <span className="font-medium">{request.placa_veiculo}</span>
                                    </div>
                                  )}
                                  {request.km_veiculo && (
                                    <div className="flex items-center">
                                      <span className="text-gray-500 w-24">Hodômetro:</span> 
                                      <span className="font-medium">{request.km_veiculo?.toLocaleString('pt-BR')} km</span>
                                    </div>
                                  )}
                                </div>
                                
                                <div className="text-sm mb-3 p-2 bg-gray-50 rounded">
                                  <div className="text-gray-600 font-medium mb-1">Motivo da solicitação:</div>
                                  <p className="text-gray-700">{request.motivo}</p>
                                  {request.observacoes && (
                                    <div className="mt-2 pt-2 border-t border-gray-200">
                                      <span className="text-gray-600 font-medium">Observações:</span>
                                      <p className="text-gray-600 text-xs mt-1">{request.observacoes}</p>
                                    </div>
                                  )}
                                </div>
                                
                                <div className="flex justify-end gap-2 mt-2">
                                  <Button 
                                    size="sm" 
                                    variant="default" 
                                    onClick={() => handleApproveRequest(request.id)}
                                    className="h-9 bg-green-600 hover:bg-green-700 text-white"
                                  >
                                    <CheckCircle className="mr-1 h-4 w-4" />
                                    Aprovar
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    onClick={() => handleRejectRequest(request.id)}
                                    className="h-9 border-red-200 text-red-600 hover:bg-red-50"
                                  >
                                    <XCircle className="mr-1 h-4 w-4" />
                                    Rejeitar
                                  </Button>
                                </div>
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Card para Solicitações aprovadas */}
              <Card className="border-l-4 border-l-green-400 shadow-sm">
                <CardHeader className="pb-2 border-b">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center">
                      <CheckCircle className="mr-2 h-5 w-5 text-green-500" />
                      Solicitações Aprovadas
                    </CardTitle>
                    <Badge variant="outline" className="bg-green-50 text-green-800 border-green-300">
                      {tireRequests && tireRequests.length > 0 ? tireRequests.filter(req => req.status === 'aprovado').length : 0}
                    </Badge>
                  </div>
                  <CardDescription className="text-xs">
                    Solicitações aprovadas pela gestão
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  {isLoadingRequests ? (
                    <div className="flex justify-center items-center h-32">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                    </div>
                  ) : (
                    <div className="max-h-[350px] overflow-y-auto py-2 px-3">
                      {!tireRequests || tireRequests.length === 0 || tireRequests.filter(req => req.status === 'aprovado').length === 0 ? (
                        <div className="text-center text-gray-500 my-8 flex flex-col items-center">
                          <CheckCircle className="h-10 w-10 text-gray-300 mb-2" />
                          <p>Não há solicitações aprovadas</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {tireRequests
                            .filter(req => req.status === 'aprovado')
                            .map(request => (
                              <div key={request.id} className="border rounded-lg p-3 bg-white hover:bg-gray-50 transition-colors">
                                <div className="flex justify-between items-start mb-3">
                                  <div>
                                    <h4 className="font-semibold text-gray-800">{request.marca} {request.modelo}</h4>
                                    <div className="flex items-center gap-2 mt-1">
                                      <Badge variant="outline" className="bg-gray-100 px-2 py-0 h-5 text-xs">
                                        {request.tipo}
                                      </Badge>
                                      {request.medida && (
                                        <Badge variant="outline" className="bg-gray-100 px-2 py-0 h-5 text-xs">
                                          {request.medida}
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                  <Badge variant="outline" className="bg-green-50 text-green-800 border-green-300">
                                    Aprovado
                                  </Badge>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm mb-3 bg-gray-50 p-2 rounded">
                                  <div className="flex items-center">
                                    <span className="text-gray-500 w-24">Base:</span> 
                                    <span className="font-medium">{request.base_nome}</span>
                                  </div>
                                  <div className="flex items-center">
                                    <span className="text-gray-500 w-24">Quantidade:</span> 
                                    <span className="font-medium">{request.quantidade}</span>
                                  </div>
                                  <div className="flex items-center">
                                    <span className="text-gray-500 w-24">Solicitante:</span> 
                                    <span className="font-medium">{request.usuario_nome}</span>
                                  </div>
                                  <div className="flex items-center">
                                    <span className="text-gray-500 w-24">Aprovado por:</span> 
                                    <span className="font-medium">{request.aprovador_nome || '-'}</span>
                                  </div>
                                  {request.placa_veiculo && (
                                    <div className="flex items-center">
                                      <span className="text-gray-500 w-24">Veículo:</span> 
                                      <span className="font-medium">{request.placa_veiculo}</span>
                                    </div>
                                  )}
                                  {request.km_veiculo && (
                                    <div className="flex items-center">
                                      <span className="text-gray-500 w-24">Hodômetro:</span> 
                                      <span className="font-medium">{request.km_veiculo?.toLocaleString('pt-BR')} km</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Card para Solicitações rejeitadas */}
              <Card className="border-l-4 border-l-red-400 shadow-sm">
                <CardHeader className="pb-2 border-b">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center">
                      <XCircle className="mr-2 h-5 w-5 text-red-500" />
                      Solicitações Rejeitadas
                    </CardTitle>
                    <Badge variant="outline" className="bg-red-50 text-red-800 border-red-300">
                      {tireRequests && tireRequests.length > 0 ? tireRequests.filter(req => req.status === 'negado').length : 0}
                    </Badge>
                  </div>
                  <CardDescription className="text-xs">
                    Solicitações recusadas pela gestão
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  {isLoadingRequests ? (
                    <div className="flex justify-center items-center h-32">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                    </div>
                  ) : (
                    <div className="max-h-[350px] overflow-y-auto py-2 px-3">
                      {!tireRequests || tireRequests.length === 0 || tireRequests.filter(req => req.status === 'negado').length === 0 ? (
                        <div className="text-center text-gray-500 my-8 flex flex-col items-center">
                          <XCircle className="h-10 w-10 text-gray-300 mb-2" />
                          <p>Não há solicitações rejeitadas</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {tireRequests
                            .filter(req => req.status === 'negado')
                            .map(request => (
                              <div key={request.id} className="border rounded-lg p-3 bg-white hover:bg-gray-50 transition-colors">
                                <div className="flex justify-between items-start mb-3">
                                  <div>
                                    <h4 className="font-semibold text-gray-800">{request.marca} {request.modelo}</h4>
                                    <div className="flex items-center gap-2 mt-1">
                                      <Badge variant="outline" className="bg-gray-100 px-2 py-0 h-5 text-xs">
                                        {request.tipo}
                                      </Badge>
                                      {request.medida && (
                                        <Badge variant="outline" className="bg-gray-100 px-2 py-0 h-5 text-xs">
                                          {request.medida}
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                  <Badge variant="outline" className="bg-red-50 text-red-800 border-red-300">
                                    Rejeitado
                                  </Badge>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm mb-3 bg-gray-50 p-2 rounded">
                                  <div className="flex items-center">
                                    <span className="text-gray-500 w-24">Base:</span> 
                                    <span className="font-medium">{request.base_nome}</span>
                                  </div>
                                  <div className="flex items-center">
                                    <span className="text-gray-500 w-24">Quantidade:</span> 
                                    <span className="font-medium">{request.quantidade}</span>
                                  </div>
                                  <div className="flex items-center">
                                    <span className="text-gray-500 w-24">Solicitante:</span> 
                                    <span className="font-medium">{request.usuario_nome}</span>
                                  </div>
                                  <div className="flex items-center">
                                    <span className="text-gray-500 w-24">Rejeitado por:</span> 
                                    <span className="font-medium">{request.aprovador_nome || '-'}</span>
                                  </div>
                                  {request.placa_veiculo && (
                                    <div className="flex items-center">
                                      <span className="text-gray-500 w-24">Veículo:</span> 
                                      <span className="font-medium">{request.placa_veiculo}</span>
                                    </div>
                                  )}
                                  {request.km_veiculo && (
                                    <div className="flex items-center">
                                      <span className="text-gray-500 w-24">Hodômetro:</span> 
                                      <span className="font-medium">{request.km_veiculo?.toLocaleString('pt-BR')} km</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="mounting" className="mt-4">
            <TireMountingHistory />
          </TabsContent>
        </Tabs>

        {/* Dialog para editar pneu */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-[465px] max-h-[90vh] overflow-y-auto">
            <DialogHeader className="pb-2">
              <DialogTitle className="text-left text-base font-semibold">Editar Pneu</DialogTitle>
              <DialogDescription className="text-left text-sm text-gray-500">
                Modifique os detalhes do pneu abaixo
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2 py-1">
              {/* Código e Data de Aquisição (primeira linha) */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="edit-codigo" className="text-xs mb-1">Código/Nº de Série *</Label>
                  <Input
                    id="edit-codigo"
                    value={currentTire?.codigo || ''}
                    onChange={(e) => setCurrentTire(current => current ? {...current, codigo: e.target.value} : null)}
                    placeholder="Ex: P001"
                    className="h-8 text-sm"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="edit-data_aquisicao" className="text-xs mb-1">Data de Aquisição</Label>
                  <Input
                    id="edit-data_aquisicao"
                    type="date"
                    value={currentTire?.data_aquisicao ? currentTire.data_aquisicao.toString().slice(0, 10) : ''}
                    onChange={(e) => setCurrentTire(current => current ? {...current, data_aquisicao: e.target.value} : null)}
                    className="h-8 text-sm"
                  />
                </div>
              </div>
              
              {/* Marca e Modelo (segunda linha) */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="edit-marca" className="text-xs mb-1">Marca *</Label>
                  <Input
                    id="edit-marca"
                    value={currentTire?.marca || ''}
                    onChange={(e) => setCurrentTire(current => current ? {...current, marca: e.target.value} : null)}
                    placeholder="Ex: Pirelli"
                    className="h-8 text-sm"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="edit-modelo" className="text-xs mb-1">Modelo *</Label>
                  <Input
                    id="edit-modelo"
                    value={currentTire?.modelo || ''}
                    onChange={(e) => setCurrentTire(current => current ? {...current, modelo: e.target.value} : null)}
                    placeholder="Ex: Formula Energy"
                    className="h-8 text-sm"
                    required
                  />
                </div>
              </div>
              
              {/* Medida e Aro (terceira linha) */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="edit-medida" className="text-xs mb-1">Medida</Label>
                  <Input
                    id="edit-medida"
                    value={currentTire?.medida || ''}
                    onChange={(e) => setCurrentTire(current => current ? {...current, medida: e.target.value} : null)}
                    placeholder="Ex: 295/80R22.5"
                    className="h-8 text-sm"
                  />
                </div>
                
                <div>
                  <Label htmlFor="edit-aro" className="text-xs mb-1">Aro</Label>
                  <Input
                    id="edit-aro"
                    value={currentTire?.aro || ''}
                    onChange={(e) => setCurrentTire(current => current ? {...current, aro: e.target.value} : null)}
                    placeholder="Ex: 22.5"
                    className="h-8 text-sm"
                  />
                </div>
              </div>
              
              {/* Tipo e Origem (quarta linha) */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="edit-tipo" className="text-xs mb-1">Tipo</Label>
                  <Select 
                    value={currentTire?.tipo || ''} 
                    onValueChange={(value) => setCurrentTire(current => current ? {...current, tipo: value} : null)}
                  >
                    <SelectTrigger id="edit-tipo" className="h-8 text-sm">
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {tiposOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="edit-origem" className="text-xs mb-1">Origem</Label>
                  <Select 
                    value={currentTire?.origem || ''} 
                    onValueChange={(value) => setCurrentTire(current => current ? {...current, origem: value} : null)}
                  >
                    <SelectTrigger id="edit-origem" className="h-8 text-sm">
                      <SelectValue placeholder="Selecione a origem" />
                    </SelectTrigger>
                    <SelectContent>
                      {origensOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {/* Localização e Status (quinta linha) */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="edit-localizacao" className="text-xs mb-1">Localização</Label>
                  <Select 
                    value={currentTire?.localizacao || ''} 
                    onValueChange={(value) => setCurrentTire(current => current ? {...current, localizacao: value} : null)}
                  >
                    <SelectTrigger id="edit-localizacao" className="h-8 text-sm">
                      <SelectValue placeholder="Localização atual" />
                    </SelectTrigger>
                    <SelectContent>
                      {localizacoesOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="edit-status" className="text-xs mb-1">Status</Label>
                  <Select 
                    value={currentTire?.status || ''} 
                    onValueChange={(value) => setCurrentTire(current => current ? {...current, status: value} : null)}
                  >
                    <SelectTrigger id="edit-status" className="h-8 text-sm">
                      <SelectValue placeholder="Status atual" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="estoque">Em Estoque</SelectItem>
                      <SelectItem value="em_uso">Em Uso</SelectItem>
                      <SelectItem value="descartado">Descartado</SelectItem>
                      <SelectItem value="em_manutencao">Em Manutenção</SelectItem>
                      <SelectItem value="reservado">Reservado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {/* Veículo e Posição (sexta linha) */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="edit-veiculo_placa" className="text-xs mb-1">Veículo (Placa)</Label>
                  <Input
                    id="edit-veiculo_placa"
                    value={currentTire?.veiculo_placa || ''}
                    onChange={(e) => setCurrentTire(current => current ? {...current, veiculo_placa: e.target.value} : null)}
                    placeholder="Ex: ABC1234"
                    className="h-8 text-sm"
                  />
                </div>
                
                <div>
                  <Label htmlFor="edit-posicao" className="text-xs mb-1">Posição no Veículo</Label>
                  <Input
                    id="edit-posicao"
                    value={currentTire?.posicao || ''}
                    onChange={(e) => setCurrentTire(current => current ? {...current, posicao: e.target.value} : null)}
                    placeholder="Ex: Dianteiro Esquerdo"
                    className="h-8 text-sm"
                  />
                </div>
              </div>
              
              {/* Valor Unitário e Quantidade (sétima linha) */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="edit-valor_unitario" className="text-xs mb-1">Valor Unitário (R$)</Label>
                  <Input
                    id="edit-valor_unitario"
                    type="number"
                    step="0.01"
                    value={currentTire?.valor_unitario || ''}
                    onChange={(e) => setCurrentTire(current => current ? {...current, valor_unitario: parseFloat(e.target.value)} : null)}
                    placeholder="Ex: 1200.00"
                    className="h-8 text-sm"
                  />
                </div>
                
                <div>
                  <Label htmlFor="edit-quantidade" className="text-xs mb-1">Quantidade</Label>
                  <Input
                    id="edit-quantidade"
                    type="number"
                    value={currentTire?.quantidade || ''}
                    onChange={(e) => setCurrentTire(current => current ? {...current, quantidade: parseInt(e.target.value)} : null)}
                    placeholder="Ex: 1"
                    className="h-8 text-sm"
                  />
                </div>
              </div>
            </div>
            <DialogFooter className="pt-1 mt-0">
              <Button variant="outline" size="sm" onClick={() => setIsEditDialogOpen(false)}>Cancelar</Button>
              <Button size="sm" onClick={handleUpdateTire}>Salvar Alterações</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
      </div>
    </MainLayoutSimple>
  );
};

export default TiresPage;