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
import AppLayout from '@/components/layout/AppLayout';

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
  const { toast } = useToast();

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
  const { data: bases, isLoading, refetch } = useQuery<Base[]>({
    queryKey: ['/api/bases'],
    queryFn: () => apiRequest('GET', '/api/bases'),
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
                          <Input placeholder="Ex: São Paulo, SP" {...field} />
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
                          <Input placeholder="Ex: COCA COLA" {...field} />
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
                            checked={field.value}
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
                    {bases && bases.length > 0 ? (
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
    </AppLayout>
  );
}