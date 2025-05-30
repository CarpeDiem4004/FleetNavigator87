import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { Label } from '@/components/ui/label';
import { Search, Plus, FileEdit, Trash2 } from 'lucide-react';
import MainLayoutSimple from '@/components/layout/MainLayoutSimple';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import CadastroFrota from '@/components/vehicle/CadastroFrota';
import { useToast } from '@/hooks/use-toast';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

// Tipo para representar os dados de um veículo
interface Vehicle {
  id: number;
  placa: string; // Nota: usando os campos em português como no exemplo enviado
  marca: string;
  modelo: string;
  base_id: number;
  base_nome?: string;
  status: string;
  created_at?: string;
  updated_at?: string;
}

// Função para traduzir os tipos de veículos
const translateVehicleType = (type: string): string => {
  const types: Record<string, string> = {
    cavalo_mecanico: 'Cavalo Mecânico',
    carreta: 'Carreta',
    van: 'Van',
    utilitario: 'Utilitário'
  };
  return types[type] || type;
};

// Função para traduzir os status de veículos
const translateVehicleStatus = (status: string): string => {
  const statuses: Record<string, string> = {
    em_operacao: 'Em Operação',
    em_manutencao: 'Em Manutenção',
    parado: 'Parado'
  };
  return statuses[status] || status;
};

// Função para obter a classe CSS para o badge de status
const getStatusBadgeClass = (status: string): string => {
  const classes: Record<string, string> = {
    em_operacao: 'bg-green-100 text-green-800',
    em_manutencao: 'bg-yellow-100 text-yellow-800',
    parado: 'bg-red-100 text-red-800'
  };
  return classes[status] || 'bg-gray-100 text-gray-800';
};

const VehiclesNew: React.FC = () => {
  const { toast } = useToast();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("list");
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  

  // Função para carregar veículos usando a API REST
  const fetchVehicles = async () => {
    setIsLoading(true);
    try {
      // Buscar todos os veículos usando a API REST
      console.log('Buscando veículos via API REST');
      const vehiclesResponse = await fetch('/api/vehicles');
      
      if (!vehiclesResponse.ok) {
        throw new Error(`Erro ao buscar veículos: ${vehiclesResponse.status}`);
      }
      
      const vehiclesData = await vehiclesResponse.json();
      console.log('Veículos recebidos da API:', vehiclesData);
      
      // Buscar bases para mapear os nomes
      const basesResponse = await fetch('/api/bases');
      
      if (!basesResponse.ok) {
        throw new Error(`Erro ao buscar bases: ${basesResponse.status}`);
      }
      
      const basesData = await basesResponse.json();
      console.log('Bases recebidas da API:', basesData);
      
      // Criar um mapa de bases por ID para facilitar a busca
      const basesMap = new Map();
      basesData.forEach((base: any) => {
        basesMap.set(base.id, base.name || base.nome);
      });
      
      // Adicionar nome da base a cada veículo e mapear campos
      const vehiclesWithBaseNames = vehiclesData.map((vehicle: any) => {
        return {
          id: vehicle.id,
          placa: vehicle.plate || '',
          marca: vehicle.vehicleType || '', // Nota: ajustado para camelCase do schema
          modelo: vehicle.model || '',
          base_id: vehicle.baseId,
          status: vehicle.status || '',
          base_nome: basesMap.get(vehicle.baseId) || 'Sem base'
        };
      });
      
      setVehicles(vehiclesWithBaseNames);
    } catch (error) {
      console.error('Erro ao buscar veículos:', error);
      toast({
        title: 'Erro ao carregar veículos',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Carregar veículos quando o componente é montado
  useEffect(() => {
    fetchVehicles();
  }, [toast]);

  // Filtrar veículos com base no termo de busca
  const filteredVehicles = vehicles.filter(
    (vehicle) => 
      (vehicle.placa && vehicle.placa.toLowerCase().includes(searchTerm.toLowerCase())) || 
      (vehicle.marca && vehicle.marca.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (vehicle.modelo && vehicle.modelo.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Excluir veículo usando a API REST
  const handleDeleteVehicle = async (id: number) => {
    if (!confirm("Tem certeza que deseja excluir este veículo? Esta ação não pode ser desfeita.")) {
      return;
    }

    try {
      console.log(`Excluindo veículo com ID ${id} via API REST`);
      const response = await fetch(`/api/vehicles/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao excluir veículo');
      }
      
      // Atualizar estado local removendo o veículo
      setVehicles(vehicles.filter(vehicle => vehicle.id !== id));
      
      toast({
        title: "Veículo excluído",
        description: "O veículo foi excluído com sucesso.",
        variant: "default"
      });
    } catch (error) {
      console.error("Erro ao excluir veículo:", error);
      toast({
        title: "Erro ao excluir veículo",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive"
      });
    }
  };

  // Função para abrir o diálogo de edição
  const handleEditVehicle = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    setIsEditDialogOpen(true);
  };

  // Função para editar veículo
  const handleUpdateVehicle = async (vehicleData: any) => {
    if (!editingVehicle) return;

    try {
      console.log(`Editando veículo com ID ${editingVehicle.id} via API REST`);
      const response = await fetch(`/api/vehicles/${editingVehicle.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(vehicleData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao atualizar veículo');
      }
      
      const updatedVehicle = await response.json();
      
      // Atualizar estado local
      setVehicles(vehicles.map(vehicle => 
        vehicle.id === editingVehicle.id ? {
          ...vehicle,
          placa: updatedVehicle.plate || vehicle.placa,
          marca: updatedVehicle.vehicleType || vehicle.marca,
          modelo: updatedVehicle.model || vehicle.modelo,
          status: updatedVehicle.status || vehicle.status,
          base_id: updatedVehicle.baseId || vehicle.base_id
        } : vehicle
      ));
      
      setIsEditDialogOpen(false);
      setEditingVehicle(null);
      
      toast({
        title: "Veículo atualizado",
        description: "O veículo foi atualizado com sucesso.",
        variant: "default"
      });
    } catch (error) {
      console.error("Erro ao atualizar veículo:", error);
      toast({
        title: "Erro ao atualizar veículo",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive"
      });
    }
  };

  return (
    <MainLayoutSimple>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold mb-2">Veículos</h1>
            <p className="text-gray-500">
              Gerenciamento de veículos da frota
            </p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="list">Lista de Veículos</TabsTrigger>
            <TabsTrigger value="add">Cadastrar Veículo</TabsTrigger>
          </TabsList>
          
          <TabsContent value="list" className="space-y-4">
            <div className="flex justify-between items-center">
              <div></div>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  type="search"
                  placeholder="Buscar veículos..."
                  className="pl-8 w-[300px]"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            
            <Card>
              <CardContent className="pt-6">
                {isLoading ? (
                  <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                  </div>
                ) : (
                  <Table>
                    <TableCaption>Lista de veículos da frota</TableCaption>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Placa</TableHead>
                        <TableHead>Marca</TableHead>
                        <TableHead>Modelo</TableHead>
                        <TableHead>Base</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredVehicles.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="h-24 text-center">
                            Nenhum veículo encontrado.
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredVehicles.map((vehicle) => (
                          <TableRow key={vehicle.id}>
                            <TableCell className="font-medium">{vehicle.placa}</TableCell>
                            <TableCell>{vehicle.marca}</TableCell>
                            <TableCell>{vehicle.modelo}</TableCell>
                            <TableCell>{vehicle.base_nome}</TableCell>
                            <TableCell>
                              <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadgeClass(vehicle.status)}`}>
                                {translateVehicleStatus(vehicle.status)}
                              </span>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end space-x-2">
                                <Button 
                                  variant="outline" 
                                  size="icon"
                                  onClick={() => handleEditVehicle(vehicle)}
                                >
                                  <FileEdit className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="icon"
                                  onClick={() => handleDeleteVehicle(vehicle.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
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
          </TabsContent>
          
          <TabsContent value="add">
            <CadastroFrota onVehicleAdded={() => {
              fetchVehicles();
              setActiveTab("list"); // Mudar para a aba de lista após adicionar
            }} />
          </TabsContent>
        </Tabs>

        {/* Diálogo de edição */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Editar Veículo</DialogTitle>
              <DialogDescription>
                Atualize as informações do veículo selecionado.
              </DialogDescription>
            </DialogHeader>
            {editingVehicle && (
              <EditVehicleForm 
                vehicle={editingVehicle}
                onUpdate={handleUpdateVehicle}
                onCancel={() => {
                  setIsEditDialogOpen(false);
                  setEditingVehicle(null);
                }}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </MainLayoutSimple>
  );
};

export default VehiclesNew;