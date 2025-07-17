import { useState, useMemo } from "react";
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
import { 
  Users, 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  UserCheck, 
  Phone, 
  MapPin, 
  Building2,
  Calendar,
  Clock,
  FileText,
  Download
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Schema para validação do formulário de responsável
const responsibleSchema = z.object({
  equipment_id: z.number(),
  full_name: z.string().min(1, "Nome completo é obrigatório"),
  cpf: z.string()
    .min(11, "CPF deve ter 11 dígitos")
    .max(14, "CPF inválido")
    .transform((val) => val.replace(/\D/g, "")),
  phone: z.string()
    .min(10, "Telefone é obrigatório")
    .transform((val) => val.replace(/\D/g, "")),
  department: z.string().min(1, "Departamento é obrigatório"),
  address: z.string().min(1, "Endereço é obrigatório"),
  condition_at_assignment: z.enum(['novo', 'otimo', 'bom', 'regular', 'ruim', 'defeituoso']),
  notes: z.string().optional(),
});

type ResponsibleFormData = z.infer<typeof responsibleSchema>;

interface Equipment {
  id: number;
  name: string;
  type: string;
  brand?: string;
  model?: string;
  serial_number?: string;
  patrimony_number?: string;
  status: string;
  condition: string;
  location?: string;
}

interface ResponsibilityTerm {
  id: number;
  equipment_id: number;
  full_name: string;
  cpf: string;
  phone: string;
  department: string;
  address: string;
  assigned_at: string;
  returned_at?: string;
  condition_at_assignment: string;
  condition_at_return?: string;
  notes?: string;
  is_active: boolean;
  equipment: Equipment;
}

export default function EquipmentResponsible() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const form = useForm<ResponsibleFormData>({
    resolver: zodResolver(responsibleSchema),
    defaultValues: {
      equipment_id: 0,
      full_name: "",
      cpf: "",
      phone: "",
      department: "",
      address: "",
      condition_at_assignment: "novo",
      notes: "",
    },
  });

  // Buscar equipamentos disponíveis
  const { data: equipmentList = [] } = useQuery({
    queryKey: ["/api/equipment"],
    select: (data: Equipment[]) => data.filter(eq => eq.status === "disponivel"),
  });

  // Buscar termos de responsabilidade
  const { data: responsibilityTerms = [], isLoading } = useQuery({
    queryKey: ["/api/equipment/responsibility-terms"],
  });

  // Filtrar dados com base na busca e status
  const filteredData = useMemo(() => {
    return responsibilityTerms.filter((term: ResponsibilityTerm) => {
      const matchesSearch = 
        term.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        term.equipment.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        term.cpf.includes(searchTerm) ||
        term.department.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = 
        statusFilter === "all" || 
        (statusFilter === "active" && term.is_active) ||
        (statusFilter === "inactive" && !term.is_active);

      return matchesSearch && matchesStatus;
    });
  }, [responsibilityTerms, searchTerm, statusFilter]);

  // Mutation para criar novo termo de responsabilidade
  const createMutation = useMutation({
    mutationFn: async (data: ResponsibleFormData) => {
      return apiRequest("/api/equipment/responsibility-terms", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/equipment/responsibility-terms"] });
      queryClient.invalidateQueries({ queryKey: ["/api/equipment"] });
      toast({
        title: "Sucesso",
        description: "Responsável cadastrado com sucesso!",
      });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao cadastrar responsável",
        variant: "destructive",
      });
    },
  });

  // Mutation para atualizar termo de responsabilidade
  const updateMutation = useMutation({
    mutationFn: async (data: ResponsibleFormData) => {
      return apiRequest(`/api/equipment/responsibility-terms/${editingId}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/equipment/responsibility-terms"] });
      queryClient.invalidateQueries({ queryKey: ["/api/equipment"] });
      toast({
        title: "Sucesso",
        description: "Responsável atualizado com sucesso!",
      });
      setIsDialogOpen(false);
      setIsEditMode(false);
      setEditingId(null);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar responsável",
        variant: "destructive",
      });
    },
  });

  // Mutation para marcar retorno do equipamento
  const returnMutation = useMutation({
    mutationFn: async ({ id, condition }: { id: number; condition: string }) => {
      return apiRequest(`/api/equipment/responsibility-terms/${id}/return`, {
        method: "PUT",
        body: JSON.stringify({ condition_at_return: condition }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/equipment/responsibility-terms"] });
      queryClient.invalidateQueries({ queryKey: ["/api/equipment"] });
      toast({
        title: "Sucesso",
        description: "Retorno do equipamento registrado com sucesso!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao registrar retorno",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: ResponsibleFormData) => {
    if (isEditMode) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (term: ResponsibilityTerm) => {
    setIsEditMode(true);
    setEditingId(term.id);
    form.reset({
      equipment_id: term.equipment_id,
      full_name: term.full_name,
      cpf: term.cpf,
      phone: term.phone,
      department: term.department,
      address: term.address,
      condition_at_assignment: term.condition_at_assignment as any,
      notes: term.notes || "",
    });
    setIsDialogOpen(true);
  };

  const handleReturn = (id: number, condition: string) => {
    returnMutation.mutate({ id, condition });
  };

  const openAddDialog = () => {
    setIsEditMode(false);
    setEditingId(null);
    form.reset();
    setIsDialogOpen(true);
  };

  const formatCpf = (cpf: string) => {
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  };

  const formatPhone = (phone: string) => {
    if (phone.length === 11) {
      return phone.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
    }
    return phone.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
  };

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <Badge className="bg-green-500">Ativo</Badge>
    ) : (
      <Badge variant="secondary">Devolvido</Badge>
    );
  };

  const getConditionBadge = (condition: string) => {
    const colors = {
      novo: "bg-green-500",
      otimo: "bg-blue-500",
      bom: "bg-yellow-500",
      regular: "bg-orange-500",
      ruim: "bg-red-500",
      defeituoso: "bg-red-700",
    };
    
    return <Badge className={colors[condition as keyof typeof colors] || "bg-gray-500"}>{condition}</Badge>;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-6 w-6 text-blue-600" />
          <h1 className="text-2xl font-bold">Responsáveis por Equipamentos</h1>
        </div>
        
        <Button onClick={openAddDialog} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Cadastrar Responsável
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Total de Responsáveis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{responsibilityTerms.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Equipamentos Ativos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {responsibilityTerms.filter((term: ResponsibilityTerm) => term.is_active).length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Equipamentos Devolvidos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">
              {responsibilityTerms.filter((term: ResponsibilityTerm) => !term.is_active).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por nome, CPF, equipamento ou departamento..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="active">Ativos</SelectItem>
                <SelectItem value="inactive">Devolvidos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Responsibility Terms Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Responsáveis</CardTitle>
          <CardDescription>
            Gerencie as pessoas responsáveis pelos equipamentos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome Completo</TableHead>
                <TableHead>CPF</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Departamento</TableHead>
                <TableHead>Equipamento</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Condição</TableHead>
                <TableHead>Data Atribuição</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.map((term: ResponsibilityTerm) => (
                <TableRow key={term.id}>
                  <TableCell className="font-medium">{term.full_name}</TableCell>
                  <TableCell>{formatCpf(term.cpf)}</TableCell>
                  <TableCell>{formatPhone(term.phone)}</TableCell>
                  <TableCell>{term.department}</TableCell>
                  <TableCell>{term.equipment.name}</TableCell>
                  <TableCell>{getStatusBadge(term.is_active)}</TableCell>
                  <TableCell>{getConditionBadge(term.condition_at_assignment)}</TableCell>
                  <TableCell>
                    {new Date(term.assigned_at).toLocaleDateString('pt-BR')}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(term)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      
                      {term.is_active && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleReturn(term.id, term.condition_at_assignment)}
                        >
                          <UserCheck className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {isEditMode ? "Editar Responsável" : "Cadastrar Responsável"}
            </DialogTitle>
            <DialogDescription>
              {isEditMode 
                ? "Edite as informações do responsável pelo equipamento" 
                : "Cadastre uma nova pessoa responsável por um equipamento"
              }
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="equipment_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Equipamento</FormLabel>
                      <Select 
                        value={field.value?.toString()} 
                        onValueChange={(value) => field.onChange(parseInt(value))}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o equipamento" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {equipmentList.map((equipment: Equipment) => (
                            <SelectItem key={equipment.id} value={equipment.id.toString()}>
                              {equipment.name} - {equipment.type}
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
                  name="condition_at_assignment"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Condição do Equipamento</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a condição" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="novo">Novo</SelectItem>
                          <SelectItem value="otimo">Ótimo</SelectItem>
                          <SelectItem value="bom">Bom</SelectItem>
                          <SelectItem value="regular">Regular</SelectItem>
                          <SelectItem value="ruim">Ruim</SelectItem>
                          <SelectItem value="defeituoso">Defeituoso</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="full_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome Completo</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Digite o nome completo" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="cpf"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CPF</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="000.000.000-00" maxLength={14} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefone</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="(11) 99999-9999" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="department"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Departamento</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Ex: TI, Administrativo, Operacional" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Endereço</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="Endereço completo" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observações</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="Observações adicionais (opcional)" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {isEditMode ? "Atualizar" : "Cadastrar"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}