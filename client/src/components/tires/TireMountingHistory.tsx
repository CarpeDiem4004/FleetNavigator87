import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getAllTires, Tire as TireType } from '@/services/tiresService';
import { 
  getAllTireMovements, 
  getTireMovementsByTireId, 
  createTireMovement, 
  updateTireMovement, 
  deleteTireMovement,
  TireMovement
} from '@/services/tireMoveService';
import { useSupabaseAuthContext } from '@/context/SupabaseAuthContext';
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
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import {
  Truck,
  CircleDot,
  RefreshCcw,
  Plus,
  History,
  Wrench,
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
  distancia_percorrida?: number | null;
  data_instalacao: string;
  data_remocao?: string | null;
  motivo_remocao?: string | null;
  posicao?: string | null;
  veiculo_possui_estepe?: boolean;
  responsavel?: string | null;
  pneu?: Tire;
}

// Componente principal
interface TireMountingHistoryProps {
  tireId?: number;
}

export default function TireMountingHistory({ tireId }: TireMountingHistoryProps) {
  const { toast } = useToast();
  const { user, supabaseUser } = useSupabaseAuthContext();
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
  const [hasSpare, setHasSpare] = useState<boolean>(false);

  // Fetch available tires
  useEffect(() => {
    fetchAvailableTires();
    fetchMountingHistory();
  }, [tireId]);

  // Funções para buscar dados
  const fetchAvailableTires = async () => {
    setIsLoading(true);
    try {
      // Usando a API REST para buscar pneus em estoque
      const response = await getAllTires({ status: 'estoque' });
      
      if (response && response.data) {
        // Converter do formato da API para o formato esperado pelo componente
        const tires: Tire[] = response.data.map((tire: TireType) => ({
          id: tire.id || 0,
          codigo: tire.codigo,
          marca: tire.marca,
          modelo: tire.modelo,
          medida: tire.medida,
          status: (tire.status as 'em_uso' | 'estoque' | 'descartado') || 'estoque',
          veiculo_placa: tire.veiculo_placa,
          posicao: tire.posicao
        }));
        setAvailableTires(tires);
      } else {
        setAvailableTires([]);
      }
    } catch (error: any) {
      toast({
        title: "Erro ao buscar pneus disponíveis",
        description: error.message,
        variant: "destructive"
      });
      setAvailableTires([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMountingHistory = async () => {
    setIsHistoryLoading(true);
    try {
      // Obter movimentações de pneus da API
      let response;
      if (tireId) {
        // Se tireId foi fornecido, buscar apenas as movimentações deste pneu
        response = await getTireMovementsByTireId(tireId);
      } else {
        // Caso contrário, buscar todas as movimentações
        response = await getAllTireMovements();
      }
      
      if (response && response.data) {
        // Converter do formato da API para o formato esperado pelo componente
        const mountings: TireMounting[] = response.data
          .filter((move: any) => move.tipo_movimentacao === 'montagem' || move.tipo_movimentacao === 'remocao')
          .map((move: any) => {
            // Determinar se é uma movimentação de montagem ou remoção
            const isMounting = move.tipo_movimentacao === 'montagem';
            
            // Criar pneu relacionado
            const pneu: Tire = {
              id: move.id_pneu,
              codigo: move.pneu_codigo || 'N/D',
              marca: move.pneu_marca || 'N/D',
              modelo: move.pneu_modelo || 'N/D',
              medida: move.pneu_medida || 'N/D',
              status: isMounting ? 'em_uso' : 'estoque',
              veiculo_placa: isMounting ? move.id_veiculo : null,
              posicao: move.local || null
            };
            
            return {
              id: move.id,
              pneu_id: move.id_pneu,
              placa_veiculo: move.id_veiculo || 'N/D',
              km_instalacao: move.km,
              km_remocao: isMounting ? null : move.km,
              distancia_percorrida: move.distancia_percorrida || null,
              data_instalacao: isMounting ? move.data : null,
              data_remocao: isMounting ? null : move.data,
              motivo_remocao: isMounting ? null : move.motivo,
              posicao: move.local || null,
              veiculo_possui_estepe: move.possui_estepe || false,
              responsavel: move.responsavel || null,
              pneu
            };
          });
          
        setMountHistory(mountings);
      } else {
        setMountHistory([]);
      }
    } catch (error: any) {
      toast({
        title: "Erro ao buscar histórico de montagem",
        description: error.message,
        variant: "destructive"
      });
      setMountHistory([]);
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
      // Determinar o nome do usuário responsável
      const responsibleUser = supabaseUser?.user_metadata?.name || user?.name || supabaseUser?.email || 'Usuário';
      
      // Criar o objeto de movimentação para enviar à API
      const tireMovement: TireMovement = {
        id_pneu: parseInt(selectedTireId),
        id_veiculo: vehiclePlate.toUpperCase(),
        tipo_movimentacao: 'montagem',
        km: parseInt(installationKm),
        data: new Date().toISOString(),
        local: position || undefined,
        possui_estepe: hasSpare,
        responsavel: responsibleUser
      };
      
      // Enviar a requisição para a API
      const response = await createTireMovement(tireMovement);
      
      if (response && response.success) {
        toast({
          title: "Pneu montado com sucesso",
          description: "A movimentação de montagem foi registrada com sucesso",
          variant: "default"
        });
        
        // Atualizar o histórico após a montagem
        fetchMountingHistory();
        fetchAvailableTires();
      } else {
        toast({
          title: "Erro ao montar pneu",
          description: response.message || "Ocorreu um erro ao registrar a montagem",
          variant: "destructive"
        });
      }
      
      // Fechar o diálogo
      setShowMountingDialog(false);
      
      // Limpar o formulário
      setSelectedTireId('');
      setVehiclePlate('');
      setPosition('');
      setInstallationKm('');
      setHasSpare(false);
      
    } catch (error: any) {
      toast({
        title: "Erro ao montar pneu",
        description: error.message || "Ocorreu um erro ao registrar a montagem",
        variant: "destructive"
      });
    }
  };

  // Função para remover um pneu
  const handleRemoveTire = async (mountingId: number, tireId: number, kmInstalacao: number) => {
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
    
    // Verificação se a quilometragem de remoção é menor que a de instalação
    if (kmRemovalValue < kmInstalacao) {
      toast({
        title: "Quilometragem inválida",
        description: "A quilometragem de remoção deve ser maior que a de instalação",
        variant: "destructive"
      });
      return;
    }
    
    // Calcular a distância percorrida
    const distanciaPercorrida = kmRemovalValue - kmInstalacao;
    
    // Solicitar o motivo da remoção
    const motivoRemocao = prompt("Informe o motivo da remoção do pneu:");
    
    try {
      // Obter o registro de montagem para pegar o veículo
      const mountingRecord = mountHistory.find(m => m.id === mountingId);
      
      if (!mountingRecord) {
        toast({
          title: "Erro ao remover pneu",
          description: "Registro de montagem não encontrado",
          variant: "destructive"
        });
        return;
      }
      
      // Determinar o nome do usuário responsável
      const responsibleUser = supabaseUser?.user_metadata?.name || user?.name || supabaseUser?.email || 'Usuário';
      
      // Criar o objeto de movimentação para remoção
      const tireMovement: TireMovement = {
        id_pneu: tireId,
        id_veiculo: mountingRecord.placa_veiculo,
        tipo_movimentacao: 'remocao',
        km: kmRemovalValue,
        data: new Date().toISOString(),
        motivo: motivoRemocao || 'Não especificado',
        distancia_percorrida: distanciaPercorrida,
        responsavel: responsibleUser
      };
      
      // Enviar a requisição para a API
      const response = await createTireMovement(tireMovement);
      
      if (response && response.success) {
        toast({
          title: "Pneu removido com sucesso",
          description: "A movimentação de remoção foi registrada com sucesso",
          variant: "default"
        });
        
        // Atualizar o histórico e os pneus disponíveis
        fetchMountingHistory();
        fetchAvailableTires();
      } else {
        toast({
          title: "Erro ao remover pneu",
          description: response.message || "Ocorreu um erro ao registrar a remoção",
          variant: "destructive"
        });
      }
      
    } catch (error: any) {
      toast({
        title: "Erro ao remover pneu",
        description: error.message || "Ocorreu um erro ao registrar a remoção",
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
          mount.pneu?.modelo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          mount.responsavel?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : mountHistory;

  return (
    <div className="space-y-6">
      {/* Cabeçalho e botões de ação */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold flex items-center">
            <ArrowLeftRight className="mr-2 h-5 w-5" />
            {tireId ? 'Histórico de Montagens' : 'Montagem e Histórico de Pneus'}
          </h2>
          <p className="text-muted-foreground">
            {tireId ? 'Visualização das montagens deste pneu' : 'Gerencie a montagem e remoção de pneus nos veículos'}
          </p>
        </div>
        {!tireId && (
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
        )}
      </div>

      {/* Pesquisa */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-grow">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar por placa, código do pneu ou responsável..."
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
                    <TableHead className="text-right">KM Rodados</TableHead>
                    <TableHead>Data Instalação</TableHead>
                    <TableHead>Data Remoção</TableHead>
                    <TableHead>Estepe</TableHead>
                    <TableHead>Responsável</TableHead>
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
                      <TableCell className="text-right">
                        {mount.distancia_percorrida 
                          ? <span className="font-medium text-green-600">{mount.distancia_percorrida.toLocaleString('pt-BR')}</span> 
                          : mount.km_remocao 
                            ? <span className="text-orange-500">{(mount.km_remocao - mount.km_instalacao).toLocaleString('pt-BR')}</span>
                            : '-'
                        }
                      </TableCell>
                      <TableCell>
                        {mount.data_instalacao ? format(new Date(mount.data_instalacao), 'dd/MM/yyyy', { locale: ptBR }) : '-'}
                      </TableCell>
                      <TableCell>
                        {mount.data_remocao ? format(new Date(mount.data_remocao), 'dd/MM/yyyy', { locale: ptBR }) : '-'}
                      </TableCell>
                      <TableCell>
                        {mount.veiculo_possui_estepe === true ? (
                          <Badge variant="default" className="bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-800/20 dark:text-blue-400">
                            Sim
                          </Badge>
                        ) : mount.veiculo_possui_estepe === false ? (
                          <Badge variant="outline" className="bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-800/20 dark:text-gray-400">
                            Não
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {mount.responsavel || 'Não identificado'}
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
                        {!mount.data_remocao && !tireId && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRemoveTire(mount.id, mount.pneu_id, mount.km_instalacao)}
                            title="Remover pneu"
                          >
                            <Wrench className="h-4 w-4" />
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
            
            <div className="space-y-4">
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
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="hasSpare"
                  checked={hasSpare}
                  onCheckedChange={(checked) => setHasSpare(checked as boolean)}
                />
                <Label
                  htmlFor="hasSpare"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Veículo possui estepe
                </Label>
              </div>
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