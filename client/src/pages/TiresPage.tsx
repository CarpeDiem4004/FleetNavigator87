import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Search, Plus, FileEdit, Trash2, ArrowUpCircle } from 'lucide-react';
import MainLayoutSimple from '@/components/layout/MainLayoutSimple';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { fetchRecords, createSupabaseClient } from '@/lib/supabase-client';

// Interface para o modelo de pneus
interface Tire {
  id: number;
  codigo: string;
  marca: string;
  modelo: string;
  medida: string;
  aro: string;
  tipo: string;
  origem: string;
  data_aquisicao: string;
  veiculo_placa: string | null;
  posicao: string | null;
  km_inicial: number;
  km_atual: number;
  profundidade_sulco: number;
  localizacao: string;
  status: 'em_uso' | 'estoque' | 'descartado';
  observacao?: string;
}

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

const TiresPage: React.FC = () => {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [tires, setTires] = useState<Tire[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
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
    observacao: ''
  });

  // Buscar pneus do Supabase
  useEffect(() => {
    const loadTires = async () => {
      setIsLoading(true);
      try {
        const response = await fetchRecords('pneus');
        if (response.success && response.data) {
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
      const supabase = createSupabaseClient();
      
      const { data, error } = await supabase
        .from('pneus')
        .insert([{
          ...newTire,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select();
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        setTires([...tires, data[0] as Tire]);
        setIsAddDialogOpen(false);
        
        toast({
          title: "Pneu adicionado",
          description: `Pneu ${data[0].codigo} adicionado com sucesso.`,
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
      const supabase = createSupabaseClient();
      
      const { error } = await supabase
        .from('pneus')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      setTires(tires.filter(tire => tire.id !== id));
      
      toast({
        title: "Pneu excluído",
        description: "O pneu foi excluído com sucesso.",
        variant: "default"
      });
    } catch (error) {
      console.error("Erro ao excluir pneu:", error);
      toast({
        title: "Erro ao excluir pneu",
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
                        onValueChange={(value: 'em_uso' | 'estoque' | 'descartado') => 
                          setNewTire({...newTire, status: value})
                        }
                      >
                        <SelectTrigger id="status">
                          <SelectValue placeholder="Selecione o status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="em_uso">Em Uso</SelectItem>
                          <SelectItem value="estoque">Em Estoque</SelectItem>
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
                  
                  {/* Profundidade do Sulco */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="profundidade_sulco">Profundidade do Sulco (mm)</Label>
                      <Input
                        id="profundidade_sulco"
                        type="number"
                        step="0.1"
                        value={newTire.profundidade_sulco || 0}
                        onChange={(e) => setNewTire({...newTire, profundidade_sulco: parseFloat(e.target.value)})}
                        min="0"
                        max="20"
                      />
                    </div>
                    
                    {newTire.status === 'em_uso' && (
                      <div className="space-y-2">
                        <Label htmlFor="veiculo_placa">Placa do Veículo</Label>
                        <Input
                          id="veiculo_placa"
                          value={newTire.veiculo_placa || ''}
                          onChange={(e) => setNewTire({...newTire, veiculo_placa: e.target.value})}
                          placeholder="Ex: ABC-1234"
                        />
                      </div>
                    )}
                  </div>
                  
                  {/* Informações extras para pneus em uso */}
                  {newTire.status === 'em_uso' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="posicao">Posição no Veículo</Label>
                        <Input
                          id="posicao"
                          value={newTire.posicao || ''}
                          onChange={(e) => setNewTire({...newTire, posicao: e.target.value})}
                          placeholder="Ex: Dianteiro Direito"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="km_atual">Km Atual</Label>
                        <Input
                          id="km_atual"
                          type="number"
                          value={newTire.km_atual || 0}
                          onChange={(e) => setNewTire({...newTire, km_atual: parseInt(e.target.value)})}
                          min="0"
                        />
                      </div>
                    </div>
                  )}
                  
                  {/* Observação */}
                  <div className="space-y-2">
                    <Label htmlFor="observacao">Observação</Label>
                    <Input
                      id="observacao"
                      value={newTire.observacao || ''}
                      onChange={(e) => setNewTire({...newTire, observacao: e.target.value})}
                      placeholder="Observações adicionais"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleAddTire}>
                    Adicionar
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Inventário de Pneus</CardTitle>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  type="search"
                  placeholder="Buscar pneus..."
                  className="pl-8 w-[250px]"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : filteredTires.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {searchTerm ? 
                  "Nenhum pneu encontrado para esta busca. Tente outros termos." : 
                  "Nenhum pneu cadastrado. Clique em 'Adicionar Pneu' para começar."}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableCaption>Inventário de pneus da frota</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Código</TableHead>
                      <TableHead>Marca/Modelo</TableHead>
                      <TableHead>Medida</TableHead>
                      <TableHead>Veículo</TableHead>
                      <TableHead>Posição</TableHead>
                      <TableHead>Vida Útil</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTires.map((tire) => (
                      <TableRow key={tire.id}>
                        <TableCell className="font-medium">{tire.codigo}</TableCell>
                        <TableCell>{tire.marca} {tire.modelo}</TableCell>
                        <TableCell>{tire.medida}</TableCell>
                        <TableCell>{tire.veiculo_placa || '-'}</TableCell>
                        <TableCell>{tire.posicao || '-'}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <div className="h-2 w-24 bg-gray-200 rounded-full overflow-hidden">
                              <div 
                                className={`h-full ${
                                  calculateTireLife(tire.profundidade_sulco) > 50 
                                    ? 'bg-green-500' 
                                    : calculateTireLife(tire.profundidade_sulco) > 25 
                                      ? 'bg-yellow-500' 
                                      : 'bg-red-500'
                                }`}
                                style={{ width: `${calculateTireLife(tire.profundidade_sulco)}%` }}
                              />
                            </div>
                            <span className="text-xs">{calculateTireLife(tire.profundidade_sulco)}%</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadgeClass(tire.status)}`}>
                            {translateTireStatus(tire.status)}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => navigate(`/tires/${tire.id}`)}
                            >
                              <FileEdit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => handleDeleteTire(tire.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
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
    </MainLayoutSimple>
  );
};

export default TiresPage;