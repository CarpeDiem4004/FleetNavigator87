import React, { useState, useEffect } from 'react';
import MainLayoutSimple from '@/components/layout/MainLayoutSimple';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus, RefreshCcw, Search, Edit, Trash2, Truck, FileText } from 'lucide-react';
import { api } from '@/services/api';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface LineHallTrip {
  id: number;
  placa_cavalo: string;
  placa_carreta_1: string;
  placa_carreta_2?: string | null;
  motorista_id: number;
  motorista_nome: string;
  local_carregamento: string;
  local_descarregamento: string;
  km_inicial: number;
  km_final: number;
  distancia_percorrida: number;
  status_viagem: string;
  data_inicio: string;
  data_fim?: string | null;
  observacoes?: string | null;
  created_at: string;
  updated_at: string;
}

const statusLabels: Record<string, string> = {
  'Concluída': 'bg-green-100 text-green-800',
  'No Show': 'bg-red-100 text-red-800',
  'Cancelada pelo Cliente': 'bg-orange-100 text-orange-800'
};

export default function LineHallShopeePage() {
  const { toast } = useToast();
  const [trips, setTrips] = useState<LineHallTrip[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Form states
  const [currentTrip, setCurrentTrip] = useState<Partial<LineHallTrip>>({
    placa_cavalo: '',
    placa_carreta_1: '',
    placa_carreta_2: '',
    motorista_id: 0,
    motorista_nome: '',
    local_carregamento: '',
    local_descarregamento: '',
    km_inicial: 0,
    km_final: 0,
    status_viagem: 'Concluída',
    observacoes: ''
  });

  useEffect(() => {
    fetchTrips();
  }, []);

  const fetchTrips = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/line-hall-shopee');
      if (response.data.success) {
        setTrips(response.data.data);
      } else {
        toast({
          title: "Erro ao buscar viagens",
          description: response.data.message || "Ocorreu um erro ao buscar as viagens",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error("Erro ao carregar viagens:", error);
      toast({
        title: "Erro ao buscar viagens",
        description: error.message || "Ocorreu um erro ao buscar as viagens",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTrip = async () => {
    try {
      // Validar campos obrigatórios
      if (!currentTrip.placa_cavalo || !currentTrip.placa_carreta_1 || 
          !currentTrip.motorista_nome || !currentTrip.local_carregamento || 
          !currentTrip.local_descarregamento || !currentTrip.km_inicial || 
          !currentTrip.km_final || !currentTrip.status_viagem) {
        toast({
          title: "Campos obrigatórios",
          description: "Preencha todos os campos obrigatórios",
          variant: "destructive"
        });
        return;
      }

      // Validar KM
      if (currentTrip.km_final! < currentTrip.km_inicial!) {
        toast({
          title: "KM inválido",
          description: "O KM final deve ser maior que o KM inicial",
          variant: "destructive"
        });
        return;
      }

      const response = await api.post('/line-hall-shopee', currentTrip);
      
      if (response.data.success) {
        toast({
          title: "Viagem registrada",
          description: "Viagem registrada com sucesso!",
          variant: "default"
        });
        setIsCreating(false);
        fetchTrips();
        // Reset form
        setCurrentTrip({
          placa_cavalo: '',
          placa_carreta_1: '',
          placa_carreta_2: '',
          motorista_id: 0,
          motorista_nome: '',
          local_carregamento: '',
          local_descarregamento: '',
          km_inicial: 0,
          km_final: 0,
          status_viagem: 'Concluída',
          observacoes: ''
        });
      } else {
        toast({
          title: "Erro ao registrar viagem",
          description: response.data.message || "Ocorreu um erro ao registrar a viagem",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error("Erro ao registrar viagem:", error);
      toast({
        title: "Erro ao registrar viagem",
        description: error.message || "Ocorreu um erro ao registrar a viagem",
        variant: "destructive"
      });
    }
  };

  const handleUpdateTrip = async () => {
    try {
      if (!currentTrip.id) return;

      const response = await api.put(`/line-hall-shopee/${currentTrip.id}`, currentTrip);
      
      if (response.data.success) {
        toast({
          title: "Viagem atualizada",
          description: "Viagem atualizada com sucesso!",
          variant: "default"
        });
        setIsEditing(false);
        fetchTrips();
      } else {
        toast({
          title: "Erro ao atualizar viagem",
          description: response.data.message || "Ocorreu um erro ao atualizar a viagem",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error("Erro ao atualizar viagem:", error);
      toast({
        title: "Erro ao atualizar viagem",
        description: error.message || "Ocorreu um erro ao atualizar a viagem",
        variant: "destructive"
      });
    }
  };

  const handleDeleteTrip = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir esta viagem? Esta ação não pode ser desfeita.')) {
      return;
    }

    try {
      const response = await api.delete(`/line-hall-shopee/${id}`);
      
      if (response.data.success) {
        toast({
          title: "Viagem excluída",
          description: "Viagem excluída com sucesso!",
          variant: "default"
        });
        fetchTrips();
      } else {
        toast({
          title: "Erro ao excluir viagem",
          description: response.data.message || "Ocorreu um erro ao excluir a viagem",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error("Erro ao excluir viagem:", error);
      toast({
        title: "Erro ao excluir viagem",
        description: error.message || "Ocorreu um erro ao excluir a viagem",
        variant: "destructive"
      });
    }
  };

  const editTrip = (trip: LineHallTrip) => {
    setCurrentTrip(trip);
    setIsEditing(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCurrentTrip(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setCurrentTrip(prev => ({ ...prev, [name]: value }));
  };

  const filteredTrips = trips.filter(trip => {
    const searchLower = searchTerm.toLowerCase();
    return (
      trip.placa_cavalo.toLowerCase().includes(searchLower) ||
      trip.placa_carreta_1.toLowerCase().includes(searchLower) ||
      (trip.placa_carreta_2 && trip.placa_carreta_2.toLowerCase().includes(searchLower)) ||
      trip.motorista_nome.toLowerCase().includes(searchLower) ||
      trip.local_carregamento.toLowerCase().includes(searchLower) ||
      trip.local_descarregamento.toLowerCase().includes(searchLower)
    );
  });

  return (
    <MainLayoutSimple>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Line Hall Shopee</h1>
            <p className="text-muted-foreground">
              Gerenciamento de viagens de Line Hall
            </p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={fetchTrips} className="flex items-center">
              <RefreshCcw className="mr-2 h-4 w-4" />
              Atualizar
            </Button>
            <Dialog open={isCreating} onOpenChange={setIsCreating}>
              <DialogTrigger asChild>
                <Button className="flex items-center">
                  <Plus className="mr-2 h-4 w-4" />
                  Nova Viagem
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>Registrar Nova Viagem</DialogTitle>
                  <DialogDescription>
                    Preencha os dados da viagem do Line Hall Shopee
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="placa_cavalo">Placa do Cavalo *</Label>
                      <Input
                        id="placa_cavalo"
                        name="placa_cavalo"
                        placeholder="ABC1234"
                        value={currentTrip.placa_cavalo || ''}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="placa_carreta_1">Placa da Carreta 1 *</Label>
                      <Input
                        id="placa_carreta_1"
                        name="placa_carreta_1"
                        placeholder="XYZ5678"
                        value={currentTrip.placa_carreta_1 || ''}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="placa_carreta_2">Placa da Carreta 2</Label>
                      <Input
                        id="placa_carreta_2"
                        name="placa_carreta_2"
                        placeholder="DEF9012"
                        value={currentTrip.placa_carreta_2 || ''}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="motorista_nome">Nome do Motorista *</Label>
                      <Input
                        id="motorista_nome"
                        name="motorista_nome"
                        placeholder="Nome do Motorista"
                        value={currentTrip.motorista_nome || ''}
                        onChange={handleInputChange}
                      />
                      <Input
                        type="hidden"
                        name="motorista_id"
                        value={currentTrip.motorista_id || 0}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="local_carregamento">Local Carregamento *</Label>
                      <Input
                        id="local_carregamento"
                        name="local_carregamento"
                        placeholder="Local de Carregamento"
                        value={currentTrip.local_carregamento || ''}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="local_descarregamento">Local Descarregamento *</Label>
                      <Input
                        id="local_descarregamento"
                        name="local_descarregamento"
                        placeholder="Local de Descarregamento"
                        value={currentTrip.local_descarregamento || ''}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="km_inicial">KM Inicial *</Label>
                      <Input
                        id="km_inicial"
                        name="km_inicial"
                        type="number"
                        placeholder="0"
                        value={currentTrip.km_inicial || ''}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="km_final">KM Final *</Label>
                      <Input
                        id="km_final"
                        name="km_final"
                        type="number"
                        placeholder="0"
                        value={currentTrip.km_final || ''}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="status_viagem">Status da Viagem *</Label>
                      <Select 
                        name="status_viagem"
                        value={currentTrip.status_viagem} 
                        onValueChange={(value) => handleSelectChange('status_viagem', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Concluída">Concluída</SelectItem>
                          <SelectItem value="No Show">No Show</SelectItem>
                          <SelectItem value="Cancelada pelo Cliente">Cancelada pelo Cliente</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="observacoes">Observações</Label>
                      <Input
                        id="observacoes"
                        name="observacoes"
                        placeholder="Observações sobre a viagem"
                        value={currentTrip.observacoes || ''}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsCreating(false)}>Cancelar</Button>
                  <Button type="button" onClick={handleCreateTrip}>Registrar Viagem</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <div className="relative flex-grow">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar por placa, motorista ou local..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Truck className="mr-2 h-5 w-5" />
              Viagens Line Hall Shopee
            </CardTitle>
            <CardDescription>
              Listagem de todas as viagens registradas
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredTrips.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg font-medium">Nenhuma viagem encontrada</p>
                <p className="text-muted-foreground">Registre uma nova viagem para começar</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Cavalo</TableHead>
                      <TableHead>Carreta(s)</TableHead>
                      <TableHead>Motorista</TableHead>
                      <TableHead>Origem-Destino</TableHead>
                      <TableHead>KM Percorrido</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTrips.map((trip) => (
                      <TableRow key={trip.id}>
                        <TableCell className="font-medium">{trip.id}</TableCell>
                        <TableCell>{trip.placa_cavalo}</TableCell>
                        <TableCell>
                          {trip.placa_carreta_1}
                          {trip.placa_carreta_2 && <div className="text-xs text-muted-foreground">{trip.placa_carreta_2}</div>}
                        </TableCell>
                        <TableCell>{trip.motorista_nome}</TableCell>
                        <TableCell>
                          <span className="font-medium">{trip.local_carregamento}</span> 
                          <span className="mx-1">→</span> 
                          <span>{trip.local_descarregamento}</span>
                        </TableCell>
                        <TableCell>{trip.distancia_percorrida} km</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusLabels[trip.status_viagem] || 'bg-gray-100'}`}>
                            {trip.status_viagem}
                          </span>
                        </TableCell>
                        <TableCell>
                          {format(new Date(trip.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => editTrip(trip)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteTrip(trip.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
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

      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Editar Viagem</DialogTitle>
            <DialogDescription>
              Atualize os dados da viagem do Line Hall Shopee
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit_placa_cavalo">Placa do Cavalo *</Label>
                <Input
                  id="edit_placa_cavalo"
                  name="placa_cavalo"
                  placeholder="ABC1234"
                  value={currentTrip.placa_cavalo || ''}
                  onChange={handleInputChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_placa_carreta_1">Placa da Carreta 1 *</Label>
                <Input
                  id="edit_placa_carreta_1"
                  name="placa_carreta_1"
                  placeholder="XYZ5678"
                  value={currentTrip.placa_carreta_1 || ''}
                  onChange={handleInputChange}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit_placa_carreta_2">Placa da Carreta 2</Label>
                <Input
                  id="edit_placa_carreta_2"
                  name="placa_carreta_2"
                  placeholder="DEF9012"
                  value={currentTrip.placa_carreta_2 || ''}
                  onChange={handleInputChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_motorista_nome">Nome do Motorista *</Label>
                <Input
                  id="edit_motorista_nome"
                  name="motorista_nome"
                  placeholder="Nome do Motorista"
                  value={currentTrip.motorista_nome || ''}
                  onChange={handleInputChange}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit_local_carregamento">Local Carregamento *</Label>
                <Input
                  id="edit_local_carregamento"
                  name="local_carregamento"
                  placeholder="Local de Carregamento"
                  value={currentTrip.local_carregamento || ''}
                  onChange={handleInputChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_local_descarregamento">Local Descarregamento *</Label>
                <Input
                  id="edit_local_descarregamento"
                  name="local_descarregamento"
                  placeholder="Local de Descarregamento"
                  value={currentTrip.local_descarregamento || ''}
                  onChange={handleInputChange}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit_km_inicial">KM Inicial *</Label>
                <Input
                  id="edit_km_inicial"
                  name="km_inicial"
                  type="number"
                  placeholder="0"
                  value={currentTrip.km_inicial || ''}
                  onChange={handleInputChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_km_final">KM Final *</Label>
                <Input
                  id="edit_km_final"
                  name="km_final"
                  type="number"
                  placeholder="0"
                  value={currentTrip.km_final || ''}
                  onChange={handleInputChange}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit_status_viagem">Status da Viagem *</Label>
                <Select 
                  name="status_viagem"
                  value={currentTrip.status_viagem} 
                  onValueChange={(value) => handleSelectChange('status_viagem', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Concluída">Concluída</SelectItem>
                    <SelectItem value="No Show">No Show</SelectItem>
                    <SelectItem value="Cancelada pelo Cliente">Cancelada pelo Cliente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit_observacoes">Observações</Label>
                <Input
                  id="edit_observacoes"
                  name="observacoes"
                  placeholder="Observações sobre a viagem"
                  value={currentTrip.observacoes || ''}
                  onChange={handleInputChange}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>Cancelar</Button>
            <Button type="button" onClick={handleUpdateTrip}>Atualizar Viagem</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayoutSimple>
  );
}