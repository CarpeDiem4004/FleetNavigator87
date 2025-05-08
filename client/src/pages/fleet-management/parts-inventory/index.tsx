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
  ShoppingCart
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
  unidade_medida: z.string().default("unidade"),
});

export default function PartsInventory() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredParts, setFilteredParts] = useState<Part[]>([]);
  const [selectedPart, setSelectedPart] = useState<Part | null>(null);
  const [isMovementDialogOpen, setIsMovementDialogOpen] = useState(false);
  const [isNewPartDialogOpen, setIsNewPartDialogOpen] = useState(false);
  
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

  // Função para verificar autenticação e diagóstico
  const checkAuthentication = async () => {
    try {
      const response = await apiRequest('GET', '/api/frota/diagnostico');
      const data = await response.json();
      
      toast({
        title: data.isAuthenticated ? 'Autenticação OK ✅' : 'Autenticação Falhou ❌',
        description: (
          <div className="mt-2 text-xs">
            <p>Host: {data.host}</p>
            <p>Sessão ID: {data.session?.id || 'N/A'}</p>
            <p>Cookie domain: {data.session?.cookie?.domain || 'N/A'}</p>
            <p>User ID: {data.user?.id || 'N/A'}</p>
            <p>User Email: {data.user?.email || 'N/A'}</p>
          </div>
        ),
        duration: 10000,
      });
      
      console.log('Diagnóstico de autenticação:', data);
    } catch (error) {
      console.error('Erro ao verificar autenticação:', error);
      toast({
        title: 'Erro ao verificar autenticação',
        description: `${error}`,
        variant: 'destructive',
      });
    }
  };
  
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
      unidade_medida: 'unidade',
    },
  });

  // Carregar todas as peças
  const { 
    data: parts = [], 
    isLoading: isLoadingParts,
    isError: isErrorParts,
    refetch: refetchParts
  } = useQuery<Part[]>({
    queryKey: ['/api/frota/estoque-pecas'],
    refetchOnWindowFocus: false
  });

  // Carregar resumo do estoque
  const { 
    data: summary, 
    isLoading: isLoadingSummary 
  } = useQuery<StockSummary>({
    queryKey: ['/api/frota/estoque-resumo'],
    refetchOnWindowFocus: false
  });

  // Filtrar peças com base no termo de busca
  useEffect(() => {
    if (parts) {
      setFilteredParts(
        parts.filter(part => 
          part.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
          part.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (part.categoria && part.categoria.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (part.fabricante && part.fabricante.toLowerCase().includes(searchTerm.toLowerCase()))
        )
      );
    }
  }, [searchTerm, parts]);

  // Função para submeter movimentação de estoque
  const onSubmitMovement = async (data: z.infer<typeof movimentacaoEstoqueSchema>) => {
    if (!selectedPart) return;
    
    try {
      const response = await apiRequest('POST', '/api/frota/movimentacao-estoque', {
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

  // Função para submeter nova peça com tratamento robusto de erros
  const onSubmitNewPart = async (data: z.infer<typeof novaPecaSchema>) => {
    try {
      // Log para depuração
      console.log('Enviando dados para cadastro de peça:', data);
      
      let response;
      try {
        // Primeira tentativa com apiRequest
        response = await apiRequest('POST', '/api/frota/estoque-pecas', data);
      } catch (apiError) {
        console.error('Falha na primeira tentativa com apiRequest:', apiError);
        
        // Segunda tentativa com fetch direta e recuperação de tokens
        // Obter token Supabase se disponível
        let authToken = localStorage.getItem('authToken');
        let supabaseToken = null;
        
        try {
          const { supabase } = await import('@/lib/supabase');
          const session = await supabase.auth.getSession();
          if (session?.data?.session?.access_token) {
            supabaseToken = session.data.session.access_token;
          }
        } catch (tokenError) {
          console.error('Erro ao obter token Supabase:', tokenError);
        }
        
        const tokenToUse = authToken || supabaseToken;
        const headers: HeadersInit = {
          'Content-Type': 'application/json'
        };
        
        if (tokenToUse) {
          headers['Authorization'] = `Bearer ${tokenToUse}`;
        }
        
        response = await fetch('/api/frota/estoque-pecas', {
          method: 'POST',
          headers,
          credentials: 'include',
          body: JSON.stringify(data)
        });
      }
      
      const result = await response.json();
      
      if (response.ok) {
        toast({
          title: 'Peça cadastrada',
          description: `Peça "${data.nome}" cadastrada com sucesso com código ${result.codigo}`,
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

  // Funções para exportar e importar Excel
  const handleExportExcel = async () => {
    try {
      const response = await apiRequest('GET', '/api/frota/estoque-exportar');
      
      if (response.ok) {
        // Criar URL para download
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `estoque-pecas-${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        toast({
          title: 'Exportação concluída',
          description: 'Arquivo Excel gerado com sucesso',
        });
      } else {
        throw new Error('Erro ao exportar dados');
      }
    } catch (error) {
      toast({
        title: 'Erro na exportação',
        description: 'Não foi possível gerar o arquivo Excel',
        variant: 'destructive',
      });
    }
  };

  // Função para obter template de importação
  const handleDownloadTemplate = async () => {
    try {
      const response = await apiRequest('GET', '/api/frota/estoque-template');
      
      if (response.ok) {
        // Criar URL para download
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'template-importacao-estoque.xlsx';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        toast({
          title: 'Template gerado',
          description: 'Template para importação baixado com sucesso',
        });
      } else {
        throw new Error('Erro ao gerar template');
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível gerar o template',
        variant: 'destructive',
      });
    }
  };

  // Função para importar arquivo Excel
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      // Usar a função apiRequest atualizada com suporte a FormData
      const response = await apiRequest('POST', '/api/frota/estoque-importar', formData, true);
      const result = await response.json();
      
      if (response.ok) {
        toast({
          title: 'Importação concluída',
          description: `${result.processados} registro(s) importado(s) com sucesso. ${result.erros || 0} erro(s)`,
        });
        refetchParts();
      } else {
        throw new Error(result.message || 'Erro na importação');
      }
    } catch (error: any) {
      toast({
        title: 'Erro na importação',
        description: error.message || 'Ocorreu um erro ao processar o arquivo',
        variant: 'destructive',
      });
    }
    
    // Limpar o input de arquivo
    e.target.value = '';
  };

  // Renderização do componente
  return (
    <AppLayout>
      <div className="container mx-auto py-6">
        <div className="flex flex-col gap-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold flex items-center">
                <Package className="mr-2 h-8 w-8" />
                Estoque de Peças
              </h1>
              <p className="text-muted-foreground mt-1">
                Gerenciamento completo do estoque de peças da frota
              </p>
            </div>
            
            <div className="flex space-x-2">
              <Button variant="outline" onClick={handleDownloadTemplate}>
                <Download className="mr-2 h-4 w-4" />
                Template
              </Button>
              <Button variant="outline" onClick={handleExportExcel}>
                <FileDown className="mr-2 h-4 w-4" />
                Exportar
              </Button>
              <div className="relative">
                <Button variant="outline">
                  <FileUp className="mr-2 h-4 w-4" />
                  Importar
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    onChange={handleFileUpload}
                  />
                </Button>
              </div>
              <Button variant="outline" onClick={checkAuthentication}>
                <AlertCircle className="mr-2 h-4 w-4" />
                Diagnóstico
              </Button>
              <Button onClick={() => setIsNewPartDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Nova Peça
              </Button>
            </div>
          </div>

          {/* Resumo do Estoque */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total de Itens</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isLoadingSummary ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    summary?.total_itens || 0
                  )}
                </div>
                <p className="text-xs text-muted-foreground">Diferentes SKUs em estoque</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Quantidade Total</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isLoadingSummary ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    summary?.total_quantidade || 0
                  )}
                </div>
                <p className="text-xs text-muted-foreground">Unidades em estoque</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isLoadingSummary ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    `R$ ${(summary?.valor_total_estoque || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                  )}
                </div>
                <p className="text-xs text-muted-foreground">Valor do estoque</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Estoque Baixo</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-amber-500">
                  {isLoadingSummary ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    summary?.itens_abaixo_minimo || 0
                  )}
                </div>
                <p className="text-xs text-muted-foreground">Itens abaixo do mínimo</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Estoque Zero</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">
                  {isLoadingSummary ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    summary?.itens_zerados || 0
                  )}
                </div>
                <p className="text-xs text-muted-foreground">Itens com estoque zerado</p>
              </CardContent>
            </Card>
          </div>

          {/* Tabs com diferentes visualizações */}
          <Tabs defaultValue="todos">
            <div className="flex justify-between items-center mb-4">
              <TabsList>
                <TabsTrigger value="todos">Todos</TabsTrigger>
                <TabsTrigger value="baixo">Estoque Baixo</TabsTrigger>
                <TabsTrigger value="zerado">Estoque Zerado</TabsTrigger>
              </TabsList>
              
              <div className="flex items-center space-x-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por código, nome, categoria..."
                  className="w-[300px]"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            
            <TabsContent value="todos" className="mt-0">
              <Card>
                <CardContent className="p-0">
                  {isLoadingParts ? (
                    <div className="flex justify-center items-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : isErrorParts ? (
                    <div className="flex flex-col items-center justify-center py-8 text-destructive">
                      <AlertCircle className="h-8 w-8 mb-2" />
                      <p>Erro ao carregar dados do estoque</p>
                    </div>
                  ) : filteredParts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                      <PackageOpen className="h-12 w-12 mb-2" />
                      <p className="text-lg font-medium">Nenhuma peça encontrada</p>
                      <p className="text-sm">Nenhuma peça corresponde aos critérios de busca</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Código</TableHead>
                          <TableHead>Nome</TableHead>
                          <TableHead>Categoria</TableHead>
                          <TableHead>Fabricante</TableHead>
                          <TableHead className="text-right">Estoque</TableHead>
                          <TableHead className="text-right">Mínimo</TableHead>
                          <TableHead className="text-right">Valor Unit.</TableHead>
                          <TableHead className="text-right">Valor Total</TableHead>
                          <TableHead className="text-center">Status</TableHead>
                          <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredParts.map((part) => (
                          <TableRow key={part.id}>
                            <TableCell className="font-medium">{part.codigo}</TableCell>
                            <TableCell>{part.nome}</TableCell>
                            <TableCell>{part.categoria || '-'}</TableCell>
                            <TableCell>{part.fabricante || '-'}</TableCell>
                            <TableCell className="text-right">
                              {part.quantidade} {part.unidade_medida}
                            </TableCell>
                            <TableCell className="text-right">{part.estoque_minimo}</TableCell>
                            <TableCell className="text-right">
                              R$ {part.valor_unitario.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </TableCell>
                            <TableCell className="text-right">
                              R$ {part.valor_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </TableCell>
                            <TableCell className="text-center">
                              {part.quantidade <= 0 ? (
                                <Badge variant="destructive">Zerado</Badge>
                              ) : part.quantidade < part.estoque_minimo ? (
                                <Badge variant="warning" className="bg-amber-500">Baixo</Badge>
                              ) : (
                                <Badge variant="success" className="bg-green-500">OK</Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenMovementDialog(part)}
                              >
                                <ArrowUpDown className="h-4 w-4 mr-1" />
                                Movimentar
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* As outras TabsContent (baixo, zerado) teriam conteúdo similar */}
          </Tabs>
        </div>
      </div>

      {/* Dialog para movimentação de estoque */}
      <Dialog open={isMovementDialogOpen} onOpenChange={setIsMovementDialogOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto my-4 p-6">
          <DialogHeader className="mb-4">
            <DialogTitle>Movimentação de Estoque</DialogTitle>
            <DialogDescription>
              {selectedPart && (
                <>
                  Peça: <strong>{selectedPart.codigo}</strong> - {selectedPart.nome}<br />
                  Estoque atual: <strong>{selectedPart.quantidade} {selectedPart.unidade_medida}</strong>
                </>
              )}
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
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo de movimento" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="entrada">Entrada</SelectItem>
                        <SelectItem value="saida">Saída</SelectItem>
                        <SelectItem value="ajuste">Ajuste de Estoque</SelectItem>
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
                      <Input type="number" min="1" {...field} />
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
                      <Input {...field} placeholder="Ex: Compra, Uso em manutenção, Inventário" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={movementForm.control}
                name="nota_fiscal"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nota Fiscal (opcional)</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Número da nota fiscal" />
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
                    <FormLabel>Placa do Veículo (opcional)</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Para caso de saídas para veículos" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={movementForm.control}
                name="observacoes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observações (opcional)</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="Observações adicionais" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="submit" disabled={movementForm.formState.isSubmitting}>
                  {movementForm.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Confirmar Movimentação
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Dialog para nova peça */}
      <Dialog open={isNewPartDialogOpen} onOpenChange={setIsNewPartDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto my-4 p-6">
          <DialogHeader className="mb-4">
            <DialogTitle>Cadastrar Nova Peça</DialogTitle>
            <DialogDescription>
              Preencha os campos abaixo para cadastrar uma nova peça no estoque.
              O código será gerado automaticamente.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...newPartForm}>
            <form onSubmit={newPartForm.handleSubmit(onSubmitNewPart)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={newPartForm.control}
                  name="nome"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome da Peça*</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Ex: Filtro de Óleo" />
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
                        <Input {...field} placeholder="Ex: Filtros, Freios, Elétrica" />
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
                      <Textarea {...field} placeholder="Descrição detalhada da peça" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={newPartForm.control}
                  name="fabricante"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fabricante</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Ex: Bosch, Mann, Sachs" />
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
                      <FormLabel>Unidade de Medida</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a unidade" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="unidade">Unidade</SelectItem>
                          <SelectItem value="litro">Litro</SelectItem>
                          <SelectItem value="metro">Metro</SelectItem>
                          <SelectItem value="kg">Kg</SelectItem>
                          <SelectItem value="par">Par</SelectItem>
                          <SelectItem value="conjunto">Conjunto</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={newPartForm.control}
                  name="localizacao"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Localização no Estoque</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Ex: Prateleira A3" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={newPartForm.control}
                name="aplicacao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Aplicação</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Ex: Veículos ou modelos compatíveis" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={newPartForm.control}
                  name="quantidade"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quantidade Inicial</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" {...field} />
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
                      <FormLabel>Valor Unitário (R$)*</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={newPartForm.control}
                  name="estoque_minimo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estoque Mínimo</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <DialogFooter>
                <Button type="submit" disabled={newPartForm.formState.isSubmitting}>
                  {newPartForm.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Cadastrar Peça
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}