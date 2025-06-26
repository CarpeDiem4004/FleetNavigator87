import React, { useState, useEffect } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import {
  Package,
  FileUp,
  FileDown,
  Plus,
  Search,
  Loader2,
  PackageOpen,
  BarChart3,
  AlertCircle,
  ArrowRight,
  ArrowUpDown,
  Download,
  Upload,
  ShoppingCart,
  Pencil,
  Trash2,
  ArrowLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'wouter';

// Função para formatar valor em Real brasileiro
const formatCurrency = (value: number | string): string => {
  const numValue = typeof value === 'string' ? parseFloat(value) || 0 : value;
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numValue);
};

// Função para converter string formatada em número
const parseCurrency = (value: string): number => {
  const cleanValue = value.replace(/[R$\s.]/g, '').replace(',', '.');
  return parseFloat(cleanValue) || 0;
};

// Função para formatar input enquanto digita
const formatCurrencyInput = (value: string): string => {
  const numericValue = value.replace(/\D/g, '');
  if (!numericValue) return '';
  const numberValue = parseFloat(numericValue) / 100;
  
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numberValue);
};

// Interfaces
interface Part {
  id: number;
  codigo: string;
  nome: string;
  descricao: string | null;
  categoria: string | null;
  fabricante: string | null;
  aplicacao: string | null;
  quantidade: number;
  valor_unitario: number;
  valor_total: number;
  estoque_minimo: number;
  estoque_maximo: number | null;
  localizacao: string | null;
  unidade_medida: string;
  status_disponibilidade?: string;
}

interface StockSummary {
  total_itens: number;
  total_quantidade: number;
  valor_total_estoque: number;
  itens_abaixo_minimo: number;
  itens_zerados: number;
  ultima_atualizacao: string;
}

// Schemas para validação de formulários
const movimentacaoEstoqueSchema = z.object({
  tipo_movimento: z.enum(['entrada', 'saida', 'ajuste'], {
    required_error: "Selecione o tipo de movimento",
  }),
  quantidade: z.coerce.number().min(1, {
    message: "Quantidade deve ser maior que zero",
  }),
  motivo: z.string().min(3, {
    message: "Motivo deve ter pelo menos 3 caracteres",
  }),
  nota_fiscal: z.string().optional(),
  veiculo_placa: z.string().optional(),
  observacoes: z.string().optional(),
});

const novaPecaSchema = z.object({
  nome: z.string().min(3, {
    message: "Nome deve ter pelo menos 3 caracteres",
  }),
  descricao: z.string().optional(),
  categoria: z.string().optional(),
  fabricante: z.string().optional(),
  aplicacao: z.string().optional(),
  quantidade: z.coerce.number().default(0),
  valor_unitario: z.coerce.number().min(0, {
    message: "Valor deve ser maior ou igual a zero",
  }),
  estoque_minimo: z.coerce.number().min(0).default(5),
  estoque_maximo: z.coerce.number().min(0).optional(),
  localizacao: z.string().optional(),
  unidade_medida: z.string().default("UN"),
});

export default function OficinaAlairEstoque() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredParts, setFilteredParts] = useState<Part[]>([]);
  const [selectedPart, setSelectedPart] = useState<Part | null>(null);
  const [isMovementDialogOpen, setIsMovementDialogOpen] = useState(false);
  const [isNewPartDialogOpen, setIsNewPartDialogOpen] = useState(false);
  const [isEditPartDialogOpen, setIsEditPartDialogOpen] = useState(false);
  const [isDeletePartDialogOpen, setIsDeletePartDialogOpen] = useState(false);
  
  // Formulário de movimentação de estoque
  const movementForm = useForm<z.infer<typeof movimentacaoEstoqueSchema>>({
    resolver: zodResolver(movimentacaoEstoqueSchema),
    defaultValues: {
      tipo_movimento: 'entrada',
      quantidade: 1,
      motivo: '',
      nota_fiscal: '',
      veiculo_placa: '',
      observacoes: '',
    },
  });
  
  // Formulário para edição de peça
  const editPartForm = useForm<Omit<Part, 'id' | 'valor_total' | 'status_disponibilidade'>>({
    resolver: zodResolver(
      z.object({
        codigo: z.string().min(1, "Código é obrigatório"),
        nome: z.string().min(2, "Nome é obrigatório"),
        descricao: z.string().optional().nullable(),
        categoria: z.string().optional().nullable(),
        fabricante: z.string().optional().nullable(),
        aplicacao: z.string().optional().nullable(),
        quantidade: z.coerce.number().min(0, "Quantidade deve ser maior ou igual a zero"),
        valor_unitario: z.coerce.number().min(0, "Valor unitário deve ser maior ou igual a zero"),
        estoque_minimo: z.coerce.number().min(0, "Estoque mínimo deve ser maior ou igual a zero"),
        estoque_maximo: z.coerce.number().optional().nullable(),
        localizacao: z.string().optional().nullable(),
        unidade_medida: z.string().min(1, "Unidade de medida é obrigatória"),
      })
    ),
    defaultValues: {
      codigo: '',
      nome: '',
      descricao: '',
      categoria: '',
      fabricante: '',
      aplicacao: '',
      quantidade: 0,
      valor_unitario: 0,
      estoque_minimo: 0,
      estoque_maximo: null,
      localizacao: '',
      unidade_medida: 'UN',
    },
  });
  
  // Formulário de cadastro de nova peça
  const newPartForm = useForm<z.infer<typeof novaPecaSchema>>({
    resolver: zodResolver(novaPecaSchema),
    defaultValues: {
      nome: '',
      descricao: '',
      categoria: '',
      fabricante: '',
      aplicacao: '',
      quantidade: 0,
      valor_unitario: 0,
      estoque_minimo: 5,
      estoque_maximo: 100,
      localizacao: '',
      unidade_medida: 'UN',
    },
  });

  // Carregar todas as peças do estoque da Oficina Alair
  const { 
    data: parts = [], 
    isLoading: isLoadingParts,
    isError: isErrorParts,
    refetch: refetchParts
  } = useQuery<Part[]>({
    queryKey: ['/api/oficina-alair/estoque-pecas'],
    refetchOnWindowFocus: false
  });

  // Carregar resumo do estoque da Oficina Alair
  const { 
    data: summary, 
    isLoading: isLoadingSummary 
  } = useQuery<StockSummary>({
    queryKey: ['/api/oficina-alair/estoque-resumo'],
    refetchOnWindowFocus: false
  });

  // Filtrar peças com base no termo de busca
  React.useEffect(() => {
    if (!parts || parts.length === 0) {
      setFilteredParts([]);
      return;
    }
    
    const filtered = parts.filter(part => 
      (part.codigo && part.codigo.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (part.nome && part.nome.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (part.categoria && part.categoria.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (part.fabricante && part.fabricante.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    
    setFilteredParts(filtered);
  }, [searchTerm, parts]);

  // Função para submeter movimentação de estoque
  const onSubmitMovement = async (data: z.infer<typeof movimentacaoEstoqueSchema>) => {
    if (!selectedPart) return;
    
    try {
      const response = await apiRequest('POST', '/api/oficina-alair/movimentacao-estoque', {
        ...data,
        peca_id: selectedPart.id,
        valor_unitario: selectedPart.valor_unitario,
      });
      
      const result = await response.json();
      
      if (response.ok) {
        toast({
          title: 'Movimentação registrada',
          description: `${data.tipo_movimento === 'entrada' ? 'Entrada' : data.tipo_movimento === 'saida' ? 'Saída' : 'Ajuste'} de ${data.quantidade} ${selectedPart.unidade_medida}(s) registrada com sucesso`,
        });
        setIsMovementDialogOpen(false);
        movementForm.reset();
        refetchParts();
      } else {
        throw new Error(result.message || 'Erro ao registrar movimentação');
      }
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Ocorreu um erro ao processar a movimentação',
        variant: 'destructive',
      });
    }
  };

  // Função para submeter nova peça
  const onSubmitNewPart = async (data: z.infer<typeof novaPecaSchema>) => {
    try {
      const response = await apiRequest('POST', '/api/oficina-alair/estoque-pecas', data);
      const result = await response.json();
      
      if (response.ok) {
        toast({
          title: 'Peça cadastrada',
          description: `Peça "${data.nome}" cadastrada com sucesso`,
        });
        setIsNewPartDialogOpen(false);
        newPartForm.reset();
        refetchParts();
      } else {
        throw new Error(result.message || 'Erro ao cadastrar peça');
      }
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Ocorreu um erro ao cadastrar a peça',
        variant: 'destructive',
      });
    }
  };

  // Função para abrir diálogo de movimentação
  const handleOpenMovementDialog = (part: Part) => {
    setSelectedPart(part);
    setIsMovementDialogOpen(true);
  };
  
  // Função para abrir diálogo de edição
  const handleOpenEditDialog = (part: Part) => {
    setSelectedPart(part);
    editPartForm.reset({
      codigo: part.codigo,
      nome: part.nome,
      descricao: part.descricao || '',
      categoria: part.categoria || '',
      fabricante: part.fabricante || '',
      aplicacao: part.aplicacao || '',
      quantidade: part.quantidade,
      valor_unitario: part.valor_unitario,
      estoque_minimo: part.estoque_minimo,
      estoque_maximo: part.estoque_maximo || undefined,
      localizacao: part.localizacao || '',
      unidade_medida: part.unidade_medida
    });
    setIsEditPartDialogOpen(true);
  };
  
  // Função para abrir diálogo de exclusão
  const handleOpenDeleteDialog = (part: Part) => {
    setSelectedPart(part);
    setIsDeletePartDialogOpen(true);
  };

  // Função para submeter edição de peça
  const onSubmitEditPart = async (data: any) => {
    if (!selectedPart) return;
    
    try {
      const response = await apiRequest('PUT', `/api/oficina-alair/estoque-pecas/${selectedPart.id}`, data);
      const result = await response.json();
      
      if (response.ok) {
        toast({
          title: 'Peça atualizada',
          description: `Peça "${data.nome}" foi atualizada com sucesso`,
        });
        setIsEditPartDialogOpen(false);
        editPartForm.reset();
        refetchParts();
      } else {
        throw new Error(result.message || 'Erro ao atualizar peça');
      }
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Ocorreu um erro ao atualizar a peça',
        variant: 'destructive',
      });
    }
  };

  // Função para confirmar exclusão de peça
  const handleDeletePart = async () => {
    if (!selectedPart) return;
    
    try {
      const response = await apiRequest('DELETE', `/api/oficina-alair/estoque-pecas/${selectedPart.id}`);
      const result = await response.json();
      
      if (response.ok) {
        toast({
          title: 'Peça excluída',
          description: `Peça "${selectedPart.nome}" foi removida do estoque`,
        });
        setIsDeletePartDialogOpen(false);
        setSelectedPart(null);
        refetchParts();
      } else {
        throw new Error(result.message || 'Erro ao excluir peça');
      }
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Ocorreu um erro ao excluir a peça',
        variant: 'destructive',
      });
    }
  };

  // Função para obter cor do badge de status
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'zerado':
        return 'destructive';
      case 'baixo':
        return 'secondary';
      default:
        return 'default';
    }
  };

  // Função para obter texto do status
  const getStatusText = (status: string) => {
    switch (status) {
      case 'zerado':
        return 'Zerado';
      case 'baixo':
        return 'Baixo';
      default:
        return 'Normal';
    }
  };

  if (isLoadingParts) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" asChild>
              <Link href="/oficina/dashboard">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar para Oficina
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Estoque de Peças - Oficina Alair</h1>
              <p className="text-muted-foreground">
                Gerencie o estoque exclusivo da Oficina Alair
              </p>
            </div>
          </div>
          
          <Dialog open={isNewPartDialogOpen} onOpenChange={setIsNewPartDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nova Peça
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Cadastrar Nova Peça</DialogTitle>
                <DialogDescription>
                  Adicione uma nova peça ao estoque da Oficina Alair
                </DialogDescription>
              </DialogHeader>
              
              <Form {...newPartForm}>
                <form onSubmit={newPartForm.handleSubmit(onSubmitNewPart)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={newPartForm.control}
                      name="nome"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome da Peça *</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: Filtro de óleo" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={newPartForm.control}
                      name="categoria"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Categoria</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: Filtros" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={newPartForm.control}
                      name="fabricante"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Fabricante</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: Bosch" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={newPartForm.control}
                      name="localizacao"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Localização</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: Prateleira A1" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={newPartForm.control}
                    name="descricao"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descrição</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Descreva a peça e sua aplicação" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={newPartForm.control}
                      name="quantidade"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Quantidade Inicial</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={newPartForm.control}
                      name="valor_unitario"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Valor Unitário (R$)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="0.01" 
                              placeholder="0,00"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={newPartForm.control}
                      name="unidade_medida"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Unidade</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Unidade" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="UN">Unidade</SelectItem>
                              <SelectItem value="PC">Peça</SelectItem>
                              <SelectItem value="JG">Jogo</SelectItem>
                              <SelectItem value="KG">Quilograma</SelectItem>
                              <SelectItem value="LT">Litro</SelectItem>
                              <SelectItem value="MT">Metro</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={newPartForm.control}
                      name="estoque_minimo"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Estoque Mínimo</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={newPartForm.control}
                      name="estoque_maximo"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Estoque Máximo</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsNewPartDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit">Cadastrar Peça</Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Cards de Resumo */}
        {summary && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Itens</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary.total_itens}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Quantidade Total</CardTitle>
                <PackageOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary.total_quantidade}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(summary.valor_total_estoque)}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Alertas</CardTitle>
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">
                  {summary.itens_abaixo_minimo + summary.itens_zerados}
                </div>
                <p className="text-xs text-muted-foreground">
                  {summary.itens_zerados} zerados, {summary.itens_abaixo_minimo} baixos
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Busca */}
        <div className="flex items-center space-x-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por código, nome, categoria ou fabricante..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>

        {/* Tabela de Peças */}
        <Card>
          <CardHeader>
            <CardTitle>Peças em Estoque</CardTitle>
            <CardDescription>
              {filteredParts.length} peças encontradas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Quantidade</TableHead>
                    <TableHead>Valor Unit.</TableHead>
                    <TableHead>Valor Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredParts.map((part) => (
                    <TableRow key={part.id}>
                      <TableCell className="font-mono text-sm">{part.codigo}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{part.nome}</div>
                          {part.fabricante && (
                            <div className="text-sm text-muted-foreground">{part.fabricante}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{part.categoria || '-'}</TableCell>
                      <TableCell>
                        <div className="text-center">
                          <div className="font-medium">{part.quantidade}</div>
                          <div className="text-xs text-muted-foreground">{part.unidade_medida}</div>
                        </div>
                      </TableCell>
                      <TableCell>{formatCurrency(part.valor_unitario)}</TableCell>
                      <TableCell className="font-medium">{formatCurrency(part.valor_total)}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeColor(part.status_disponibilidade || 'normal')}>
                          {getStatusText(part.status_disponibilidade || 'normal')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenMovementDialog(part)}
                          >
                            <ArrowUpDown className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenEditDialog(part)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenDeleteDialog(part)}
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
          </CardContent>
        </Card>

        {/* Dialog de Movimentação */}
        <Dialog open={isMovementDialogOpen} onOpenChange={setIsMovementDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Movimentar Estoque</DialogTitle>
              <DialogDescription>
                {selectedPart && `${selectedPart.nome} (${selectedPart.codigo})`}
              </DialogDescription>
            </DialogHeader>
            
            <Form {...movementForm}>
              <form onSubmit={movementForm.handleSubmit(onSubmitMovement)} className="space-y-4">
                <FormField
                  control={movementForm.control}
                  name="tipo_movimento"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Movimento</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="entrada">Entrada</SelectItem>
                          <SelectItem value="saida">Saída</SelectItem>
                          <SelectItem value="ajuste">Ajuste</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={movementForm.control}
                  name="quantidade"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quantidade</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={movementForm.control}
                  name="motivo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Motivo</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Descreva o motivo da movimentação" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={movementForm.control}
                    name="nota_fiscal"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nota Fiscal</FormLabel>
                        <FormControl>
                          <Input placeholder="Número da NF" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={movementForm.control}
                    name="veiculo_placa"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Placa do Veículo</FormLabel>
                        <FormControl>
                          <Input placeholder="ABC1234" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={movementForm.control}
                  name="observacoes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Observações</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Observações adicionais" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsMovementDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit">Registrar Movimentação</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Dialog de Edição */}
        <Dialog open={isEditPartDialogOpen} onOpenChange={setIsEditPartDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Editar Peça</DialogTitle>
              <DialogDescription>
                Altere as informações da peça selecionada
              </DialogDescription>
            </DialogHeader>
            
            <Form {...editPartForm}>
              <form onSubmit={editPartForm.handleSubmit(onSubmitEditPart)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={editPartForm.control}
                    name="codigo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Código</FormLabel>
                        <FormControl>
                          <Input {...field} disabled />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={editPartForm.control}
                    name="nome"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome da Peça *</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={editPartForm.control}
                    name="categoria"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Categoria</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={editPartForm.control}
                    name="fabricante"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fabricante</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={editPartForm.control}
                  name="descricao"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição</FormLabel>
                      <FormControl>
                        <Textarea {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={editPartForm.control}
                    name="quantidade"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quantidade</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={editPartForm.control}
                    name="valor_unitario"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Valor Unitário (R$)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={editPartForm.control}
                    name="unidade_medida"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Unidade</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="UN">Unidade</SelectItem>
                            <SelectItem value="PC">Peça</SelectItem>
                            <SelectItem value="JG">Jogo</SelectItem>
                            <SelectItem value="KG">Quilograma</SelectItem>
                            <SelectItem value="LT">Litro</SelectItem>
                            <SelectItem value="MT">Metro</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={editPartForm.control}
                    name="estoque_minimo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Estoque Mínimo</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={editPartForm.control}
                    name="estoque_maximo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Estoque Máximo</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={editPartForm.control}
                    name="localizacao"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Localização</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsEditPartDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit">Salvar Alterações</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Dialog de Exclusão */}
        <Dialog open={isDeletePartDialogOpen} onOpenChange={setIsDeletePartDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmar Exclusão</DialogTitle>
              <DialogDescription>
                Tem certeza que deseja excluir a peça "{selectedPart?.nome}"?
                Esta ação não pode ser desfeita.
              </DialogDescription>
            </DialogHeader>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDeletePartDialogOpen(false)}>
                Cancelar
              </Button>
              <Button variant="destructive" onClick={handleDeletePart}>
                Excluir Peça
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}