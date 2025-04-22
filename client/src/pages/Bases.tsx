import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { parseBasesData, importBasesToSystem } from '@/utils/importBases';
import { apiRequest } from '@/lib/queryClient';
import { Base, insertBaseSchema } from '@shared/schema';
import AppLayout from '@/components/layout/AppLayout';
import { useToast } from '@/hooks/use-toast';

import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
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
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Building2, 
  Building,
  Plus, 
  Edit, 
  Trash2, 
  Loader2, 
  Award, 
  FileUp,
  Wrench,
  Database as DatabaseIcon
} from 'lucide-react';

// Schema para o formulário, estendendo o schema existente
const baseFormSchema = insertBaseSchema.extend({
  name: z.string().min(3, 'O nome da base deve ter pelo menos 3 caracteres'),
  type: z.string().optional(),
});

// Componente da página de Bases
export default function BasesPage() {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [baseToDelete, setBaseToDelete] = useState<Base | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [importText, setImportText] = useState('');
  const [importingBases, setImportingBases] = useState(false);
  const [importPreview, setImportPreview] = useState<Partial<Base>[]>([]);
  const [customOperation, setCustomOperation] = useState('');
  const { toast } = useToast();
  
  // Formulário para adicionar/editar base
  const form = useForm<z.infer<typeof baseFormSchema>>({
    resolver: zodResolver(baseFormSchema),
    defaultValues: {
      name: '',
      location: '',
      operation: '',
      type: '',
      active: true,
      hasMaintenance: false,
      hasTires: false,
    },
  });

  // Query para buscar as bases
  const { data: bases, isLoading, refetch } = useQuery<Base[]>({
    queryKey: ['/api/bases'],
    queryFn: () => apiRequest('GET', '/api/bases').then(res => res.json()),
  });
  
  // Obter as operações cadastradas no sistema
  const existingOperations = React.useMemo(() => {
    if (!bases) return [];
    
    // Filtrar bases que têm operação definida e são do tipo operacao
    const operations = bases
      .filter(base => base.operation && base.type === 'operacao')
      .map(base => base.operation)
      .filter((operation): operation is string => operation !== null && operation !== undefined && operation !== '');
      
    // Remover duplicatas usando um array temporário para evitar problemas com o Set
    const uniqueOperations: string[] = [];
    operations.forEach(op => {
      if (op && !uniqueOperations.includes(op)) {
        uniqueOperations.push(op);
      }
    });
    
    // Ordenar as operações
    return uniqueOperations.sort();
  }, [bases]);

  // Mutation para adicionar uma nova base
  const createBaseMutation = useMutation({
    mutationFn: async (data: z.infer<typeof baseFormSchema>) => {
      const response = await apiRequest('POST', '/api/bases', data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Base criada com sucesso',
        description: 'A nova base foi adicionada ao sistema',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/bases'] });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao criar base',
        description: error.message || 'Ocorreu um erro ao criar a base',
        variant: 'destructive',
      });
    },
  });

  // Mutation para atualizar uma base existente
  const updateBaseMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<z.infer<typeof baseFormSchema>> }) => {
      const response = await apiRequest('PATCH', `/api/bases/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Base atualizada com sucesso',
        description: 'As informações da base foram atualizadas',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/bases'] });
      setIsDialogOpen(false);
      setIsEditing(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao atualizar base',
        description: error.message || 'Ocorreu um erro ao atualizar a base',
        variant: 'destructive',
      });
    },
  });

  // Mutation para excluir uma base
  const deleteBaseMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('DELETE', `/api/bases/${id}`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Base excluída com sucesso',
        description: 'A base foi removida do sistema',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/bases'] });
      setIsDeleteDialogOpen(false);
      setBaseToDelete(null);
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao excluir base',
        description: error.message || 'Ocorreu um erro ao excluir a base',
        variant: 'destructive',
      });
    },
  });

  // Função para abrir o diálogo de edição
  const handleEdit = (base: Base) => {
    form.reset({
      name: base.name,
      location: base.location || '',
      operation: base.operation || '',
      type: base.type || '',
      active: base.active,
      hasMaintenance: base.hasMaintenance || false,
      hasTires: base.hasTires || false,
    });
    setIsEditing(true);
    setBaseToDelete(base);
    setIsDialogOpen(true);
  };

  // Função para abrir o diálogo de exclusão
  const handleDelete = (base: Base) => {
    setBaseToDelete(base);
    setIsDeleteDialogOpen(true);
  };

  // Função para confirmar a exclusão
  const confirmDelete = () => {
    if (baseToDelete) {
      deleteBaseMutation.mutate(baseToDelete.id);
    }
  };

  // Função para enviar o formulário
  const onSubmit = (data: z.infer<typeof baseFormSchema>) => {
    if (isEditing && baseToDelete) {
      updateBaseMutation.mutate({ id: baseToDelete.id, data });
    } else {
      createBaseMutation.mutate(data);
    }
  };

  // Formatar data
  const formatDate = (dateString: string | Date | null) => {
    if (!dateString) return '-';
    try {
      return format(new Date(dateString), 'dd/MM/yyyy HH:mm', { locale: ptBR });
    } catch (error) {
      return 'Data inválida';
    }
  };

  // Função para lidar com a importação de bases
  const handleImportPreview = () => {
    if (!importText.trim()) {
      toast({
        title: "Texto vazio",
        description: "Por favor, insira o texto com as bases para importar",
        variant: "destructive"
      });
      return;
    }

    const parsedBases = parseBasesData(importText);
    setImportPreview(parsedBases);
  };

  // Função para confirmar a importação de bases
  const handleImportConfirm = async () => {
    if (importPreview.length === 0) {
      return;
    }

    setImportingBases(true);
    try {
      const importedCount = await importBasesToSystem(importPreview);
      toast({
        title: "Importação concluída",
        description: `${importedCount} bases foram importadas com sucesso`,
      });
      setIsImportDialogOpen(false);
      setImportText('');
      setImportPreview([]);
      queryClient.invalidateQueries({ queryKey: ['/api/bases'] });
    } catch (error) {
      toast({
        title: "Erro na importação",
        description: "Ocorreu um erro ao importar as bases",
        variant: "destructive"
      });
    } finally {
      setImportingBases(false);
    }
  };

  return (
    <AppLayout>
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold flex items-center">
              <Building2 className="mr-2 h-8 w-8" />
              Gerenciamento de Bases
            </h1>
            <p className="text-muted-foreground mt-1">
              Gerencie as bases e suas respectivas operações
            </p>
          </div>
          <div className="flex gap-2">
            <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <FileUp className="h-4 w-4" />
                  Importar Bases
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>Importar Bases</DialogTitle>
                  <DialogDescription>
                    Cole a lista de bases para importar. As bases SC serão configuradas automaticamente com suporte a 
                    solicitação de manutenção e pneus.
                  </DialogDescription>
                </DialogHeader>
                
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="import-text">Texto para importação</Label>
                    <Textarea
                      id="import-text"
                      placeholder="Cole a lista de bases aqui..."
                      value={importText}
                      onChange={(e) => setImportText(e.target.value)}
                      rows={10}
                      className="font-mono text-sm"
                    />
                  </div>
                </div>

                {importPreview.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="text-sm font-medium">Preview ({importPreview.length} bases)</h4>
                    </div>
                    <div className="border rounded-md max-h-40 overflow-y-auto p-2">
                      <ul className="text-sm space-y-1">
                        {importPreview.map((base, idx) => (
                          <li key={idx} className="flex items-center justify-between">
                            <span className="font-medium">{base.name}</span>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              {base.hasMaintenance && (
                                <div className="flex items-center gap-1 text-blue-600">
                                  <Wrench className="h-3 w-3" />
                                  <span>Manutenção</span>
                                </div>
                              )}
                              {base.hasTires && (
                                <div className="flex items-center gap-1 text-green-600">
                                  <DatabaseIcon className="h-3 w-3" />
                                  <span>Pneus</span>
                                </div>
                              )}
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
                
                <DialogFooter>
                  <Button variant="outline" onClick={() => handleImportPreview()} disabled={!importText.trim() || importingBases}>
                    Visualizar
                  </Button>
                  <Button 
                    onClick={() => handleImportConfirm()}
                    disabled={importPreview.length === 0 || importingBases}
                  >
                    {importingBases && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Importar
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2" onClick={() => {
                  setIsEditing(false);
                  form.reset({
                    name: '',
                    location: '',
                    operation: '',
                    type: '',
                    active: true,
                    hasMaintenance: false,
                    hasTires: false,
                  });
                }}>
                  <Plus className="h-4 w-4" />
                  Adicionar Base
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[525px]">
                <DialogHeader>
                  <DialogTitle>
                    {isEditing ? 'Editar Base' : 'Nova Base'}
                  </DialogTitle>
                  <DialogDescription>
                    {isEditing
                      ? 'Atualize as informações da base selecionada'
                      : 'Preencha as informações para adicionar uma nova base'}
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome da Base</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: Base São Paulo" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="location"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Localização</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: São Paulo, SP" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tipo de Base</FormLabel>
                          <FormControl>
                            <Select
                              value={field.value || ''}
                              onValueChange={field.onChange}
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Selecione o tipo de base" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="">Nenhum tipo</SelectItem>
                                <SelectItem value="filial">Filial</SelectItem>
                                <SelectItem value="sc">Centro de Serviço (SC)</SelectItem>
                                <SelectItem value="operacao">Operação</SelectItem>
                                <SelectItem value="base_avançada">Base Avançada</SelectItem>
                                <SelectItem value="administracao">Administração</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormDescription>
                            O tipo de base define suas características e permissões no sistema.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="operation"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Operação</FormLabel>
                          <FormControl>
                            <div className="flex flex-col space-y-2">
                              <Select
                                value={field.value || ''}
                                onValueChange={(value) => {
                                  field.onChange(value);
                                  setCustomOperation('');
                                }}
                              >
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder="Selecione uma operação existente" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="">Nenhuma operação</SelectItem>
                                  {existingOperations.map((op) => (
                                    <SelectItem key={op} value={op}>{op}</SelectItem>
                                  ))}
                                  <SelectItem value="custom">-- Adicionar nova operação --</SelectItem>
                                </SelectContent>
                              </Select>
                              
                              {field.value === 'custom' && (
                                <div className="mt-2">
                                  <Input
                                    placeholder="Digite o nome da nova operação"
                                    value={customOperation}
                                    onChange={(e) => {
                                      setCustomOperation(e.target.value);
                                      // Atualiza o campo do formulário com o valor personalizado
                                      if (e.target.value) {
                                        field.onChange(e.target.value);
                                      }
                                    }}
                                  />
                                </div>
                              )}
                            </div>
                          </FormControl>
                          <FormDescription>
                            Selecione uma das operações existentes ou adicione uma nova.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="active"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                          <div className="space-y-0.5">
                            <FormLabel>Status</FormLabel>
                            <FormDescription>
                              Determine se a base está ativa ou inativa
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <div className="space-y-4">
                      <h3 className="font-medium text-sm">Configurações da Base</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="hasMaintenance"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-2">
                                  <Wrench className="h-4 w-4 text-blue-600" />
                                  <FormLabel>Manutenção</FormLabel>
                                </div>
                                <FormDescription>
                                  Habilitar solicitações de manutenção
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="hasTires"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-2">
                                  <DatabaseIcon className="h-4 w-4 text-green-600" />
                                  <FormLabel>Pneus</FormLabel>
                                </div>
                                <FormDescription>
                                  Habilitar gerenciamento de pneus
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="submit" disabled={createBaseMutation.isPending || updateBaseMutation.isPending}>
                        {(createBaseMutation.isPending || updateBaseMutation.isPending) && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        {isEditing ? 'Atualizar' : 'Adicionar'}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Dialog de confirmação de exclusão */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Confirmação de Exclusão</DialogTitle>
              <DialogDescription>
                Você está prestes a excluir a base "{baseToDelete?.name}".
                Esta ação não pode ser desfeita.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                Cancelar
              </Button>
              <Button variant="destructive" onClick={confirmDelete} disabled={deleteBaseMutation.isPending}>
                {deleteBaseMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Excluir
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Tabela de bases */}
        <Card>
          <CardHeader>
            <CardTitle>Bases Cadastradas</CardTitle>
            <CardDescription>
              Lista de todas as bases e suas operações
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center h-40">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableCaption>Lista de bases cadastradas no sistema</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead>Localização</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Operação</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Manutenção</TableHead>
                      <TableHead>Pneus</TableHead>
                      <TableHead>Data de Cadastro</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bases && bases.length > 0 ? (
                      bases.map((base) => (
                        <TableRow key={base.id}>
                          <TableCell className="font-medium">{base.id}</TableCell>
                          <TableCell>{base.name}</TableCell>
                          <TableCell>{base.location || '-'}</TableCell>
                          <TableCell>
                            {base.type ? (
                              <div className="flex items-center gap-2">
                                <Building2 className="h-4 w-4 text-blue-500" />
                                {base.type === 'sc' ? 'Centro de Serviço' :
                                 base.type === 'filial' ? 'Filial' :
                                 base.type === 'operacao' ? 'Operação' :
                                 base.type === 'base_avançada' ? 'Base Avançada' :
                                 base.type === 'administracao' ? 'Administração' :
                                 base.type}
                              </div>
                            ) : (
                              '-'
                            )}
                          </TableCell>
                          <TableCell>
                            {base.operation ? (
                              <div className="flex items-center gap-2">
                                <Award className="h-4 w-4 text-primary" />
                                {base.operation}
                              </div>
                            ) : (
                              '-'
                            )}
                          </TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${base.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                              {base.active ? 'Ativa' : 'Inativa'}
                            </span>
                          </TableCell>
                          <TableCell>
                            {base.hasMaintenance ? (
                              <div className="flex items-center gap-1 text-blue-600">
                                <Wrench className="h-4 w-4" />
                                <span>Habilitado</span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-sm">Não habilitado</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {base.hasTires ? (
                              <div className="flex items-center gap-1 text-green-600">
                                <DatabaseIcon className="h-4 w-4" />
                                <span>Habilitado</span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-sm">Não habilitado</span>
                            )}
                          </TableCell>
                          <TableCell>{formatDate(base.created_at)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => handleEdit(base)}
                              >
                                <Edit className="h-4 w-4" />
                                <span className="sr-only">Editar</span>
                              </Button>
                              <Button
                                variant="outline"
                                size="icon"
                                className="text-destructive hover:bg-destructive/10"
                                onClick={() => handleDelete(base)}
                              >
                                <Trash2 className="h-4 w-4" />
                                <span className="sr-only">Excluir</span>
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={10} className="text-center py-6 text-muted-foreground">
                          Nenhuma base cadastrada
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}