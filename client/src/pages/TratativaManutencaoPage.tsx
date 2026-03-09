import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase-compat';
import MainLayoutSimple from '@/components/layout/MainLayoutSimple';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Search, Clock, CheckCircle2, TimerOff, AlertCircle, DollarSign, MessageSquare } from "lucide-react";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuth } from '@/context/AuthContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import MaintenanceChatHistory from '@/components/chat/MaintenanceChatHistory';

// Interfaces para tipagem
interface Maintenance {
  id: number;
  veiculo_id: number;
  base_id: number;
  descricao: string;
  data_registro: string;
  status: string;
  data_conclusao?: string;
  responsavel_tratativa?: string;
  data_tratativa?: string;
  // Campos adicionais para exibição
  placa_veiculo?: string;
  modelo_veiculo?: string;
  base_nome?: string;
}

const TratativaManutencaoPage: React.FC = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [manutencoes, setManutencoes] = useState<Maintenance[]>([]);
  const [activeTab, setActiveTab] = useState('pendentes');
  const [selectedMaintenanceId, setSelectedMaintenanceId] = useState<number | null>(null);
  const [responsavelNome, setResponsavelNome] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isChatDialogOpen, setIsChatDialogOpen] = useState(false);

  // Carregar manutenções
  useEffect(() => {
    fetchManutencoes();
  }, []);

  const fetchManutencoes = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('manutencoes')
        .select(`
          *,
          vehicles:veiculo_id(id, plate, model),
          bases:base_id(id, name)
        `)
        .order('data_registro', { ascending: false });

      if (error) throw error;
      
      // Formatar dados para exibição
      const formattedData = data.map((item: any) => ({
        id: item.id,
        veiculo_id: item.veiculo_id,
        base_id: item.base_id,
        descricao: item.descricao,
        data_registro: item.data_registro,
        status: item.status,
        data_conclusao: item.data_conclusao,
        responsavel_tratativa: item.responsavel_tratativa,
        data_tratativa: item.data_tratativa,
        placa_veiculo: item.vehicles?.plate,
        modelo_veiculo: item.vehicles?.model,
        base_nome: item.bases?.name
      }));

      setManutencoes(formattedData);
    } catch (error) {
      console.error('Erro ao buscar manutenções:', error);
      toast({
        title: 'Erro ao carregar manutenções',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Filtrar manutenções com base na busca e status
  const filteredMaintenances = manutencoes.filter(
    (manutencao) => {
      const matchesSearch = 
        manutencao.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (manutencao.placa_veiculo && manutencao.placa_veiculo.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (manutencao.modelo_veiculo && manutencao.modelo_veiculo.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (manutencao.base_nome && manutencao.base_nome.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (manutencao.responsavel_tratativa && manutencao.responsavel_tratativa.toLowerCase().includes(searchTerm.toLowerCase()));
      
      // Filtrar por status conforme a tab ativa
      if (activeTab === 'pendentes') {
        return matchesSearch && manutencao.status === 'pendente';
      } else if (activeTab === 'andamento') {
        // Considerar todos os status em andamento na aba "Em Andamento"
        const statusAndamento = [
          'em_andamento', 
          'aguardando_orcamento', 
          'em_negociacao', 
          'orcamento_aprovado',
          'aguardando_pecas'
        ];
        return matchesSearch && statusAndamento.includes(manutencao.status);
      } else if (activeTab === 'concluidas') {
        return matchesSearch && manutencao.status === 'concluida';
      }
      
      return matchesSearch;
    }
  );

  // Abrir diálogo para iniciar tratativa
  const handleOpenTratativaDialog = (id: number) => {
    setSelectedMaintenanceId(id);
    setResponsavelNome(user?.name || '');
    setIsDialogOpen(true);
  };
  
  // Abrir diálogo de chat/negociação
  const handleOpenChatDialog = (id: number) => {
    setSelectedMaintenanceId(id);
    setIsChatDialogOpen(true);
  };

  // Função para iniciar tratativa
  const handleIniciarTratativa = async () => {
    if (!selectedMaintenanceId || !responsavelNome) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Por favor, preencha seu nome para continuar.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('manutencoes')
        .update({
          status: 'em_andamento',
          responsavel_tratativa: responsavelNome,
          data_tratativa: new Date().toISOString()
        })
        .eq('id', selectedMaintenanceId);
      
      if (error) throw error;
      
      // Atualizar lista de manutenções
      setManutencoes(manutencoes.map(item => {
        if (item.id === selectedMaintenanceId) {
          return {
            ...item,
            status: 'em_andamento',
            responsavel_tratativa: responsavelNome,
            data_tratativa: new Date().toISOString()
          };
        }
        return item;
      }));
      
      toast({
        title: 'Tratativa iniciada',
        description: 'A manutenção foi marcada como em andamento.',
        variant: 'default',
      });
      
      setIsDialogOpen(false);
      setSelectedMaintenanceId(null);
      setResponsavelNome('');
      
    } catch (error) {
      console.error('Erro ao iniciar tratativa:', error);
      toast({
        title: 'Erro ao iniciar tratativa',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      });
    }
  };

  // Função para concluir manutenção
  const handleConcluirManutencao = async (id: number) => {
    if (!confirm('Tem certeza que deseja concluir esta manutenção?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('manutencoes')
        .update({
          status: 'concluida',
          data_conclusao: new Date().toISOString()
        })
        .eq('id', id);
      
      if (error) throw error;
      
      // Atualizar a lista
      setManutencoes(manutencoes.map(item => {
        if (item.id === id) {
          return {
            ...item,
            status: 'concluida',
            data_conclusao: new Date().toISOString()
          };
        }
        return item;
      }));
      
      toast({
        title: 'Manutenção concluída',
        description: 'A manutenção foi marcada como concluída.',
        variant: 'default',
      });
    } catch (error) {
      console.error('Erro ao concluir manutenção:', error);
      toast({
        title: 'Erro ao concluir manutenção',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      });
    }
  };

  // Função para formatar data
  const formatDate = (dateString?: string): string => {
    if (!dateString) return '-';
    try {
      return format(new Date(dateString), 'dd/MM/yyyy HH:mm', { locale: ptBR });
    } catch (error) {
      return 'Data inválida';
    }
  };

  // Componente para exibir o status
  const StatusBadge = ({ status }: { status: string }) => {
    switch (status) {
      case 'pendente':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">Pendente</Badge>;
      case 'em_andamento':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">Em Andamento</Badge>;
      case 'concluida':
        return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">Concluída</Badge>;
      case 'aguardando_orcamento':
        return <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-300">Aguardando Orçamento</Badge>;
      case 'em_negociacao':
        return <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-300">Em Negociação</Badge>;
      case 'orcamento_aprovado':
        return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">Orçamento Aprovado</Badge>;
      case 'aguardando_pecas':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">Aguardando Peças</Badge>;
      case 'cancelada':
        return <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300">Cancelada</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <MainLayoutSimple>
      {/* Diálogo para iniciar tratativa */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Iniciar Tratativa de Manutenção</DialogTitle>
            <DialogDescription>
              Informe seu nome para dar andamento a esta solicitação de manutenção.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Nome
              </Label>
              <Input
                id="name"
                value={responsavelNome}
                onChange={(e) => setResponsavelNome(e.target.value)}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleIniciarTratativa}>Iniciar Tratativa</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Diálogo para exibir o histórico de chat/negociação */}
      <Dialog open={isChatDialogOpen} onOpenChange={setIsChatDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Histórico de Negociação de Orçamento</DialogTitle>
            <DialogDescription>
              Acompanhe a comunicação e negociação de orçamento com a oficina
            </DialogDescription>
          </DialogHeader>
          
          {selectedMaintenanceId && (
            <div className="mt-4">
              <MaintenanceChatHistory maintenanceId={selectedMaintenanceId} />
            </div>
          )}
          
          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setIsChatDialogOpen(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold mb-2">Tratativas de Manutenção</h1>
            <p className="text-gray-500">
              Gerencie e acompanhe o andamento das solicitações de manutenção
            </p>
          </div>
          <div>
            <Button
              variant="outline"
              onClick={() => {
                // Obter a URL base da aplicação
                const baseUrl = window.location.origin;
                const oficinasUrl = `${baseUrl}/oficinas/cadastro`;
                
                // Copiar para a área de transferência
                navigator.clipboard.writeText(oficinasUrl)
                  .then(() => {
                    toast({
                      title: "Link copiado!",
                      description: "O link para cadastro de oficinas foi copiado para a área de transferência.",
                      variant: "default",
                    });
                  })
                  .catch(err => {
                    console.error('Erro ao copiar link:', err);
                    toast({
                      title: "Erro ao copiar",
                      description: "Não foi possível copiar o link. Por favor, tente novamente.",
                      variant: "destructive",
                    });
                  });
              }}
            >
              Copiar Link para Cadastro de Oficinas
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="pendentes">Pendentes</TabsTrigger>
            <TabsTrigger value="andamento">Em Andamento</TabsTrigger>
            <TabsTrigger value="concluidas">Concluídas</TabsTrigger>
          </TabsList>
          
          <div className="flex justify-between items-center">
            <div></div>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                type="search"
                placeholder="Buscar manutenções..."
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
                  <TableCaption>Lista de solicitações de manutenção</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Veículo</TableHead>
                      <TableHead>Base</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Registrado em</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Responsável</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMaintenances.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="h-24 text-center">
                          Nenhuma manutenção encontrada.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredMaintenances.map((manutencao) => (
                        <TableRow key={manutencao.id}>
                          <TableCell className="font-medium">
                            <div className="flex flex-col">
                              <span>{manutencao.placa_veiculo}</span>
                              {manutencao.modelo_veiculo && (
                                <span className="text-xs text-gray-500">{manutencao.modelo_veiculo}</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{manutencao.base_nome}</TableCell>
                          <TableCell className="max-w-[200px] truncate" title={manutencao.descricao}>
                            {manutencao.descricao}
                          </TableCell>
                          <TableCell>{formatDate(manutencao.data_registro)}</TableCell>
                          <TableCell>
                            <StatusBadge status={manutencao.status} />
                          </TableCell>
                          <TableCell>
                            {manutencao.responsavel_tratativa || '-'}
                            {manutencao.data_tratativa && (
                              <div className="text-xs text-gray-500 mt-1">
                                desde {formatDate(manutencao.data_tratativa)}
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end space-x-2">
                              {manutencao.status === 'pendente' && (
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleOpenTratativaDialog(manutencao.id)}
                                  className="text-blue-600 hover:text-blue-800"
                                >
                                  <Clock className="h-4 w-4 mr-1" />
                                  Iniciar
                                </Button>
                              )}
                              {/* Botão para ação em manutenções em andamento normal */}
                              {manutencao.status === 'em_andamento' && (
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleConcluirManutencao(manutencao.id)}
                                  className="text-green-600 hover:text-green-800"
                                >
                                  <CheckCircle2 className="h-4 w-4 mr-1" />
                                  Concluir
                                </Button>
                              )}

                              {/* Botão para ação em manutenções com orçamento */}
                              {['aguardando_orcamento', 'em_negociacao', 'orcamento_aprovado', 'aguardando_pecas'].includes(manutencao.status) && (
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleOpenChatDialog(manutencao.id)}
                                  className="text-purple-600 hover:text-purple-800"
                                >
                                  <MessageSquare className="h-4 w-4 mr-1" />
                                  Negociação
                                </Button>
                              )}
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
        </Tabs>
      </div>
    </MainLayoutSimple>
  );
};

export default TratativaManutencaoPage;