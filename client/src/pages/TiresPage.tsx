import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
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
import { Search, Plus, FileEdit, Trash2, ArrowUpCircle, ShoppingBag, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import MainLayoutSimple from '@/components/layout/MainLayoutSimple';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { Tire, getAllTires, createTire, updateTire, deleteTire } from '@/services/tiresService';
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
    rejeitado: 'Rejeitado'
  };
  return statuses[status] || status;
};

// Função para obter a classe CSS para o badge de status de requisição
const getRequestStatusBadgeClass = (status: string): string => {
  const classes: Record<string, string> = {
    pendente: 'bg-yellow-100 text-yellow-800',
    aprovado: 'bg-green-100 text-green-800',
    rejeitado: 'bg-red-100 text-red-800'
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
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState("inventory");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false);
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
    km_inicial: 0,
    km_atual: 0,
    profundidade_sulco: 12.0,
    localizacao: 'almoxarifado',
    status: 'estoque',
    // tem_estepe removido - não existe na tabela
    observacao: ''
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
      // Usar a nova API para adicionar pneus
      const response = await createTire({
        ...newTire,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      
      if (response.success && response.data) {
        setTires([...tires, response.data]);
        setIsAddDialogOpen(false);
        
        toast({
          title: "Pneu adicionado",
          description: `Pneu ${response.data.codigo} adicionado com sucesso.`,
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
          km_inicial: 0,
          km_atual: 0,
          profundidade_sulco: 12.0,
          localizacao: 'almoxarifado',
          status: 'estoque',
          // tem_estepe removido - não existe na tabela
          observacao: ''
        });
      }
    } catch (error) {
      console.error("Erro ao adicionar pneu:", error);
      toast({
        title: "Erro ao adicionar pneu",
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
        'rejeitado',
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
                  
                  {/* Profundidade e KM */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="profundidade_sulco">Profundidade do Sulco (mm)</Label>
                      <Input
                        id="profundidade_sulco"
                        type="number"
                        step="0.1"
                        min="0"
                        max="20"
                        value={newTire.profundidade_sulco?.toString() || '12.0'}
                        onChange={(e) => setNewTire({...newTire, profundidade_sulco: parseFloat(e.target.value) || 0})}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="km_inicial">KM Inicial</Label>
                      <Input
                        id="km_inicial"
                        type="number"
                        value={newTire.km_inicial?.toString() || '0'}
                        onChange={(e) => setNewTire({...newTire, km_inicial: parseInt(e.target.value) || 0})}
                      />
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
                  
                  {/* Opção "Veículo possui estepe" removida porque a coluna não existe na tabela pneus_completo */}
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
                              <Button variant="ghost" size="icon" title="Editar">
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Card para Solicitações pendentes */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center">
                    <AlertCircle className="mr-2 h-5 w-5 text-yellow-500" />
                    Solicitações Pendentes
                  </CardTitle>
                  <CardDescription>
                    Solicitações aguardando aprovação
                  </CardDescription>
                </CardHeader>
                <CardContent className="max-h-[300px] overflow-y-auto">
                  {isLoadingRequests ? (
                    <div className="flex justify-center items-center h-32">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                    </div>
                  ) : (
                    <>
                      {!tireRequests || tireRequests.length === 0 || tireRequests.filter(req => req.status === 'pendente').length === 0 ? (
                        <div className="text-center text-gray-500 my-8">
                          Não há solicitações pendentes
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {tireRequests
                            .filter(req => req.status === 'pendente')
                            .map(request => (
                              <div key={request.id} className="border rounded-lg p-3 bg-gray-50">
                                <div className="flex justify-between items-start mb-2">
                                  <div>
                                    <h4 className="font-semibold">{request.marca} {request.modelo}</h4>
                                    <p className="text-sm text-gray-600">{request.medida || '-'}</p>
                                  </div>
                                  <Badge variant="outline" className="bg-yellow-50 text-yellow-800 border-yellow-300">
                                    Pendente
                                  </Badge>
                                </div>
                                <div className="grid grid-cols-2 gap-1 text-sm mb-2">
                                  <div>
                                    <span className="text-gray-500">Base:</span> {request.base_nome}
                                  </div>
                                  <div>
                                    <span className="text-gray-500">Qt:</span> {request.quantidade}
                                  </div>
                                  <div>
                                    <span className="text-gray-500">Solicitante:</span> {request.usuario_nome}
                                  </div>
                                  <div>
                                    <span className="text-gray-500">Data:</span> {formatDate(request.data_solicitacao)}
                                  </div>
                                </div>
                                <div className="text-sm mb-3">
                                  <span className="text-gray-500">Motivo:</span> {request.motivo}
                                </div>
                                <div className="flex justify-end gap-2">
                                  <Button 
                                    size="sm" 
                                    variant="default" 
                                    onClick={() => handleApproveRequest(request.id)}
                                    className="h-8"
                                  >
                                    <CheckCircle className="mr-1 h-4 w-4" />
                                    Aprovar
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    onClick={() => handleRejectRequest(request.id)}
                                    className="h-8"
                                  >
                                    <XCircle className="mr-1 h-4 w-4" />
                                    Rejeitar
                                  </Button>
                                </div>
                              </div>
                            ))}
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Card para Solicitações aprovadas */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center">
                    <CheckCircle className="mr-2 h-5 w-5 text-green-500" />
                    Solicitações Aprovadas
                  </CardTitle>
                  <CardDescription>
                    Solicitações já aprovadas pela gestão
                  </CardDescription>
                </CardHeader>
                <CardContent className="max-h-[300px] overflow-y-auto">
                  {isLoadingRequests ? (
                    <div className="flex justify-center items-center h-32">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                    </div>
                  ) : (
                    <>
                      {!tireRequests || tireRequests.length === 0 || tireRequests.filter(req => req.status === 'aprovado').length === 0 ? (
                        <div className="text-center text-gray-500 my-8">
                          Não há solicitações aprovadas
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {tireRequests
                            .filter(req => req.status === 'aprovado')
                            .map(request => (
                              <div key={request.id} className="border rounded-lg p-3 bg-gray-50">
                                <div className="flex justify-between items-start mb-2">
                                  <div>
                                    <h4 className="font-semibold">{request.marca} {request.modelo}</h4>
                                    <p className="text-sm text-gray-600">{request.medida || '-'}</p>
                                  </div>
                                  <Badge variant="outline" className="bg-green-50 text-green-800 border-green-300">
                                    Aprovado
                                  </Badge>
                                </div>
                                <div className="grid grid-cols-2 gap-1 text-sm mb-2">
                                  <div>
                                    <span className="text-gray-500">Base:</span> {request.base_nome}
                                  </div>
                                  <div>
                                    <span className="text-gray-500">Qt:</span> {request.quantidade}
                                  </div>
                                  <div>
                                    <span className="text-gray-500">Solicitante:</span> {request.usuario_nome}
                                  </div>
                                  <div>
                                    <span className="text-gray-500">Data:</span> {formatDate(request.data_solicitacao)}
                                  </div>
                                </div>
                                <div className="text-sm">
                                  <span className="text-gray-500">Aprovador:</span> {request.aprovador_nome || '-'}
                                </div>
                              </div>
                            ))}
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Card para Solicitações rejeitadas */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center">
                    <XCircle className="mr-2 h-5 w-5 text-red-500" />
                    Solicitações Rejeitadas
                  </CardTitle>
                  <CardDescription>
                    Solicitações que foram negadas
                  </CardDescription>
                </CardHeader>
                <CardContent className="max-h-[300px] overflow-y-auto">
                  {isLoadingRequests ? (
                    <div className="flex justify-center items-center h-32">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                    </div>
                  ) : (
                    <>
                      {!tireRequests || tireRequests.length === 0 || tireRequests.filter(req => req.status === 'rejeitado').length === 0 ? (
                        <div className="text-center text-gray-500 my-8">
                          Não há solicitações rejeitadas
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {tireRequests
                            .filter(req => req.status === 'rejeitado')
                            .map(request => (
                              <div key={request.id} className="border rounded-lg p-3 bg-gray-50">
                                <div className="flex justify-between items-start mb-2">
                                  <div>
                                    <h4 className="font-semibold">{request.marca} {request.modelo}</h4>
                                    <p className="text-sm text-gray-600">{request.medida || '-'}</p>
                                  </div>
                                  <Badge variant="outline" className="bg-red-50 text-red-800 border-red-300">
                                    Rejeitado
                                  </Badge>
                                </div>
                                <div className="grid grid-cols-2 gap-1 text-sm mb-2">
                                  <div>
                                    <span className="text-gray-500">Base:</span> {request.base_nome}
                                  </div>
                                  <div>
                                    <span className="text-gray-500">Qt:</span> {request.quantidade}
                                  </div>
                                  <div>
                                    <span className="text-gray-500">Solicitante:</span> {request.usuario_nome}
                                  </div>
                                  <div>
                                    <span className="text-gray-500">Data:</span> {formatDate(request.data_solicitacao)}
                                  </div>
                                </div>
                                <div className="text-sm">
                                  <span className="text-gray-500">Rejeitado por:</span> {request.aprovador_nome || '-'}
                                </div>
                              </div>
                            ))}
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
                <CardFooter className="pt-2 pb-4 flex justify-center">
                  <Button 
                    variant="outline" 
                    className="text-sm"
                    onClick={() => setIsRequestDialogOpen(true)}
                  >
                    <ShoppingBag className="mr-2 h-4 w-4" />
                    Nova Solicitação
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="mounting" className="mt-4">
            <TireMountingHistory />
          </TabsContent>
        </Tabs>
      </div>
    </MainLayoutSimple>
  );
};

export default TiresPage;