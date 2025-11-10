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
import { Search, Plus, FileEdit, Trash2, Upload, AlertTriangle } from 'lucide-react';
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
  FormDescription,
} from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
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
  cartao_combustivel?: string;
  isTemporary?: boolean;
  deactivationDate?: string;
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

// Schema de validação para edição de veículos
const editVehicleSchema = z.object({
  plate: z.string().min(1, "Placa é obrigatória"),
  model: z.string().min(1, "Modelo é obrigatório"),
  vehicleType: z.string().min(1, "Tipo de veículo é obrigatório"),
  status: z.string().min(1, "Status é obrigatório"),
  baseId: z.number().min(1, "Base é obrigatória"),
  cartaoAbastecimento: z.string().optional(),
  isTemporary: z.boolean().default(false),
  deactivationDate: z.string().optional(),
}).refine(data => {
  // Se isTemporary for true, deactivationDate é obrigatório
  if (data.isTemporary && !data.deactivationDate) {
    return false;
  }
  return true;
}, {
  message: "Data de desativação é obrigatória para veículos temporários",
  path: ["deactivationDate"],
});

// Componente de formulário para edição de veículos
interface EditVehicleFormProps {
  vehicle: Vehicle;
  onUpdate: (data: any) => void;
  onCancel: () => void;
}

const EditVehicleForm: React.FC<EditVehicleFormProps> = ({ vehicle, onUpdate, onCancel }) => {
  const [bases, setBases] = useState<any[]>([]);
  
  const form = useForm<z.infer<typeof editVehicleSchema>>({
    resolver: zodResolver(editVehicleSchema),
    defaultValues: {
      plate: vehicle.placa || "",
      model: vehicle.modelo || "",
      vehicleType: vehicle.marca || "cavalo_mecanico",
      status: vehicle.status || "em_operacao",
      baseId: vehicle.base_id || 1,
      cartaoAbastecimento: vehicle.cartao_combustivel || "",
      isTemporary: vehicle.isTemporary || false,
      deactivationDate: vehicle.deactivationDate || "",
    },
  });

  // Carregar bases disponíveis
  useEffect(() => {
    const fetchBases = async () => {
      try {
        const response = await fetch('/api/bases');
        if (response.ok) {
          const data = await response.json();
          setBases(data);
        }
      } catch (error) {
        console.error("Erro ao carregar bases:", error);
      }
    };
    fetchBases();
  }, []);

  const onSubmit = (data: z.infer<typeof editVehicleSchema>) => {
    onUpdate(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="plate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Placa</FormLabel>
              <FormControl>
                <Input placeholder="Digite a placa" {...field} />
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
                <Input placeholder="Digite o modelo" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="vehicleType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo de Veículo</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="cavalo_mecanico">Cavalo Mecânico</SelectItem>
                  <SelectItem value="carreta">Carreta</SelectItem>
                  <SelectItem value="van">Van</SelectItem>
                  <SelectItem value="fiorino">Fiorino</SelectItem>
                  <SelectItem value="vuc">VUC</SelectItem>
                  <SelectItem value="toco">Toco</SelectItem>
                  <SelectItem value="truck">Truck</SelectItem>
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
                  <SelectItem value="em_operacao">Em Operação</SelectItem>
                  <SelectItem value="em_manutencao">Em Manutenção</SelectItem>
                  <SelectItem value="parado">Parado</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="baseId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Base</FormLabel>
              <Select onValueChange={(value) => field.onChange(parseInt(value))} defaultValue={field.value.toString()}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a base" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {bases.map((base) => (
                    <SelectItem key={base.id} value={base.id.toString()}>
                      {base.name}
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
          name="cartaoAbastecimento"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cartão de Abastecimento</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Ex: 5431-1234-5678-9012" 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="border-t pt-4 mt-6">
          <h3 className="text-sm font-medium mb-4">Configuração Temporária</h3>
          
          <FormField
            control={form.control}
            name="isTemporary"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    data-testid="checkbox-is-temporary"
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Veículo Temporário</FormLabel>
                  <FormDescription>
                    Marque esta opção se o veículo for temporário. Veículos temporários expirados não poderão solicitar combustível.
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />

          {form.watch("isTemporary") && (
            <FormField
              control={form.control}
              name="deactivationDate"
              render={({ field }) => (
                <FormItem className="mt-4">
                  <FormLabel>Data de Desativação *</FormLabel>
                  <FormControl>
                    <Input 
                      type="date" 
                      {...field}
                      data-testid="input-deactivation-date"
                    />
                  </FormControl>
                  <FormDescription>
                    Data em que o veículo será automaticamente desativado
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit">
            Salvar Alterações
          </Button>
        </div>
      </form>
    </Form>
  );
};

const VehiclesNew: React.FC = () => {
  const { toast } = useToast();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("list");
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  

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
      
      // Extrair o array de bases do objeto retornado
      const basesArray = basesData.success && basesData.data ? basesData.data : [];
      console.log('Array de bases extraído:', basesArray);
      
      // Criar um mapa de bases por ID para facilitar a busca
      const basesMap = new Map();
      basesArray.forEach((base: any) => {
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
  }, []);

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
      
      // Mapear campos do frontend para o formato esperado pelo backend
      const mappedData: any = {};
      if (vehicleData.plate !== undefined) mappedData.plate = vehicleData.plate;
      if (vehicleData.model !== undefined) mappedData.model = vehicleData.model;
      if (vehicleData.vehicleType !== undefined) mappedData.vehicleType = vehicleData.vehicleType;
      if (vehicleData.status !== undefined) mappedData.status = vehicleData.status;
      if (vehicleData.baseId !== undefined) mappedData.baseId = vehicleData.baseId;
      if (vehicleData.cartaoAbastecimento !== undefined) mappedData.cartaoAbastecimento = vehicleData.cartaoAbastecimento;
      if (vehicleData.isTemporary !== undefined) mappedData.isTemporary = vehicleData.isTemporary;
      if (vehicleData.deactivationDate !== undefined) mappedData.deactivationDate = vehicleData.deactivationDate;
      
      console.log('Dados mapeados para envio:', mappedData);
      
      const response = await fetch(`/api/vehicles/${editingVehicle.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mappedData),
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
          base_id: updatedVehicle.baseId || vehicle.base_id,
          cartao_combustivel: updatedVehicle.cartaoAbastecimento || vehicle.cartao_combustivel
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

  // Função para importar planilha de manutenção
  const handleImportMaintenance = async () => {
    if (!selectedFile) {
      toast({
        title: "Nenhum arquivo selecionado",
        description: "Por favor, selecione um arquivo Excel para importar.",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await fetch('/api/maintenance/import', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao importar planilha');
      }

      const result = await response.json();
      
      // Recarregar lista de veículos
      await fetchVehicles();
      
      setIsImportDialogOpen(false);
      setSelectedFile(null);
      
      toast({
        title: "Importação concluída",
        description: `${result.updated} veículos foram marcados como "Em Manutenção"`,
        variant: "default"
      });
    } catch (error) {
      console.error("Erro ao importar planilha:", error);
      toast({
        title: "Erro na importação",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
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
              <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <Upload className="h-4 w-4" />
                    Importar Manutenção
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Importar Planilha de Manutenção</DialogTitle>
                    <DialogDescription>
                      Selecione um arquivo Excel (.xlsx) com as placas dos veículos em manutenção.
                      Os veículos serão marcados como "Em Manutenção" automaticamente.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="import-file">Arquivo Excel</Label>
                      <Input
                        id="import-file"
                        type="file"
                        accept=".xlsx,.xls"
                        onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                      />
                      {selectedFile && (
                        <p className="text-sm text-gray-500">
                          Arquivo selecionado: {selectedFile.name}
                        </p>
                      )}
                    </div>
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <div className="flex gap-2">
                        <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-yellow-800">
                          <p className="font-medium mb-1">Formato do arquivo:</p>
                          <ul className="list-disc list-inside space-y-1">
                            <li>A planilha deve conter uma coluna chamada "Placa"</li>
                            <li>As placas devem estar no formato ABC1234 ou ABC1D23</li>
                            <li>Veículos já em manutenção serão ignorados</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setIsImportDialogOpen(false);
                        setSelectedFile(null);
                      }}
                    >
                      Cancelar
                    </Button>
                    <Button 
                      onClick={handleImportMaintenance}
                      disabled={!selectedFile || isUploading}
                    >
                      {isUploading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                          Importando...
                        </>
                      ) : (
                        'Importar'
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              
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