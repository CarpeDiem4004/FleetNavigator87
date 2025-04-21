import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import MainLayoutSimple from '@/components/layout/MainLayoutSimple';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileEdit, Trash2, Search, CheckCircle, Clock } from "lucide-react";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

// Interfaces para tipagem
interface Vehicle {
  id: number;
  plate: string;
  model: string;
  vehicleType: string; // Alterado para compatibilidade com a API REST
  baseId: number; // Alterado para compatibilidade com a API REST
  status: string;
  ownership: string;
  rentalCompany?: string;
}

interface Base {
  id: number;
  name: string;
  location?: string;
}

interface Maintenance {
  id: number;
  veiculo_id: number;
  base_id: number;
  descricao: string;
  data_registro: string;
  status: string;
  data_conclusao?: string;
  // Campos adicionais para exibição
  placa_veiculo?: string;
  modelo_veiculo?: string;
  base_nome?: string;
}

const ManutencaoPage: React.FC = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('list');
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [manutencoes, setManutencoes] = useState<Maintenance[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [bases, setBases] = useState<Base[]>([]);

  // Estados para formulário
  const [form, setForm] = useState({
    veiculo_id: '',
    base_id: '',
    descricao: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Carregar manutenções usando a API REST
  useEffect(() => {
    const fetchMaintenances = async () => {
      setIsLoading(true);
      try {
        console.log('Buscando manutenções via API REST...');
        const response = await fetch('/api/maintenance');
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Erro ao buscar manutenções');
        }
        
        const data = await response.json();
        console.log('Manutenções recebidas:', data);
        
        // Formatar dados para exibição
        const formattedData = data.map((item: any) => ({
          id: item.id,
          veiculo_id: item.vehicleId || item.veiculo_id,
          base_id: item.baseId || item.base_id,
          descricao: item.description || item.descricao,
          data_registro: item.requestDate || item.data_registro,
          status: item.status,
          data_conclusao: item.completionDate || item.data_conclusao,
          placa_veiculo: item.vehiclePlate || item.placa_veiculo,
          modelo_veiculo: item.vehicleModel || item.modelo_veiculo,
          base_nome: item.baseName || item.base_nome
        }));

        setManutencoes(formattedData);
      } catch (error) {
        console.error('Erro ao buscar manutenções:', error);
        toast({
          title: 'Erro ao carregar manutenções',
          description: error instanceof Error ? error.message : 'Erro desconhecido',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchMaintenances();
  }, [toast]);

  // Carregar veículos usando a API REST
  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        console.log('Buscando veículos via API REST...');
        const response = await fetch('/api/vehicles');
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Erro ao buscar veículos');
        }
        
        const data = await response.json();
        console.log('Veículos recebidos:', data);
        setVehicles(data || []);
      } catch (error) {
        console.error('Erro ao buscar veículos:', error);
        toast({
          title: 'Erro ao carregar veículos',
          description: error instanceof Error ? error.message : 'Erro desconhecido',
          variant: 'destructive',
        });
      }
    };

    fetchVehicles();
  }, [toast]);

  // Carregar bases usando a API REST
  useEffect(() => {
    const fetchBases = async () => {
      try {
        console.log('Buscando bases via API REST...');
        const response = await fetch('/api/bases');
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Erro ao buscar bases');
        }
        
        const data = await response.json();
        console.log('Bases recebidas:', data);
        setBases(data || []);
      } catch (error) {
        console.error('Erro ao buscar bases:', error);
        toast({
          title: 'Erro ao carregar bases',
          description: error instanceof Error ? error.message : 'Erro desconhecido',
          variant: 'destructive',
        });
      }
    };

    fetchBases();
  }, [toast]);

  // Filtrar manutenções com base na busca
  const filteredMaintenances = manutencoes.filter(
    (manutencao) =>
      manutencao.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (manutencao.placa_veiculo && manutencao.placa_veiculo.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (manutencao.modelo_veiculo && manutencao.modelo_veiculo.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (manutencao.base_nome && manutencao.base_nome.toLowerCase().includes(searchTerm.toLowerCase())) ||
      manutencao.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Função para lidar com mudanças nos selects
  const handleSelectChange = (value: string, field: string) => {
    setForm({ ...form, [field]: value });
  };

  // Função para lidar com mudanças nos inputs
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Função para cadastrar nova manutenção usando a API REST
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.veiculo_id || !form.base_id || !form.descricao) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Por favor, preencha todos os campos obrigatórios.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      console.log('Registrando manutenção via API REST...');
      
      // Usar a API REST para registrar a manutenção
      const maintenanceData = {
        vehiclePlate: vehicles.find(v => v.id === parseInt(form.veiculo_id))?.plate,
        workshopId: 1, // Valor padrão, pode ser atualizado conforme necessário
        requestBaseId: parseInt(form.base_id),
        description: form.descricao,
        estimatedExitDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 dias a partir de hoje
        priority: 'normal',
      };
      
      console.log('Dados da manutenção:', maintenanceData);
      
      const response = await fetch('/api/maintenance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(maintenanceData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao registrar manutenção');
      }
      
      const data = await response.json();
      console.log('Manutenção registrada com sucesso:', data);

      toast({
        title: 'Manutenção registrada',
        description: 'A solicitação de manutenção foi cadastrada com sucesso.',
        variant: 'default',
      });

      // Limpar formulário
      setForm({
        veiculo_id: '',
        base_id: '',
        descricao: '',
      });

      // Adicionar novo registro à lista
      const veiculoSelecionado = vehicles.find(v => v.id === parseInt(form.veiculo_id));
      const baseSelecionada = bases.find(b => b.id === parseInt(form.base_id));
      
      const newMaintenance: Maintenance = {
        id: data.id,
        veiculo_id: parseInt(form.veiculo_id),
        base_id: parseInt(form.base_id),
        descricao: form.descricao,
        data_registro: new Date().toISOString(),
        status: 'pendente',
        placa_veiculo: veiculoSelecionado?.plate,
        modelo_veiculo: veiculoSelecionado?.model,
        base_nome: baseSelecionada?.name,
      };
      
      setManutencoes([newMaintenance, ...manutencoes]);
      setActiveTab('list');
      
    } catch (error) {
      console.error('Erro ao cadastrar manutenção:', error);
      toast({
        title: 'Erro ao registrar manutenção',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Função para concluir uma manutenção usando a API REST
  const handleCompleteMaintenances = async (id: number) => {
    if (!confirm('Marcar esta manutenção como concluída?')) {
      return;
    }

    try {
      console.log('Concluindo manutenção via API REST:', id);
      
      const response = await fetch(`/api/maintenance/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'concluida' }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao concluir manutenção');
      }
      
      console.log('Manutenção concluída com sucesso');
      
      // Atualizar a lista
      setManutencoes(manutencoes.map(item => {
        if (item.id === id) {
          return {
            ...item,
            status: 'concluida',
            data_conclusao: new Date().toISOString()
          };
        }
        return item;
      }));
      
      toast({
        title: 'Manutenção concluída',
        description: 'A manutenção foi marcada como concluída.',
        variant: 'default',
      });
    } catch (error) {
      console.error('Erro ao concluir manutenção:', error);
      toast({
        title: 'Erro ao concluir manutenção',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      });
    }
  };

  // Função para excluir manutenção usando a API REST
  const handleDeleteMaintenance = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir este registro de manutenção? Esta ação não pode ser desfeita.')) {
      return;
    }

    try {
      console.log('Excluindo manutenção via API REST:', id);
      
      const response = await fetch(`/api/maintenance/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao excluir manutenção');
      }
      
      console.log('Manutenção excluída com sucesso');
      setManutencoes(manutencoes.filter(item => item.id !== id));
      
      toast({
        title: 'Registro excluído',
        description: 'O registro de manutenção foi excluído com sucesso.',
        variant: 'default',
      });
    } catch (error) {
      console.error('Erro ao excluir manutenção:', error);
      toast({
        title: 'Erro ao excluir registro',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      });
    }
  };

  // Função para formatar data
  const formatDate = (dateString: string): string => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy HH:mm', { locale: ptBR });
    } catch (error) {
      return 'Data inválida';
    }
  };

  // Componente para exibir o status
  const StatusBadge = ({ status }: { status: string }) => {
    switch (status) {
      case 'pendente':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">Pendente</Badge>;
      case 'concluida':
        return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">Concluída</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <MainLayoutSimple>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold mb-2">Manutenções</h1>
            <p className="text-gray-500">
              Registre e acompanhe manutenções de veículos
            </p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="list">Lista de Manutenções</TabsTrigger>
            <TabsTrigger value="add">Registrar Manutenção</TabsTrigger>
          </TabsList>
          
          <TabsContent value="list" className="space-y-4">
            <div className="flex justify-between items-center">
              <div></div>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  type="search"
                  placeholder="Buscar manutenções..."
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
                    <TableCaption>Lista de manutenções registradas</TableCaption>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Veículo</TableHead>
                        <TableHead>Base</TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredMaintenances.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="h-24 text-center">
                            Nenhuma manutenção encontrada.
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredMaintenances.map((manutencao) => (
                          <TableRow key={manutencao.id}>
                            <TableCell className="font-medium">
                              <div className="flex flex-col">
                                <span>{manutencao.placa_veiculo}</span>
                                {manutencao.modelo_veiculo && (
                                  <span className="text-xs text-gray-500">{manutencao.modelo_veiculo}</span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>{manutencao.base_nome}</TableCell>
                            <TableCell className="max-w-[200px] truncate" title={manutencao.descricao}>
                              {manutencao.descricao}
                            </TableCell>
                            <TableCell>{formatDate(manutencao.data_registro)}</TableCell>
                            <TableCell>
                              <StatusBadge status={manutencao.status} />
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end space-x-2">
                                {manutencao.status === 'pendente' && (
                                  <Button 
                                    variant="outline" 
                                    size="icon"
                                    title="Marcar como concluída"
                                    onClick={() => handleCompleteMaintenances(manutencao.id)}
                                    className="text-green-600 hover:text-green-800"
                                  >
                                    <CheckCircle className="h-4 w-4" />
                                  </Button>
                                )}
                                <Button 
                                  variant="outline" 
                                  size="icon"
                                  title="Excluir Registro"
                                  onClick={() => handleDeleteMaintenance(manutencao.id)}
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
            <Card>
              <CardHeader>
                <CardTitle>Registrar Manutenção</CardTitle>
                <CardDescription>
                  Registre uma nova solicitação de manutenção para um veículo
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleSubmit}>
                <CardContent className="space-y-4">
                  {/* Veículo */}
                  <div className="space-y-2">
                    <Label htmlFor="veiculo">Veículo *</Label>
                    <Select 
                      value={form.veiculo_id} 
                      onValueChange={(value) => handleSelectChange(value, 'veiculo_id')}
                    >
                      <SelectTrigger id="veiculo">
                        <SelectValue placeholder="Selecione o veículo" />
                      </SelectTrigger>
                      <SelectContent>
                        {vehicles.map((vehicle) => (
                          <SelectItem key={vehicle.id} value={vehicle.id.toString()}>
                            {vehicle.plate} - {vehicle.model}
                          </SelectItem>
                        ))}
                        {vehicles.length === 0 && (
                          <div className="px-3 py-2 text-sm text-gray-500">
                            Nenhum veículo encontrado
                          </div>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Base */}
                  <div className="space-y-2">
                    <Label htmlFor="base">Base *</Label>
                    <Select 
                      value={form.base_id} 
                      onValueChange={(value) => handleSelectChange(value, 'base_id')}
                    >
                      <SelectTrigger id="base">
                        <SelectValue placeholder="Selecione a base" />
                      </SelectTrigger>
                      <SelectContent>
                        {bases.map((base) => (
                          <SelectItem key={base.id} value={base.id.toString()}>
                            {base.name}
                          </SelectItem>
                        ))}
                        {bases.length === 0 && (
                          <div className="px-3 py-2 text-sm text-gray-500">
                            Nenhuma base encontrada
                          </div>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Descrição */}
                  <div className="space-y-2">
                    <Label htmlFor="descricao">Descrição do problema *</Label>
                    <Textarea
                      id="descricao"
                      name="descricao"
                      placeholder="Descreva detalhadamente o problema"
                      value={form.descricao}
                      onChange={handleChange}
                      className="min-h-[100px]"
                      required
                    />
                  </div>
                </CardContent>
                
                <CardFooter className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setForm({
                        veiculo_id: '',
                        base_id: '',
                        descricao: '',
                      });
                    }}
                  >
                    Limpar
                  </Button>
                  <Button type="submit" disabled={isSubmitting} className="bg-red-600 hover:bg-red-700">
                    {isSubmitting ? 'Registrando...' : 'Registrar Manutenção'}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayoutSimple>
  );
};

export default ManutencaoPage;