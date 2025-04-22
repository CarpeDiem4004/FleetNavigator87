import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase-client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  Truck,
  CircleDot,
  RefreshCcw,
  Plus,
  History,
  Tool,
  Trash2,
  Search,
  ArrowLeftRight
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

// Interfaces
interface Tire {
  id: number;
  codigo: string;
  marca: string;
  modelo: string;
  medida: string;
  status: 'em_uso' | 'estoque' | 'descartado';
  veiculo_placa?: string | null;
  posicao?: string | null;
}

interface TireMounting {
  id: number;
  pneu_id: number;
  placa_veiculo: string;
  km_instalacao: number;
  km_remocao?: number | null;
  data_instalacao: string;
  data_remocao?: string | null;
  motivo_remocao?: string | null;
  posicao?: string | null;
  pneu?: Tire;
}

// Componente principal
export default function TireMountingHistory() {
  const { toast } = useToast();
  const [availableTires, setAvailableTires] = useState<Tire[]>([]);
  const [mountHistory, setMountHistory] = useState<TireMounting[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [showMountingDialog, setShowMountingDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Form states
  const [selectedTireId, setSelectedTireId] = useState<string>('');
  const [vehiclePlate, setVehiclePlate] = useState('');
  const [position, setPosition] = useState('');
  const [installationKm, setInstallationKm] = useState('');

  // Fetch available tires
  useEffect(() => {
    fetchAvailableTires();
    fetchMountingHistory();
  }, []);

  // Funções para buscar dados
  const fetchAvailableTires = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('pneus')
        .select('*')
        .eq('status', 'estoque');

      if (error) {
        throw error;
      }

      setAvailableTires(data || []);
    } catch (error: any) {
      toast({
        title: "Erro ao buscar pneus disponíveis",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMountingHistory = async () => {
    setIsHistoryLoading(true);
    try {
      const { data, error } = await supabase
        .from('montagem_pneus')
        .select(`
          *,
          pneu:pneu_id(id, codigo, marca, modelo, medida, status)
        `)
        .order('data_instalacao', { ascending: false });

      if (error) {
        throw error;
      }

      setMountHistory(data || []);
    } catch (error: any) {
      toast({
        title: "Erro ao buscar histórico de montagem",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsHistoryLoading(false);
    }
  };

  // Função para montar um pneu
  const handleMountTire = async () => {
    if (!selectedTireId || !vehiclePlate || !installationKm) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive"
      });
      return;
    }

    try {
      // 1. Inserir o registro de montagem
      const { data: mountingData, error: mountingError } = await supabase
        .from('montagem_pneus')
        .insert({
          pneu_id: parseInt(selectedTireId),
          placa_veiculo: vehiclePlate.toUpperCase(),
          km_instalacao: parseInt(installationKm),
          data_instalacao: new Date().toISOString(),
          posicao: position || null
        })
        .select();

      if (mountingError) throw mountingError;

      // 2. Atualizar o status do pneu para "em_uso"
      const { error: updateError } = await supabase
        .from('pneus')
        .update({
          status: 'em_uso',
          veiculo_placa: vehiclePlate.toUpperCase(),
          posicao: position || null
        })
        .eq('id', selectedTireId);

      if (updateError) throw updateError;

      // 3. Exibir mensagem de sucesso
      toast({
        title: "Pneu montado com sucesso",
        description: "O pneu foi montado e seu status foi atualizado",
        variant: "default"
      });

      // 4. Atualizar as listas
      fetchAvailableTires();
      fetchMountingHistory();
      
      // 5. Fechar o diálogo
      setShowMountingDialog(false);
      
      // 6. Limpar o formulário
      setSelectedTireId('');
      setVehiclePlate('');
      setPosition('');
      setInstallationKm('');
      
    } catch (error: any) {
      toast({
        title: "Erro ao montar pneu",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  // Função para remover um pneu
  const handleRemoveTire = async (mountingId: number, tireId: number) => {
    // Solicitar a quilometragem de remoção
    const kmRemocao = prompt("Informe a quilometragem atual do veículo:");
    
    if (!kmRemocao) return;
    
    const kmRemovalValue = parseInt(kmRemocao);
    
    if (isNaN(kmRemovalValue) || kmRemovalValue <= 0) {
      toast({
        title: "Quilometragem inválida",
        description: "Informe um valor numérico válido para a quilometragem",
        variant: "destructive"
      });
      return;
    }
    
    // Solicitar o motivo da remoção
    const motivoRemocao = prompt("Informe o motivo da remoção do pneu:");
    
    try {
      // 1. Atualizar o registro de montagem com a data e km de remoção
      const { error: updateMountingError } = await supabase
        .from('montagem_pneus')
        .update({
          data_remocao: new Date().toISOString(),
          km_remocao: kmRemovalValue,
          motivo_remocao: motivoRemocao || 'Não especificado'
        })
        .eq('id', mountingId);

      if (updateMountingError) throw updateMountingError;

      // 2. Atualizar o status do pneu para "estoque"
      const { error: updateTireError } = await supabase
        .from('pneus')
        .update({
          status: 'estoque',
          veiculo_placa: null,
          posicao: null
        })
        .eq('id', tireId);

      if (updateTireError) throw updateTireError;

      // 3. Exibir mensagem de sucesso
      toast({
        title: "Pneu removido com sucesso",
        description: "O pneu foi removido e seu status foi atualizado para estoque",
        variant: "default"
      });

      // 4. Atualizar as listas
      fetchAvailableTires();
      fetchMountingHistory();
      
    } catch (error: any) {
      toast({
        title: "Erro ao remover pneu",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  // Filtrar o histórico de montagem
  const filteredHistory = searchTerm
    ? mountHistory.filter(
        (mount) =>
          mount.placa_veiculo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          mount.pneu?.codigo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          mount.pneu?.marca?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          mount.pneu?.modelo?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : mountHistory;

  return (
    <div className="space-y-6">
      {/* Cabeçalho e botões de ação */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold flex items-center">
            <ArrowLeftRight className="mr-2 h-5 w-5" />
            Montagem e Histórico de Pneus
          </h2>
          <p className="text-muted-foreground">
            Gerencie a montagem e remoção de pneus nos veículos
          </p>
        </div>
        <div className="flex space-x-2">
          <Button 
            onClick={() => setShowMountingDialog(true)}
            className="flex items-center"
          >
            <Plus className="mr-2 h-4 w-4" />
            Montar Pneu
          </Button>
          <Button 
            variant="outline" 
            onClick={() => {
              fetchAvailableTires();
              fetchMountingHistory();
            }}
            className="flex items-center"
          >
            <RefreshCcw className="mr-2 h-4 w-4" />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Pesquisa */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-grow">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar por placa ou código do pneu..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Tabela de histórico */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <History className="mr-2 h-5 w-5" /> 
            Histórico de Montagem e Remoção
          </CardTitle>
          <CardDescription>
            Registros de todas as movimentações de pneus na frota
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isHistoryLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-muted-foreground">Carregando histórico...</p>
            </div>
          ) : filteredHistory.length === 0 ? (
            <div className="text-center py-8">
              <CircleDot className="h-8 w-8 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Nenhum registro de montagem encontrado</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Pneu</TableHead>
                    <TableHead>Veículo</TableHead>
                    <TableHead>Posição</TableHead>
                    <TableHead className="text-right">KM Instalação</TableHead>
                    <TableHead className="text-right">KM Remoção</TableHead>
                    <TableHead>Data Instalação</TableHead>
                    <TableHead>Data Remoção</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-center">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredHistory.map((mount) => (
                    <TableRow key={mount.id}>
                      <TableCell className="font-medium">
                        {mount.pneu?.codigo || 'N/A'} 
                        <div className="text-xs text-muted-foreground">
                          {mount.pneu?.marca} {mount.pneu?.modelo} {mount.pneu?.medida}
                        </div>
                      </TableCell>
                      <TableCell>{mount.placa_veiculo}</TableCell>
                      <TableCell>{mount.posicao || 'N/D'}</TableCell>
                      <TableCell className="text-right">{mount.km_instalacao.toLocaleString('pt-BR')}</TableCell>
                      <TableCell className="text-right">
                        {mount.km_remocao ? mount.km_remocao.toLocaleString('pt-BR') : '-'}
                      </TableCell>
                      <TableCell>
                        {mount.data_instalacao ? format(new Date(mount.data_instalacao), 'dd/MM/yyyy', { locale: ptBR }) : '-'}
                      </TableCell>
                      <TableCell>
                        {mount.data_remocao ? format(new Date(mount.data_remocao), 'dd/MM/yyyy', { locale: ptBR }) : '-'}
                      </TableCell>
                      <TableCell>
                        {!mount.data_remocao ? (
                          <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-800/20 dark:text-green-400">
                            Montado
                          </Badge>
                        ) : (
                          <Badge variant="outline">
                            Removido
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {!mount.data_remocao && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRemoveTire(mount.id, mount.pneu_id)}
                            title="Remover pneu"
                          >
                            <Tool className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Diálogo de montagem de pneus */}
      <Dialog open={showMountingDialog} onOpenChange={setShowMountingDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Truck className="mr-2 h-5 w-5" />
              Montar Pneu em Veículo
            </DialogTitle>
            <DialogDescription>
              Selecione um pneu disponível e informe os dados do veículo
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="tire">Pneu</Label>
              <Select 
                value={selectedTireId} 
                onValueChange={setSelectedTireId}
              >
                <SelectTrigger id="tire" className="w-full">
                  <SelectValue placeholder="Selecione um pneu disponível" />
                </SelectTrigger>
                <SelectContent>
                  {availableTires.length === 0 ? (
                    <div className="text-center py-2 text-muted-foreground">
                      Nenhum pneu em estoque
                    </div>
                  ) : (
                    availableTires.map((tire) => (
                      <SelectItem key={tire.id} value={tire.id.toString()}>
                        {tire.codigo} - {tire.marca} {tire.modelo} {tire.medida}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="vehiclePlate">Placa do Veículo</Label>
                <Input
                  id="vehiclePlate"
                  placeholder="Ex: ABC1234"
                  value={vehiclePlate}
                  onChange={(e) => setVehiclePlate(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="position">Posição</Label>
                <Select 
                  value={position} 
                  onValueChange={setPosition}
                >
                  <SelectTrigger id="position" className="w-full">
                    <SelectValue placeholder="Selecione a posição" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dianteira_esquerda">Dianteira Esquerda</SelectItem>
                    <SelectItem value="dianteira_direita">Dianteira Direita</SelectItem>
                    <SelectItem value="traseira_esquerda">Traseira Esquerda</SelectItem>
                    <SelectItem value="traseira_direita">Traseira Direita</SelectItem>
                    <SelectItem value="traseira_dupla_interna">Traseira Dupla Interna</SelectItem>
                    <SelectItem value="traseira_dupla_externa">Traseira Dupla Externa</SelectItem>
                    <SelectItem value="estepe">Estepe</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="kmInstallation">Quilometragem de Instalação</Label>
              <Input
                id="kmInstallation"
                type="number"
                placeholder="Ex: 50000"
                value={installationKm}
                onChange={(e) => setInstallationKm(e.target.value)}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMountingDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleMountTire}>
              Montar Pneu
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}