import React, { useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  CardFooter 
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Building2, Plus, Wrench, Phone, MapPin, AlertTriangle, Clock, ArrowRight, FileCheck } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { Switch } from '@/components/ui/switch';
import { Link } from 'wouter';
import { useContext } from 'react';
import { AuthContext } from '@/context/AuthContext';

interface Workshop {
  id: number;
  name: string;
  address: string;
  phone: string;
  contactPerson: string;
  isSpecialized: boolean;
  isActive: boolean;
  specialties?: string;
  observations?: string;
}

interface PendingWorkshop {
  id: number;
  name: string;
  cnpj?: string;
  email?: string;
  approval_status: string;
}

export default function WorkshopsPage() {
  const [isOpen, setIsOpen] = useState(false);
  const [editingWorkshop, setEditingWorkshop] = useState<Workshop | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useContext(AuthContext);

  // Verifica se o usuário tem permissão para aprovar oficinas (admin ou gestor_frota)
  const canApproveWorkshops = user?.role === 'admin' || user?.role === 'gestor_frota';

  const [formData, setFormData] = useState<Partial<Workshop>>({
    name: '',
    address: '',
    phone: '',
    contactPerson: '',
    isSpecialized: false,
    isActive: true,
    specialties: '',
    observations: ''
  });
  
  // Buscar oficinas pendentes de aprovação (apenas se o usuário tiver permissão)
  const { data: pendingWorkshops = [], isLoading: isLoadingPending } = useQuery<PendingWorkshop[]>({
    queryKey: ['/api/workshops/pending'],
    refetchOnWindowFocus: false,
    enabled: canApproveWorkshops, // Só executa a query se o usuário tiver permissão
    queryFn: async () => {
      try {
        const response = await fetch('/api/workshops/pending', {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
          }
        });
        
        if (!response.ok) {
          console.error(`Erro ao buscar oficinas pendentes: ${response.status}`);
          return [];
        }
        
        return await response.json();
      } catch (error) {
        console.error('Erro ao buscar oficinas pendentes:', error);
        return [];
      }
    }
  });

  const { data: workshops = [], isLoading } = useQuery<Workshop[]>({
    queryKey: ['/api/workshops'],
    refetchOnWindowFocus: false
  });

  const createWorkshopMutation = useMutation({
    mutationFn: async (data: Partial<Workshop>) => {
      const response = await apiRequest('POST', '/api/workshops', data);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Oficina cadastrada com sucesso',
        description: 'A nova oficina foi adicionada ao sistema',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/workshops'] });
      closeDialog();
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao cadastrar oficina',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  const updateWorkshopMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Workshop> }) => {
      const response = await apiRequest('PUT', `/api/workshops/${id}`, data);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Oficina atualizada com sucesso',
        description: 'As informações foram atualizadas',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/workshops'] });
      closeDialog();
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao atualizar oficina',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  const deleteWorkshopMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('DELETE', `/api/workshops/${id}`);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Oficina removida com sucesso',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/workshops'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao remover oficina',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (name: string, checked: boolean) => {
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.address || !formData.phone) {
      toast({
        title: 'Dados incompletos',
        description: 'Por favor, preencha todos os campos obrigatórios',
        variant: 'destructive'
      });
      return;
    }

    if (editingWorkshop) {
      updateWorkshopMutation.mutate({ id: editingWorkshop.id, data: formData });
    } else {
      createWorkshopMutation.mutate(formData);
    }
  };

  const openNewWorkshopDialog = () => {
    setFormData({
      name: '',
      address: '',
      phone: '',
      contactPerson: '',
      isSpecialized: false,
      isActive: true,
      specialties: '',
      observations: ''
    });
    setEditingWorkshop(null);
    setIsOpen(true);
  };

  const openEditWorkshopDialog = (workshop: Workshop) => {
    setFormData({
      name: workshop.name,
      address: workshop.address,
      phone: workshop.phone,
      contactPerson: workshop.contactPerson,
      isSpecialized: workshop.isSpecialized,
      isActive: workshop.isActive,
      specialties: workshop.specialties || '',
      observations: workshop.observations || ''
    });
    setEditingWorkshop(workshop);
    setIsOpen(true);
  };

  const closeDialog = () => {
    setIsOpen(false);
  };

  const handleDelete = (id: number) => {
    if (confirm('Tem certeza que deseja remover esta oficina?')) {
      deleteWorkshopMutation.mutate(id);
    }
  };

  return (
    <AppLayout>
      <div className="container mx-auto py-6">
        <div className="flex flex-col gap-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold flex items-center">
                <Building2 className="mr-2 h-8 w-8" />
                Oficinas Credenciadas
              </h1>
              <p className="text-muted-foreground mt-1">
                Gerencie as oficinas parceiras para manutenção da frota
              </p>
            </div>
            <Button onClick={openNewWorkshopDialog}>
              <Plus className="mr-2 h-4 w-4" />
              Nova Oficina
            </Button>
          </div>
          
          {/* Card de oficinas pendentes de aprovação - só mostra se o usuário tiver permissão */}
          {canApproveWorkshops && pendingWorkshops.length > 0 && (
            <Card className="border-amber-300 bg-amber-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center text-amber-800">
                  <Clock className="h-5 w-5 mr-2" />
                  Novas Oficinas Pendentes
                </CardTitle>
                <CardDescription className="text-amber-700">
                  Existem {pendingWorkshops.length} {pendingWorkshops.length === 1 ? 'oficina aguardando' : 'oficinas aguardando'} sua aprovação
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-amber-800 mb-4">
                  Oficinas que solicitaram cadastro no sistema e precisam de sua aprovação para começar a operar.
                </div>
                <div className="flex flex-wrap gap-2">
                  {pendingWorkshops.slice(0, 3).map((workshop) => (
                    <div key={workshop.id} className="bg-white border border-amber-200 rounded-md p-3 flex-1 min-w-[250px]">
                      <div className="font-medium">{workshop.name}</div>
                      {workshop.cnpj && (
                        <div className="text-xs text-gray-500 mt-1">CNPJ: {workshop.cnpj}</div>
                      )}
                      {workshop.email && (
                        <div className="text-xs text-gray-500 mt-1">Email: {workshop.email}</div>
                      )}
                    </div>
                  ))}
                  {pendingWorkshops.length > 3 && (
                    <div className="bg-white border border-amber-200 rounded-md p-3 flex items-center justify-center flex-1 min-w-[120px]">
                      <div className="text-sm text-amber-700">
                        +{pendingWorkshops.length - 3} {pendingWorkshops.length - 3 === 1 ? 'oficina' : 'oficinas'}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="pt-0">
                <Link to="/fleet-management/workshops/approval">
                  <Button variant="outline" className="text-amber-700 border-amber-300 hover:bg-amber-100 hover:text-amber-800">
                    Revisar Solicitações <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Lista de Oficinas</CardTitle>
              <CardDescription>
                Oficinas cadastradas para manutenção de veículos
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center p-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : workshops.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 text-center">
                  <Wrench className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">Nenhuma oficina cadastrada</h3>
                  <p className="text-sm text-muted-foreground mt-2">
                    Cadastre oficinas para gerenciar manutenções de veículos
                  </p>
                  <Button onClick={openNewWorkshopDialog} variant="outline" className="mt-4">
                    <Plus className="mr-2 h-4 w-4" />
                    Adicionar Oficina
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Endereço</TableHead>
                        <TableHead>Contato</TableHead>
                        <TableHead>Especializada</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {workshops.map((workshop) => (
                        <TableRow key={workshop.id}>
                          <TableCell className="font-medium">{workshop.name}</TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <MapPin className="h-4 w-4 mr-1 text-muted-foreground" />
                              {workshop.address}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <Phone className="h-4 w-4 mr-1 text-muted-foreground" />
                              {workshop.phone}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {workshop.contactPerson}
                            </div>
                          </TableCell>
                          <TableCell>
                            {workshop.isSpecialized ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                Sim
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                Não
                              </span>
                            )}
                            {workshop.specialties && (
                              <div className="text-xs text-muted-foreground mt-1">
                                {workshop.specialties}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            {workshop.isActive ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                Ativa
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                Inativa
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => openEditWorkshopDialog(workshop)}
                            >
                              Editar
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-red-500 hover:text-red-700 hover:bg-red-50"
                              onClick={() => handleDelete(workshop.id)}
                            >
                              Remover
                            </Button>
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
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {editingWorkshop ? 'Editar Oficina' : 'Cadastrar Nova Oficina'}
            </DialogTitle>
            <DialogDescription>
              Preencha os dados da oficina credenciada
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="name" className="text-right">
                    Nome da Oficina *
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="mt-1"
                    required
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="address" className="text-right">
                    Endereço *
                  </Label>
                  <Input
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    className="mt-1"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="phone" className="text-right">
                    Telefone *
                  </Label>
                  <Input
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="mt-1"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="contactPerson" className="text-right">
                    Pessoa de Contato
                  </Label>
                  <Input
                    id="contactPerson"
                    name="contactPerson"
                    value={formData.contactPerson}
                    onChange={handleInputChange}
                    className="mt-1"
                  />
                </div>
                <div className="col-span-2">
                  <div className="flex items-center space-x-2 mt-4">
                    <Switch
                      id="isSpecialized"
                      checked={formData.isSpecialized}
                      onCheckedChange={(checked) => handleCheckboxChange('isSpecialized', checked)}
                    />
                    <Label htmlFor="isSpecialized">Oficina especializada</Label>
                  </div>
                </div>
                {formData.isSpecialized && (
                  <div className="col-span-2">
                    <Label htmlFor="specialties" className="text-right">
                      Especialidades
                    </Label>
                    <Input
                      id="specialties"
                      name="specialties"
                      value={formData.specialties}
                      onChange={handleInputChange}
                      className="mt-1"
                      placeholder="Ex: Motor, Transmissão, Freios"
                    />
                  </div>
                )}
                <div className="col-span-2">
                  <div className="flex items-center space-x-2 mt-2">
                    <Switch
                      id="isActive"
                      checked={formData.isActive}
                      onCheckedChange={(checked) => handleCheckboxChange('isActive', checked)}
                    />
                    <Label htmlFor="isActive">Oficina ativa</Label>
                  </div>
                </div>
                <div className="col-span-2">
                  <Label htmlFor="observations" className="text-right">
                    Observações
                  </Label>
                  <Input
                    id="observations"
                    name="observations"
                    value={formData.observations}
                    onChange={handleInputChange}
                    className="mt-1"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createWorkshopMutation.isPending || updateWorkshopMutation.isPending}>
                {createWorkshopMutation.isPending || updateWorkshopMutation.isPending ? (
                  <span className="flex items-center">
                    <span className="animate-spin mr-2 h-4 w-4 border-t-2 border-b-2 border-white rounded-full"></span>
                    Processando...
                  </span>
                ) : (
                  <span>{editingWorkshop ? 'Atualizar' : 'Salvar'}</span>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}