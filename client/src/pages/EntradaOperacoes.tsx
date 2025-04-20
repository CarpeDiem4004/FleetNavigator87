import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { Search, FileEdit, Trash2, Plus } from 'lucide-react';
import MainLayoutSimple from '@/components/layout/MainLayoutSimple';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase-client';

interface OperationEntry {
  id: number;
  tipo: string;
  data: string;
  baseId: number;
  baseName: string;
  operador: string;
  turno: string;
  status: string;
  observacoes: string;
  created_at: string;
}

interface Base {
  id: number;
  nome: string;
}

const EntradaOperacoes: React.FC = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [operations, setOperations] = useState<OperationEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [bases, setBases] = useState<Base[]>([]);
  
  // Estados do formulário
  const [tipo, setTipo] = useState('carregamento');
  const [baseId, setBaseId] = useState<string | undefined>(undefined);
  const [operador, setOperador] = useState('');
  const [turno, setTurno] = useState('manhã');
  const [observacoes, setObservacoes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Carregar operações
  useEffect(() => {
    const fetchOperations = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('operacoes')
          .select(`
            id,
            tipo,
            data,
            base_id,
            operador,
            turno,
            status,
            observacoes,
            created_at,
            bases:base_id (nome)
          `)
          .order('created_at', { ascending: false });

        if (error) throw error;

        // Formatar os dados para incluir o nome da base
        const formattedData = data.map((item) => ({
          id: item.id,
          tipo: item.tipo,
          data: item.data,
          baseId: item.base_id,
          baseName: item.bases?.nome || 'Base Desconhecida',
          operador: item.operador,
          turno: item.turno,
          status: item.status,
          observacoes: item.observacoes,
          created_at: item.created_at,
        }));

        setOperations(formattedData);
      } catch (error) {
        console.error('Erro ao buscar operações:', error);
        toast({
          title: 'Erro ao carregar operações',
          description: error instanceof Error ? error.message : 'Erro desconhecido',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchOperations();
  }, [toast]);

  // Carregar bases
  useEffect(() => {
    const fetchBases = async () => {
      try {
        const { data, error } = await supabase.from('bases').select('id, nome');
        if (error) throw error;
        setBases(data || []);
      } catch (error) {
        console.error('Erro ao buscar bases:', error);
        toast({
          title: 'Erro ao carregar bases',
          description: error instanceof Error ? error.message : 'Erro desconhecido',
          variant: 'destructive',
        });
      }
    };

    fetchBases();
  }, [toast]);

  // Filtrar operações
  const filteredOperations = operations.filter(
    (op) =>
      op.tipo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      op.baseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      op.operador.toLowerCase().includes(searchTerm.toLowerCase()) ||
      op.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Função para traduzir o tipo de operação
  const translateOperationType = (type: string): string => {
    const types: Record<string, string> = {
      carregamento: 'Carregamento',
      descarga: 'Descarga',
      transferencia: 'Transferência',
      inventario: 'Inventário',
      manutencao: 'Manutenção',
    };
    return types[type] || type;
  };

  // Função para traduzir o status
  const translateStatus = (status: string): string => {
    const statuses: Record<string, string> = {
      pendente: 'Pendente',
      em_andamento: 'Em Andamento',
      concluida: 'Concluída',
      cancelada: 'Cancelada',
    };
    return statuses[status] || status;
  };

  // Função para obter a classe CSS para o badge de status
  const getStatusBadgeClass = (status: string): string => {
    const classes: Record<string, string> = {
      pendente: 'bg-yellow-100 text-yellow-800',
      em_andamento: 'bg-blue-100 text-blue-800',
      concluida: 'bg-green-100 text-green-800',
      cancelada: 'bg-red-100 text-red-800',
    };
    return classes[status] || 'bg-gray-100 text-gray-800';
  };

  // Função para formatar data
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR').format(date);
  };

  // Função para cadastrar nova operação
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!baseId) {
      toast({
        title: 'Campo obrigatório',
        description: 'Selecione uma base para continuar.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const now = new Date().toISOString();
      
      const { data, error } = await supabase.from('operacoes').insert({
        tipo,
        data: now.split('T')[0], // Apenas a data
        base_id: parseInt(baseId),
        operador,
        turno,
        status: 'pendente',
        observacoes,
        created_at: now,
      }).select();

      if (error) throw error;

      toast({
        title: 'Operação registrada',
        description: `Operação de ${translateOperationType(tipo)} registrada com sucesso.`,
        variant: 'default',
      });

      // Limpar formulário
      setTipo('carregamento');
      setBaseId(undefined);
      setOperador('');
      setTurno('manhã');
      setObservacoes('');
      
      // Atualizar lista e mudar para aba de lista
      const newOperation = {
        id: data[0].id,
        tipo: data[0].tipo,
        data: data[0].data,
        baseId: data[0].base_id,
        baseName: bases.find(b => b.id === parseInt(baseId))?.nome || 'Base Desconhecida',
        operador: data[0].operador,
        turno: data[0].turno,
        status: data[0].status,
        observacoes: data[0].observacoes,
        created_at: data[0].created_at,
      };
      
      setOperations([newOperation, ...operations]);
      setActiveTab('list');
      
    } catch (error) {
      console.error('Erro ao registrar operação:', error);
      toast({
        title: 'Erro ao registrar operação',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Função para excluir operação
  const handleDeleteOperation = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir esta operação? Esta ação não pode ser desfeita.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('operacoes')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      setOperations(operations.filter(op => op.id !== id));
      
      toast({
        title: 'Operação excluída',
        description: 'A operação foi excluída com sucesso.',
        variant: 'default',
      });
    } catch (error) {
      console.error('Erro ao excluir operação:', error);
      toast({
        title: 'Erro ao excluir operação',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      });
    }
  };

  return (
    <MainLayoutSimple>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold mb-2">Entrada de Operações</h1>
            <p className="text-gray-500">
              Registro e controle de operações logísticas
            </p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="list">Lista de Operações</TabsTrigger>
            <TabsTrigger value="add">Cadastrar Operação</TabsTrigger>
          </TabsList>
          
          <TabsContent value="list" className="space-y-4">
            <div className="flex justify-between items-center">
              <div></div>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  type="search"
                  placeholder="Buscar operações..."
                  className="pl-8 w-[300px]"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            
            <Card>
              <CardContent className="pt-6">
                {isLoading ? (
                  <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                  </div>
                ) : (
                  <Table>
                    <TableCaption>Lista de operações logísticas</TableCaption>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead>Base</TableHead>
                        <TableHead>Operador</TableHead>
                        <TableHead>Turno</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredOperations.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="h-24 text-center">
                            Nenhuma operação encontrada.
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredOperations.map((operation) => (
                          <TableRow key={operation.id}>
                            <TableCell className="font-medium">
                              {translateOperationType(operation.tipo)}
                            </TableCell>
                            <TableCell>{formatDate(operation.data)}</TableCell>
                            <TableCell>{operation.baseName}</TableCell>
                            <TableCell>{operation.operador}</TableCell>
                            <TableCell>{operation.turno}</TableCell>
                            <TableCell>
                              <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadgeClass(operation.status)}`}>
                                {translateStatus(operation.status)}
                              </span>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end space-x-2">
                                <Button variant="outline" size="icon">
                                  <FileEdit className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="icon"
                                  onClick={() => handleDeleteOperation(operation.id)}
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
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="add">
            <Card>
              <CardHeader>
                <CardTitle>Nova Operação</CardTitle>
                <CardDescription>
                  Registre uma nova operação logística
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleSubmit}>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="tipo">Tipo de Operação *</Label>
                    <Select value={tipo} onValueChange={setTipo}>
                      <SelectTrigger id="tipo">
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="carregamento">Carregamento</SelectItem>
                        <SelectItem value="descarga">Descarga</SelectItem>
                        <SelectItem value="transferencia">Transferência</SelectItem>
                        <SelectItem value="inventario">Inventário</SelectItem>
                        <SelectItem value="manutencao">Manutenção</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="base">Base *</Label>
                    <Select value={baseId} onValueChange={setBaseId}>
                      <SelectTrigger id="base">
                        <SelectValue placeholder="Selecione a Base" />
                      </SelectTrigger>
                      <SelectContent>
                        {bases.map((b) => (
                          <SelectItem key={b.id} value={b.id.toString()}>{b.nome}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="operador">Operador *</Label>
                    <Input
                      id="operador"
                      type="text"
                      placeholder="Nome do operador"
                      value={operador}
                      onChange={(e) => setOperador(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="turno">Turno *</Label>
                    <Select value={turno} onValueChange={setTurno}>
                      <SelectTrigger id="turno">
                        <SelectValue placeholder="Selecione o turno" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="manhã">Manhã</SelectItem>
                        <SelectItem value="tarde">Tarde</SelectItem>
                        <SelectItem value="noite">Noite</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="observacoes">Observações</Label>
                    <Textarea
                      id="observacoes"
                      placeholder="Observações adicionais"
                      value={observacoes}
                      onChange={(e) => setObservacoes(e.target.value)}
                      rows={3}
                    />
                  </div>
                </CardContent>
                <div className="flex justify-end p-6 pt-0">
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <span className="flex items-center">
                        <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                        Processando...
                      </span>
                    ) : (
                      <>
                        <Plus className="mr-2 h-4 w-4" />
                        Registrar Operação
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayoutSimple>
  );
};

export default EntradaOperacoes;