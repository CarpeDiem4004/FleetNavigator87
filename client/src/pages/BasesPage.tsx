import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { apiRequest } from '@/lib/queryClient';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { parseBasesData, importBasesToSystem } from '@/utils/importBases';
import CocaColaBasesList from '@/components/bases/CocaColaBasesList';

import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
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
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Building2, Loader2, Plus, Edit, Trash2, Award, Download, Upload, DatabaseIcon } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { insertBaseSchema } from '@shared/schema';
import { AuthProvider, useAuth } from '@/context/AuthContext';

// Interface para a base
interface Base {
  id: number;
  name: string;
  location?: string;
  operation?: string;
  active: boolean;
  created_at: string;
}

// Schema para o formulário, estendendo o schema existente
const baseFormSchema = insertBaseSchema.extend({
  name: z.string().min(3, 'O nome da base deve ter pelo menos 3 caracteres'),
});

// Componente da página de Bases
export default function BasesPage() {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [baseToDelete, setBaseToDelete] = useState<Base | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importMessage, setImportMessage] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<boolean | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  // Formulário para adicionar/editar base
  const form = useForm<z.infer<typeof baseFormSchema>>({
    resolver: zodResolver(baseFormSchema),
    defaultValues: {
      name: '',
      location: '',
      operation: '',
      active: true,
    },
  });

  // Query para buscar as bases
  const { data: bases = [], isLoading, error, refetch } = useQuery<Base[]>({
    queryKey: ['/api/bases'],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/bases');
        if (!response.ok) {
          throw new Error(`Erro ao buscar bases: ${response.status}`);
        }
        const data = await response.json();
        return data || [];
      } catch (error) {
        console.error('Erro ao buscar bases:', error);
        return [];
      }
    },
  });

  // Mutation para adicionar uma nova base
  const createBaseMutation = useMutation({
    mutationFn: async (data: z.infer<typeof baseFormSchema>) => {
      const response = await apiRequest('POST', '/api/bases', data);
      return response;
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
      return response;
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
      return response;
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

  // Função para importar bases em massa
  const handleImportBases = async () => {
    try {
      setIsImporting(true);
      setImportMessage("Importando bases...");
      setImportSuccess(null);
      
      const result = await importBasesToSystem(apiRequest);
      
      if (result.success) {
        setImportMessage(`${result.message} (${result.newBases} de ${result.totalBases} bases importadas)`);
        setImportSuccess(true);
        queryClient.invalidateQueries({ queryKey: ['/api/bases'] });
        
        toast({
          title: 'Bases importadas com sucesso',
          description: result.message,
        });
      } else {
        setImportMessage(result.message);
        setImportSuccess(false);
        
        toast({
          title: 'Erro ao importar bases',
          description: result.message,
          variant: 'destructive',
        });
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Erro desconhecido';
      setImportMessage(`Erro ao importar: ${errorMsg}`);
      setImportSuccess(false);
      
      toast({
        title: 'Erro ao importar bases',
        description: errorMsg,
        variant: 'destructive',
      });
    } finally {
      setIsImporting(false);
    }
  };

  // Função para abrir o diálogo de edição
  const handleEdit = (base: Base) => {
    form.reset({
      name: base.name,
      location: base.location || '',
      operation: base.operation || '',
      active: base.active,
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
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy HH:mm', { locale: ptBR });
    } catch (error) {
      return 'Data inválida';
    }
  };

  // Agrupar bases por operação
  const basesByOperation = bases.reduce((acc, base) => {
    const operation = base.operation || 'Sem Operação';
    if (!acc[operation]) {
      acc[operation] = [];
    }
    acc[operation].push(base);
    return acc;
  }, {} as Record<string, Base[]>);

  // Contar operações únicas
  const uniqueOperations = Object.keys(basesByOperation).length;

  return (
    <div className="p-6 max-w-7xl mx-auto">
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
          {/* Botão Importar Bases */}
          <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Upload className="h-4 w-4" />
                Importar Bases
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[525px]">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <DatabaseIcon className="h-5 w-5" />
                  Importar Bases em Massa
                </DialogTitle>
                <DialogDescription>
                  Importe todas as bases cadastradas no arquivo com suas respectivas operações
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <div className="rounded-lg border p-4 bg-muted/50">
                  <h3 className="font-medium mb-2">Informações da importação</h3>
                  <p className="text-sm">
                    Serão importadas todas as bases com suas operações do arquivo fornecido.
                    Este processo importará bases como:
                  </p>
                  <ul className="text-sm mt-2 space-y-1 list-disc list-inside">
                    <li>COCA COLA (ABC) - Operação: COCA COLA</li>
                    <li>GP01 VARGEM GRANDE (GRUPO PEREIRA) - Operação: GRUPO PEREIRA</li>
                    <li>SC (BAHIA SALVADOR) SBA1 - Operação: MERCADO LIVRE</li>
                  </ul>
                  <p className="text-sm mt-2">
                    Aproximadamente {parseBasesData().length} bases serão importadas.
                  </p>
                </div>
                
                {importMessage && (
                  <div className={`mt-4 p-3 rounded-md ${
                    importSuccess === true ? 'bg-green-50 text-green-800' : 
                    importSuccess === false ? 'bg-red-50 text-red-800' : 
                    'bg-blue-50 text-blue-800'
                  }`}>
                    {importMessage}
                  </div>
                )}
              </div>
              
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsImportDialogOpen(false)}
                  disabled={isImporting}
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={handleImportBases} 
                  disabled={isImporting}
                  className="gap-2"
                >
                  {isImporting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <DatabaseIcon className="h-4 w-4" />
                  )}
                  {isImporting ? 'Importando...' : 'Iniciar Importação'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          {/* Botão Adicionar Base */}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2" onClick={() => {
                setIsEditing(false);
                form.reset({
                  name: '',
                  location: '',
                  operation: '',
                  active: true,
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
                          <Input 
                            placeholder="Ex: São Paulo, SP" 
                            value={field.value || ''} 
                            onChange={field.onChange}
                            onBlur={field.onBlur}
                            name={field.name}
                            ref={field.ref}
                          />
                        </FormControl>
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
                          <Input 
                            placeholder="Ex: COCA COLA" 
                            value={field.value || ''} 
                            onChange={field.onChange}
                            onBlur={field.onBlur}
                            name={field.name}
                            ref={field.ref}
                          />
                        </FormControl>
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
                            checked={field.value === true}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
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

      {/* Cards de estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Bases
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : bases.length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Operações Ativas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : uniqueOperations}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Bases Ativas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                bases.filter(base => base.active).length
              )}
            </div>
          </CardContent>
        </Card>
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
                    <TableHead>Operação</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data de Cadastro</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bases.length > 0 ? (
                    bases.map((base) => (
                      <TableRow key={base.id}>
                        <TableCell className="font-medium">{base.id}</TableCell>
                        <TableCell>{base.name}</TableCell>
                        <TableCell>{base.location || '-'}</TableCell>
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
                      <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
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
  );
}