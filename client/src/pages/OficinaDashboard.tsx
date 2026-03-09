import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import MainLayoutSimple from '@/components/layout/MainLayoutSimple';
import { Redirect } from 'wouter';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
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
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Search, Clock, CheckCircle2, TimerOff, AlertCircle, FileEdit, Wrench } from "lucide-react";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Componente para exibir o status da manutenção com cores
function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'pendente':
      return <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300">Pendente</Badge>;
    case 'em_andamento':
      return <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">Em andamento</Badge>;
    case 'concluida':
      return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">Concluída</Badge>;
    case 'cancelada':
      return <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300">Cancelada</Badge>;
    default:
      return <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-300">{status}</Badge>;
  }
}

// Interface para tipagem de manutenções
interface Manutencao {
  id: number;
  veiculo_id: number;
  base_id: number;
  descricao: string;
  data_registro: string;
  status: string;
  data_conclusao?: string;
  responsavel_tratativa?: string;
  data_tratativa?: string;
  oficina_id?: number;
  orcamento?: string;
  valor_estimado?: number;
  prazo_estimado?: string;
  observacoes_oficina?: string;
  // Campos adicionais para exibição
  placa_veiculo?: string;
  modelo_veiculo?: string;
  base_nome?: string;
}

export default function OficinaDashboard() {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  
  const [manutencoes, setManutencoes] = useState<Manutencao[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('pendentes');
  
  // Dialog de atualização
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedManutencaoId, setSelectedManutencaoId] = useState<number | null>(null);
  const [formOrcamento, setFormOrcamento] = useState({
    orcamento: '',
    valor_estimado: '',
    prazo_estimado: '',
    observacoes_oficina: ''
  });

  // Verificar se o usuário tem role de oficina
  if (!isLoading && user && user.role !== 'oficina') {
    return <Redirect to="/" />;
  }

  // Formatação de data
  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return format(new Date(dateString), 'dd/MM/yyyy', { locale: ptBR });
  };

  // Efeito para carregar manutenções da oficina
  useEffect(() => {
    if (user && user.role === 'oficina' && user.oficina_id) {
      loadManutencoes();
    }
  }, [user]);

  // Função para carregar manutenções
  const loadManutencoes = async () => {
    setIsLoadingData(true);
    
    try {
      const response = await fetch(`/api/oficinas/${user?.oficina_id}/manutencoes`);
      
      if (!response.ok) {
        throw new Error('Erro ao buscar manutenções');
      }
      
      const data = await response.json();
      setManutencoes(data);
    } catch (error) {
      console.error('Erro ao buscar manutenções:', error);
      toast({
        title: 'Erro ao carregar manutenções',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingData(false);
    }
  };

  // Abrir dialog para atualizar manutenção
  const handleOpenUpdateDialog = (id: number) => {
    const manutencao = manutencoes.find(m => m.id === id);
    
    if (manutencao) {
      setSelectedManutencaoId(id);
      setFormOrcamento({
        orcamento: manutencao.orcamento || '',
        valor_estimado: manutencao.valor_estimado ? manutencao.valor_estimado.toString() : '',
        prazo_estimado: manutencao.prazo_estimado || '',
        observacoes_oficina: manutencao.observacoes_oficina || ''
      });
      setIsDialogOpen(true);
    }
  };

  // Atualizar orçamento de manutenção
  const handleAtualizarOrcamento = async () => {
    if (!selectedManutencaoId) return;
    
    try {
      const response = await fetch(`/api/oficinas/manutencoes/${selectedManutencaoId}/orcamento`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orcamento: formOrcamento.orcamento,
          valor_estimado: formOrcamento.valor_estimado ? parseFloat(formOrcamento.valor_estimado) : null,
          prazo_estimado: formOrcamento.prazo_estimado,
          observacoes_oficina: formOrcamento.observacoes_oficina
        }),
      });
      
      if (!response.ok) {
        throw new Error('Erro ao atualizar orçamento');
      }
      
      // Atualizar a lista de manutenções
      setManutencoes(manutencoes.map(m => {
        if (m.id === selectedManutencaoId) {
          return {
            ...m,
            orcamento: formOrcamento.orcamento,
            valor_estimado: formOrcamento.valor_estimado ? parseFloat(formOrcamento.valor_estimado) : undefined,
            prazo_estimado: formOrcamento.prazo_estimado,
            observacoes_oficina: formOrcamento.observacoes_oficina
          };
        }
        return m;
      }));
      
      setIsDialogOpen(false);
      
      toast({
        title: 'Orçamento atualizado',
        description: 'O orçamento foi atualizado com sucesso',
        variant: 'default',
      });
    } catch (error) {
      console.error('Erro ao atualizar orçamento:', error);
      toast({
        title: 'Erro ao atualizar orçamento',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      });
    }
  };

  // Concluir manutenção
  const handleConcluirManutencao = async (id: number) => {
    if (!confirm('Tem certeza que deseja marcar esta manutenção como concluída?')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/oficinas/manutencoes/${id}/concluir`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error('Erro ao concluir manutenção');
      }
      
      // Atualizar a lista de manutenções
      setManutencoes(manutencoes.map(m => {
        if (m.id === id) {
          return {
            ...m,
            status: 'concluida',
            data_conclusao: new Date().toISOString()
          };
        }
        return m;
      }));
      
      toast({
        title: 'Manutenção concluída',
        description: 'A manutenção foi marcada como concluída',
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

  // Filtrar manutenções com base na busca e status
  const filteredMaintenances = manutencoes.filter(manutencao => {
    const matchesSearch = 
      manutencao.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (manutencao.placa_veiculo && manutencao.placa_veiculo.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (manutencao.modelo_veiculo && manutencao.modelo_veiculo.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (manutencao.base_nome && manutencao.base_nome.toLowerCase().includes(searchTerm.toLowerCase()));
    
    let matchesStatus = false;
    switch (activeTab) {
      case 'pendentes':
        matchesStatus = manutencao.status === 'pendente';
        break;
      case 'andamento':
        matchesStatus = manutencao.status === 'em_andamento';
        break;
      case 'concluidas':
        matchesStatus = manutencao.status === 'concluida';
        break;
      default:
        matchesStatus = true;
    }
    
    return matchesSearch && matchesStatus;
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/login" />;
  }

  return (
    <MainLayoutSimple>
      {/* Dialog para atualizar orçamento */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Atualizar Orçamento</DialogTitle>
            <DialogDescription>
              Preencha as informações do orçamento para esta manutenção.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="orcamento">Link do Orçamento (PDF/Drive)</Label>
              <Input
                id="orcamento"
                type="text"
                value={formOrcamento.orcamento}
                onChange={(e) => setFormOrcamento({...formOrcamento, orcamento: e.target.value})}
                placeholder="https://..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="valor_estimado">Valor Estimado (R$)</Label>
              <Input
                id="valor_estimado"
                type="number"
                step="0.01"
                value={formOrcamento.valor_estimado}
                onChange={(e) => setFormOrcamento({...formOrcamento, valor_estimado: e.target.value})}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="prazo_estimado">Prazo Estimado (dias)</Label>
              <Input
                id="prazo_estimado"
                type="date"
                value={formOrcamento.prazo_estimado}
                onChange={(e) => setFormOrcamento({...formOrcamento, prazo_estimado: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="observacoes_oficina">Observações</Label>
              <Textarea
                id="observacoes_oficina"
                value={formOrcamento.observacoes_oficina}
                onChange={(e) => setFormOrcamento({...formOrcamento, observacoes_oficina: e.target.value})}
                placeholder="Detalhes sobre o serviço..."
                className="min-h-[120px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleAtualizarOrcamento}>Salvar Orçamento</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold mb-2">Painel da Oficina</h1>
            <p className="text-gray-500">
              Gerencie as manutenções e orçamentos da sua oficina
            </p>
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
              {isLoadingData ? (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                </div>
              ) : (
                <Table>
                  <TableCaption>Lista de manutenções atribuídas à sua oficina</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Veículo</TableHead>
                      <TableHead>Base</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Registrado em</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Valor</TableHead>
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
                            {manutencao.valor_estimado 
                              ? `R$ ${manutencao.valor_estimado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` 
                              : '-'}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end space-x-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleOpenUpdateDialog(manutencao.id)}
                                className="text-blue-600 hover:text-blue-800"
                              >
                                <FileEdit className="h-4 w-4 mr-1" />
                                Orçamento
                              </Button>
                              
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
}