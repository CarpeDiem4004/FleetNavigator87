import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { Laptop, Smartphone, Monitor, Printer, Plus, Edit, Trash2, UserCheck, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Schema para validação do formulário de equipamento
const equipmentSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  type: z.enum(['notebook', 'celular', 'tablet', 'desktop', 'monitor', 'impressora', 'scanner', 'roteador', 'telefone_fixo', 'camera', 'projetor', 'outros']),
  brand: z.string().optional(),
  model: z.string().optional(),
  serial_number: z.string().optional(),
  patrimony_number: z.string().optional(),
  purchase_date: z.string().optional(),
  purchase_value: z.string().optional(),
  supplier: z.string().optional(),
  warranty_expires: z.string().optional(),
  condition: z.enum(['novo', 'otimo', 'bom', 'regular', 'ruim', 'defeituoso']).default('novo'),
  status: z.enum(['disponivel', 'em_uso', 'manutencao', 'descartado', 'perdido', 'roubado']).default('disponivel'),
  location: z.string().optional(),
  notes: z.string().optional(),
});

// Schema para termo de responsabilidade
const responsibilityTermSchema = z.object({
  equipment_id: z.number(),
  full_name: z.string().min(1, "Nome completo é obrigatório"),
  cpf: z.string().min(11, "CPF deve ter 11 dígitos").max(14, "CPF inválido"),
  phone: z.string().min(10, "Telefone é obrigatório"),
  department: z.string().min(1, "Departamento é obrigatório"),
  address: z.string().min(1, "Endereço é obrigatório"),
  condition_at_assignment: z.enum(['novo', 'otimo', 'bom', 'regular', 'ruim', 'defeituoso']),
  notes: z.string().optional(),
});

type EquipmentFormData = z.infer<typeof equipmentSchema>;
type ResponsibilityTermFormData = z.infer<typeof responsibilityTermSchema>;

const equipmentTypeLabels = {
  notebook: 'Notebook',
  celular: 'Celular',
  tablet: 'Tablet',
  desktop: 'Desktop',
  monitor: 'Monitor',
  impressora: 'Impressora',
  scanner: 'Scanner',
  roteador: 'Roteador',
  telefone_fixo: 'Telefone Fixo',
  camera: 'Câmera',
  projetor: 'Projetor',
  outros: 'Outros'
};

const equipmentStatusLabels = {
  disponivel: 'Disponível',
  em_uso: 'Em Uso',
  manutencao: 'Manutenção',
  descartado: 'Descartado',
  perdido: 'Perdido',
  roubado: 'Roubado'
};

const equipmentConditionLabels = {
  novo: 'Novo',
  otimo: 'Ótimo',
  bom: 'Bom',
  regular: 'Regular',
  ruim: 'Ruim',
  defeituoso: 'Defeituoso'
};

const getEquipmentIcon = (type: string) => {
  switch (type) {
    case 'notebook':
      return <Laptop className="h-4 w-4" />;
    case 'celular':
      return <Smartphone className="h-4 w-4" />;
    case 'monitor':
      return <Monitor className="h-4 w-4" />;
    case 'impressora':
      return <Printer className="h-4 w-4" />;
    default:
      return <Settings className="h-4 w-4" />;
  }
};

const getStatusBadgeVariant = (status: string) => {
  switch (status) {
    case 'disponivel':
      return 'default';
    case 'em_uso':
      return 'secondary';
    case 'manutencao':
      return 'destructive';
    default:
      return 'outline';
  }
};

export default function Equipment() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<any>(null);
  const [isTermDialogOpen, setIsTermDialogOpen] = useState(false);
  const [selectedEquipmentForTerm, setSelectedEquipmentForTerm] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<EquipmentFormData>({
    resolver: zodResolver(equipmentSchema),
    defaultValues: {
      condition: 'novo',
      status: 'disponivel',
    },
  });

  const termForm = useForm<ResponsibilityTermFormData>({
    resolver: zodResolver(responsibilityTermSchema),
    defaultValues: {
      condition_at_assignment: 'novo',
    },
  });

  // Query para buscar equipamentos
  const { data: equipmentsResponse, isLoading } = useQuery({
    queryKey: ['/api/equipment'],
  });
  
  const equipments = equipmentsResponse?.data || [];

  // Query para dashboard
  const { data: dashboard } = useQuery({
    queryKey: ['/api/equipment-dashboard'],
  });

  // Mutation para criar equipamento
  const createEquipmentMutation = useMutation({
    mutationFn: (data: EquipmentFormData) => apiRequest('/api/equipment', 'POST', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/equipment'] });
      queryClient.invalidateQueries({ queryKey: ['/api/equipment-dashboard'] });
      setIsCreateDialogOpen(false);
      form.reset();
      toast({
        title: "Sucesso",
        description: "Equipamento criado com sucesso!",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Erro ao criar equipamento",
        variant: "destructive",
      });
    },
  });

  // Mutation para atualizar equipamento
  const updateEquipmentMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: EquipmentFormData }) =>
      apiRequest(`/api/equipment/${id}`, 'PUT', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/equipment'] });
      queryClient.invalidateQueries({ queryKey: ['/api/equipment-dashboard'] });
      setEditingEquipment(null);
      form.reset();
      toast({
        title: "Sucesso",
        description: "Equipamento atualizado com sucesso!",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Erro ao atualizar equipamento",
        variant: "destructive",
      });
    },
  });

  // Mutation para deletar equipamento
  const deleteEquipmentMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/equipment/${id}`, 'DELETE'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/equipment'] });
      queryClient.invalidateQueries({ queryKey: ['/api/equipment-dashboard'] });
      toast({
        title: "Sucesso",
        description: "Equipamento deletado com sucesso!",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Erro ao deletar equipamento",
        variant: "destructive",
      });
    },
  });

  // Mutation para criar termo de responsabilidade
  const createTermMutation = useMutation({
    mutationFn: (data: ResponsibilityTermFormData) => apiRequest('/api/equipment-responsibility-terms', 'POST', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/equipment'] });
      setIsTermDialogOpen(false);
      setSelectedEquipmentForTerm(null);
      termForm.reset();
      toast({
        title: "Sucesso",
        description: "Termo de responsabilidade criado com sucesso!",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro", 
        description: "Erro ao criar termo de responsabilidade",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: EquipmentFormData) => {
    if (editingEquipment) {
      updateEquipmentMutation.mutate({ id: editingEquipment.id, data });
    } else {
      createEquipmentMutation.mutate(data);
    }
  };

  const onTermSubmit = (data: ResponsibilityTermFormData) => {
    if (selectedEquipmentForTerm) {
      createTermMutation.mutate({
        ...data,
        equipment_id: selectedEquipmentForTerm.id,
        term_content: `Termo de Responsabilidade para ${selectedEquipmentForTerm.name}`,
      });
    }
  };

  const handleCreateTerm = (equipment: any) => {
    setSelectedEquipmentForTerm(equipment);
    setIsTermDialogOpen(true);
  };

  const handleEdit = (equipment: any) => {
    setEditingEquipment(equipment);
    form.reset({
      name: equipment.name,
      type: equipment.type,
      brand: equipment.brand || '',
      model: equipment.model || '',
      serial_number: equipment.serial_number || '',
      patrimony_number: equipment.patrimony_number || '',
      purchase_date: equipment.purchase_date || '',
      purchase_value: equipment.purchase_value || '',
      supplier: equipment.supplier || '',
      warranty_expires: equipment.warranty_expires || '',
      condition: equipment.condition,
      status: equipment.status,
      location: equipment.location || '',
      notes: equipment.notes || '',
    });
  };

  const handleDelete = (id: number) => {
    if (confirm('Tem certeza que deseja deletar este equipamento?')) {
      deleteEquipmentMutation.mutate(id);
    }
  };

  const handleDialogClose = () => {
    setIsCreateDialogOpen(false);
    setEditingEquipment(null);
    form.reset();
  };

  if (isLoading) {
    return <div className="p-8">Carregando...</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Controle de Equipamentos</h1>
          <p className="text-muted-foreground">
            Gerencie notebooks, celulares e outros equipamentos da empresa
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Equipamento
        </Button>
        
        <Dialog open={isCreateDialogOpen || !!editingEquipment} onOpenChange={handleDialogClose}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingEquipment ? 'Editar Equipamento' : 'Novo Equipamento'}
              </DialogTitle>
              <DialogDescription>
                {editingEquipment 
                  ? 'Atualize as informações do equipamento'
                  : 'Cadastre um novo equipamento no sistema'
                }
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>Nome do Equipamento</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Notebook Dell Inspiron 15" {...field} />
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
                        <FormLabel>Tipo</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o tipo" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Object.entries(equipmentTypeLabels).map(([value, label]) => (
                              <SelectItem key={value} value={value}>
                                {label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="brand"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Marca</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Dell, Apple, Samsung" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="model"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Modelo</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Inspiron 15 3000" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="serial_number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Número de Série</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: ABC123456789" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="patrimony_number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Número do Patrimônio</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: PAT001234" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="purchase_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data de Compra</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="purchase_value"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Valor de Compra</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.01" 
                            placeholder="Ex: 2500.00" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="supplier"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fornecedor</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Dell Brasil" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="warranty_expires"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Garantia até</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="condition"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Condição</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione a condição" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Object.entries(equipmentConditionLabels).map(([value, label]) => (
                              <SelectItem key={value} value={value}>
                                {label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Object.entries(equipmentStatusLabels).map(([value, label]) => (
                              <SelectItem key={value} value={value}>
                                {label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>Localização</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Escritório São Paulo - Sala 201" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>Observações</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Informações adicionais sobre o equipamento..."
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={handleDialogClose}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={createEquipmentMutation.isPending || updateEquipmentMutation.isPending}>
                    {editingEquipment ? 'Atualizar' : 'Criar'} Equipamento
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Dashboard Cards */}
      {dashboard && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Equipamentos</CardTitle>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboard.totalEquipments}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Disponíveis</CardTitle>
              <div className="h-4 w-4 rounded-full bg-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboard.availableEquipments}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Em Uso</CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboard.inUseEquipments}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Em Manutenção</CardTitle>
              <div className="h-4 w-4 rounded-full bg-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboard.maintenanceEquipments}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Lista de Equipamentos */}
      <Card>
        <CardHeader>
          <CardTitle>Equipamentos Cadastrados</CardTitle>
          <CardDescription>
            Lista de todos os equipamentos cadastrados no sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Equipamento</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Marca/Modelo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Condição</TableHead>
                <TableHead>Localização</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {equipments.map((equipment: any) => (
                <TableRow key={equipment.id}>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {getEquipmentIcon(equipment.type)}
                      <div>
                        <div className="font-medium">{equipment.name}</div>
                        {equipment.serial_number && (
                          <div className="text-sm text-muted-foreground">
                            S/N: {equipment.serial_number}
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{equipmentTypeLabels[equipment.type as keyof typeof equipmentTypeLabels]}</TableCell>
                  <TableCell>
                    <div>
                      {equipment.brand && <div className="font-medium">{equipment.brand}</div>}
                      {equipment.model && <div className="text-sm text-muted-foreground">{equipment.model}</div>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(equipment.status)}>
                      {equipmentStatusLabels[equipment.status as keyof typeof equipmentStatusLabels]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {equipmentConditionLabels[equipment.condition as keyof typeof equipmentConditionLabels]}
                  </TableCell>
                  <TableCell>{equipment.location || '-'}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(equipment)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCreateTerm(equipment)}
                      >
                        <UserCheck className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(equipment.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog para termo de responsabilidade */}
      <Dialog open={isTermDialogOpen} onOpenChange={setIsTermDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Criar Termo de Responsabilidade</DialogTitle>
            <DialogDescription>
              Criar termo de responsabilidade para o equipamento: {selectedEquipmentForTerm?.name}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...termForm}>
            <form onSubmit={termForm.handleSubmit(onTermSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={termForm.control}
                  name="full_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome Completo *</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome completo da pessoa responsável" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={termForm.control}
                  name="cpf"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CPF *</FormLabel>
                      <FormControl>
                        <Input placeholder="000.000.000-00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={termForm.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefone *</FormLabel>
                      <FormControl>
                        <Input placeholder="(11) 99999-9999" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={termForm.control}
                  name="department"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Departamento *</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: TI, Recursos Humanos, Logística" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={termForm.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>Endereço *</FormLabel>
                      <FormControl>
                        <Input placeholder="Endereço completo" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={termForm.control}
                  name="condition_at_assignment"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Condição do Equipamento *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a condição" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.entries(equipmentConditionLabels).map(([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={termForm.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>Observações</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Informações adicionais sobre o termo de responsabilidade..."
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsTermDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={createTermMutation.isPending}>
                  Criar Termo de Responsabilidade
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}