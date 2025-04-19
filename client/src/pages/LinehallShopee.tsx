import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePickerForm } from "@/components/ui/date-picker-form";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, Edit, Trash2 } from "lucide-react";
import { fetcher } from "@/lib/fetcher";
import AppLayout from "@/components/layout/AppLayout";

type LinehallShopee = {
  id: number;
  data_viagem: string;
  cavalo_placa: string;
  carreta1_placa: string;
  carreta2_placa?: string;
  motorista_id: number;
  motorista_nome?: string;
  base_origem_id: number;
  base_origem_nome?: string;
  base_destino_id: number;
  base_destino_nome?: string;
  horario_carregamento: string;
  status: string;
  observacoes?: string;
  created_by?: number;
  created_at: string;
  updated_at: string;
};

type User = {
  id: number;
  name: string;
  email: string;
  role: string;
};

type Base = {
  id: number;
  name: string;
};

type Vehicle = {
  id: number;
  plate: string;
  model: string;
  vehicle_type: string;
  status: string;
};

const STATUS_OPTIONS = [
  { value: "agendado", label: "Agendado" },
  { value: "carregando", label: "Carregando" },
  { value: "em_transito", label: "Em Trânsito" },
  { value: "descarregando", label: "Descarregando" },
  { value: "finalizado", label: "Finalizado" },
  { value: "cancelado", label: "Cancelado" },
];

const mapStatusToLabel = (status: string) => {
  return STATUS_OPTIONS.find(option => option.value === status)?.label || status;
};

const LinehallShopeePage = () => {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<LinehallShopee>>({
    data_viagem: format(new Date(), 'yyyy-MM-dd'),
    horario_carregamento: '08:00',
    status: 'agendado'
  });
  const [selectedItem, setSelectedItem] = useState<LinehallShopee | null>(null);

  const {
    data: linehallShopeeList,
    isLoading: isLoadingList,
    refetch: refetchList,
  } = useQuery<LinehallShopee[]>({
    queryKey: ["/api/linehall-shopee"],
    queryFn: () => fetcher("/api/linehall-shopee"),
  });

  const {
    data: drivers,
    isLoading: isLoadingDrivers,
  } = useQuery<User[]>({
    queryKey: ["/api/users/drivers"],
    queryFn: () => fetcher("/api/users"),
  });

  const {
    data: bases,
    isLoading: isLoadingBases,
  } = useQuery<Base[]>({
    queryKey: ["/api/bases"],
    queryFn: () => fetcher("/api/bases"),
  });

  const {
    data: vehicles,
    isLoading: isLoadingVehicles,
  } = useQuery<Vehicle[]>({
    queryKey: ["/api/vehicles/cavalo"],
    queryFn: () => fetcher("/api/vehicles?type=cavalo_mecanico"),
  });

  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
      setFormData({
        ...formData,
        data_viagem: format(date, 'yyyy-MM-dd'),
      });
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch("/api/linehall-shopee", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          created_by: user?.id
        }),
      });

      if (!response.ok) {
        throw new Error("Erro ao adicionar viagem");
      }

      toast({
        title: "Sucesso",
        description: "Viagem adicionada com sucesso.",
      });
      
      setIsAddDialogOpen(false);
      setFormData({
        data_viagem: format(new Date(), 'yyyy-MM-dd'),
        horario_carregamento: '08:00',
        status: 'agendado'
      });
      queryClient.invalidateQueries({ queryKey: ["/api/linehall-shopee"] });
    } catch (error) {
      console.error("Erro ao adicionar viagem:", error);
      toast({
        title: "Erro",
        description: "Não foi possível adicionar a viagem. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedItem) return;
    
    try {
      const response = await fetch(`/api/linehall-shopee/${selectedItem.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Erro ao atualizar viagem");
      }

      toast({
        title: "Sucesso",
        description: "Viagem atualizada com sucesso.",
      });
      
      setIsEditDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/linehall-shopee"] });
    } catch (error) {
      console.error("Erro ao atualizar viagem:", error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a viagem. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (!selectedItem) return;
    
    try {
      const response = await fetch(`/api/linehall-shopee/${selectedItem.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Erro ao excluir viagem");
      }

      toast({
        title: "Sucesso",
        description: "Viagem excluída com sucesso.",
      });
      
      setIsDeleteDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/linehall-shopee"] });
    } catch (error) {
      console.error("Erro ao excluir viagem:", error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir a viagem. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (item: LinehallShopee) => {
    setSelectedItem(item);
    setFormData({
      data_viagem: item.data_viagem,
      cavalo_placa: item.cavalo_placa,
      carreta1_placa: item.carreta1_placa,
      carreta2_placa: item.carreta2_placa || "",
      motorista_id: item.motorista_id,
      base_origem_id: item.base_origem_id,
      base_destino_id: item.base_destino_id,
      horario_carregamento: item.horario_carregamento,
      status: item.status,
      observacoes: item.observacoes || "",
    });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (item: LinehallShopee) => {
    setSelectedItem(item);
    setIsDeleteDialogOpen(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, 'dd/MM/yyyy', { locale: ptBR });
    } catch (e) {
      return dateString;
    }
  };

  const getDriverName = (driverId: number) => {
    const driver = drivers?.find(d => d.id === driverId);
    return driver ? driver.name : `Motorista ${driverId}`;
  };

  const getBaseName = (baseId: number) => {
    const base = bases?.find(b => b.id === baseId);
    return base ? base.name : `Base ${baseId}`;
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'agendado':
        return 'bg-blue-100 text-blue-800';
      case 'carregando':
        return 'bg-yellow-100 text-yellow-800';
      case 'em_transito':
        return 'bg-purple-100 text-purple-800';
      case 'descarregando':
        return 'bg-orange-100 text-orange-800';
      case 'finalizado':
        return 'bg-green-100 text-green-800';
      case 'cancelado':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <AppLayout>
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">LINE HALL SHOPEE</h1>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Nova Viagem
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Gerenciamento de Viagens</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingList ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Cavalo</TableHead>
                    <TableHead>Carreta</TableHead>
                    <TableHead>Motorista</TableHead>
                    <TableHead>Origem → Destino</TableHead>
                    <TableHead>Hora Carregamento</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {linehallShopeeList && linehallShopeeList.length > 0 ? (
                    linehallShopeeList.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{formatDate(item.data_viagem)}</TableCell>
                        <TableCell>{item.cavalo_placa}</TableCell>
                        <TableCell>
                          {item.carreta1_placa}
                          {item.carreta2_placa && <span> + {item.carreta2_placa}</span>}
                        </TableCell>
                        <TableCell>
                          {item.motorista_nome || getDriverName(item.motorista_id)}
                        </TableCell>
                        <TableCell>
                          {item.base_origem_nome || getBaseName(item.base_origem_id)} → 
                          {item.base_destino_nome || getBaseName(item.base_destino_id)}
                        </TableCell>
                        <TableCell>{item.horario_carregamento}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusClass(item.status)}`}>
                            {mapStatusToLabel(item.status)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEditDialog(item)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openDeleteDialog(item)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8">
                        Nenhuma viagem encontrada.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Add Dialog */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent className="sm:max-w-[550px]">
            <form onSubmit={handleAddSubmit}>
              <DialogHeader>
                <DialogTitle>Nova Viagem</DialogTitle>
                <DialogDescription>
                  Adicione uma nova viagem para o sistema Line Hall Shopee.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="data_viagem">Data da Viagem</Label>
                    <DatePickerForm
                      date={selectedDate}
                      setDate={handleDateChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="horario_carregamento">Horário de Carregamento</Label>
                    <Input
                      id="horario_carregamento"
                      name="horario_carregamento"
                      type="time"
                      value={formData.horario_carregamento || ""}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cavalo_placa">Cavalo (Placa)</Label>
                    <Select
                      value={formData.cavalo_placa}
                      onValueChange={(value) => handleSelectChange("cavalo_placa", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecionar cavalo" />
                      </SelectTrigger>
                      <SelectContent>
                        {vehicles?.filter(v => v.vehicle_type === 'cavalo_mecanico').map((v) => (
                          <SelectItem key={v.id} value={v.plate}>
                            {v.plate} - {v.model}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="motorista_id">Motorista</Label>
                    <Select
                      value={formData.motorista_id?.toString()}
                      onValueChange={(value) => handleSelectChange("motorista_id", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecionar motorista" />
                      </SelectTrigger>
                      <SelectContent>
                        {drivers?.map((driver) => (
                          <SelectItem key={driver.id} value={driver.id.toString()}>
                            {driver.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="carreta1_placa">Carreta 1 (Placa)</Label>
                    <Input
                      id="carreta1_placa"
                      name="carreta1_placa"
                      value={formData.carreta1_placa || ""}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="carreta2_placa">Carreta 2 (Placa - Opcional)</Label>
                    <Input
                      id="carreta2_placa"
                      name="carreta2_placa"
                      value={formData.carreta2_placa || ""}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="base_origem_id">Base de Origem</Label>
                    <Select
                      value={formData.base_origem_id?.toString()}
                      onValueChange={(value) => handleSelectChange("base_origem_id", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecionar origem" />
                      </SelectTrigger>
                      <SelectContent>
                        {bases?.map((base) => (
                          <SelectItem key={base.id} value={base.id.toString()}>
                            {base.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="base_destino_id">Base de Destino</Label>
                    <Select
                      value={formData.base_destino_id?.toString()}
                      onValueChange={(value) => handleSelectChange("base_destino_id", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecionar destino" />
                      </SelectTrigger>
                      <SelectContent>
                        {bases?.map((base) => (
                          <SelectItem key={base.id} value={base.id.toString()}>
                            {base.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => handleSelectChange("status", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar status" />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="observacoes">Observações</Label>
                  <Input
                    id="observacoes"
                    name="observacoes"
                    value={formData.observacoes || ""}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">Adicionar</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[550px]">
            <form onSubmit={handleEditSubmit}>
              <DialogHeader>
                <DialogTitle>Editar Viagem</DialogTitle>
                <DialogDescription>
                  Edite os detalhes da viagem selecionada.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="data_viagem">Data da Viagem</Label>
                    <Input
                      id="data_viagem"
                      name="data_viagem"
                      type="date"
                      value={formData.data_viagem || ""}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="horario_carregamento">Horário de Carregamento</Label>
                    <Input
                      id="horario_carregamento"
                      name="horario_carregamento"
                      type="time"
                      value={formData.horario_carregamento || ""}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cavalo_placa">Cavalo (Placa)</Label>
                    <Select
                      value={formData.cavalo_placa}
                      onValueChange={(value) => handleSelectChange("cavalo_placa", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecionar cavalo" />
                      </SelectTrigger>
                      <SelectContent>
                        {vehicles?.filter(v => v.vehicle_type === 'cavalo_mecanico').map((v) => (
                          <SelectItem key={v.id} value={v.plate}>
                            {v.plate} - {v.model}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="motorista_id">Motorista</Label>
                    <Select
                      value={formData.motorista_id?.toString()}
                      onValueChange={(value) => handleSelectChange("motorista_id", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecionar motorista" />
                      </SelectTrigger>
                      <SelectContent>
                        {drivers?.map((driver) => (
                          <SelectItem key={driver.id} value={driver.id.toString()}>
                            {driver.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="carreta1_placa">Carreta 1 (Placa)</Label>
                    <Input
                      id="carreta1_placa"
                      name="carreta1_placa"
                      value={formData.carreta1_placa || ""}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="carreta2_placa">Carreta 2 (Placa - Opcional)</Label>
                    <Input
                      id="carreta2_placa"
                      name="carreta2_placa"
                      value={formData.carreta2_placa || ""}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="base_origem_id">Base de Origem</Label>
                    <Select
                      value={formData.base_origem_id?.toString()}
                      onValueChange={(value) => handleSelectChange("base_origem_id", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecionar origem" />
                      </SelectTrigger>
                      <SelectContent>
                        {bases?.map((base) => (
                          <SelectItem key={base.id} value={base.id.toString()}>
                            {base.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="base_destino_id">Base de Destino</Label>
                    <Select
                      value={formData.base_destino_id?.toString()}
                      onValueChange={(value) => handleSelectChange("base_destino_id", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecionar destino" />
                      </SelectTrigger>
                      <SelectContent>
                        {bases?.map((base) => (
                          <SelectItem key={base.id} value={base.id.toString()}>
                            {base.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => handleSelectChange("status", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar status" />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="observacoes">Observações</Label>
                  <Input
                    id="observacoes"
                    name="observacoes"
                    value={formData.observacoes || ""}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">Salvar Alterações</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmar Exclusão</DialogTitle>
              <DialogDescription>
                Tem certeza que deseja excluir esta viagem? Esta ação não pode ser desfeita.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                Cancelar
              </Button>
              <Button variant="destructive" onClick={handleDelete}>
                Excluir
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
};

export default LinehallShopeePage;