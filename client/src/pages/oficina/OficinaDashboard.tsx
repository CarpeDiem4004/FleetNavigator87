import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Loader2, CheckCircle, Clock, AlertTriangle, XCircle } from "lucide-react";

// Interface para as manutenções
interface Maintenance {
  id: number;
  vehiclePlate: string;
  description: string;
  status: string;
  priority: string;
  createdAt: string;
  estimatedCompletion: string;
  actualCompletion: string | null;
  workshopId: number;
  requestBaseId: number;
  maintenanceType: string;
  vehicleModel?: string;
}

// Função para formatar data
const formatDate = (dateStr: string | null) => {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  return date.toLocaleDateString('pt-BR');
};

// Tradução dos status para exibição
const statusTranslation: Record<string, string> = {
  'pendente': 'Pendente',
  'aguardando_orcamento': 'Aguardando Orçamento',
  'em_andamento': 'Em Andamento',
  'concluida': 'Concluída',
  'cancelada': 'Cancelada'
};

// Componente para exibir o badge com cor conforme o status
const StatusBadge = ({ status }: { status: string }) => {
  let variant: "default" | "destructive" | "outline" | "secondary" = "default";
  
  switch (status) {
    case 'pendente':
      variant = "outline";
      break;
    case 'aguardando_orcamento':
      variant = "secondary";
      break;
    case 'em_andamento':
      variant = "default";
      break;
    case 'concluida':
      variant = "default"; // Verde já é o padrão
      break;
    case 'cancelada':
      variant = "destructive";
      break;
    default:
      variant = "outline";
  }
  
  return (
    <Badge variant={variant}>
      {statusTranslation[status] || status}
    </Badge>
  );
};

// Componente para ícone do status
const StatusIcon = ({ status }: { status: string }) => {
  switch (status) {
    case 'pendente':
      return <Clock className="h-5 w-5 text-yellow-500" />;
    case 'aguardando_orcamento':
      return <AlertTriangle className="h-5 w-5 text-blue-500" />;
    case 'em_andamento':
      return <Loader2 className="h-5 w-5 text-blue-700 animate-spin" />;
    case 'concluida':
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    case 'cancelada':
      return <XCircle className="h-5 w-5 text-red-500" />;
    default:
      return <Clock className="h-5 w-5 text-gray-500" />;
  }
};

export default function OficinaDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [maintenanceItems, setMaintenanceItems] = useState<Maintenance[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<number | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("");
  
  // Função para buscar manutenções da oficina
  const fetchMaintenance = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/workshop/maintenance");
      
      if (!response.ok) {
        throw new Error(`Erro ao buscar manutenções: ${response.statusText}`);
      }
      
      const data = await response.json();
      setMaintenanceItems(data.items || []);
    } catch (error) {
      console.error("Erro ao buscar manutenções da oficina:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as manutenções. Tente novamente mais tarde.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Atualizar status de uma manutenção
  const updateMaintenanceStatus = async (id: number, newStatus: string) => {
    try {
      setUpdating(id);
      const response = await fetch(`/api/workshop/maintenance/${id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ status: newStatus })
      });
      
      if (!response.ok) {
        throw new Error(`Erro ao atualizar status: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Atualizar a lista local
      setMaintenanceItems(prev => 
        prev.map(item => item.id === id ? { ...item, status: newStatus } : item)
      );
      
      toast({
        title: "Sucesso",
        description: "Status da manutenção atualizado com sucesso.",
      });
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o status. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setUpdating(null);
    }
  };
  
  // Carregar manutenções ao montar o componente
  useEffect(() => {
    fetchMaintenance();
  }, []);
  
  // Filtrar manutenções com base no status selecionado
  const filteredMaintenance = filterStatus
    ? maintenanceItems.filter(item => item.status === filterStatus)
    : maintenanceItems;
  
  // Contagem de manutenções por status
  const pendingCount = maintenanceItems.filter(m => m.status === 'pendente').length;
  const awaitingQuoteCount = maintenanceItems.filter(m => m.status === 'aguardando_orcamento').length;
  const inProgressCount = maintenanceItems.filter(m => m.status === 'em_andamento').length;
  const completedCount = maintenanceItems.filter(m => m.status === 'concluida').length;
  
  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Portal da Oficina</h1>
          <p className="text-muted-foreground">
            Gerencie as manutenções designadas para sua oficina
          </p>
        </div>
        <Button onClick={fetchMaintenance} variant="outline">
          Atualizar
        </Button>
      </div>
      
      {/* Cards de estatísticas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingCount}</div>
            <p className="text-xs text-muted-foreground">
              Manutenções aguardando início
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aguardando Orçamento</CardTitle>
            <AlertTriangle className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{awaitingQuoteCount}</div>
            <p className="text-xs text-muted-foreground">
              Orçamentos a enviar
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Em Andamento</CardTitle>
            <Loader2 className="h-4 w-4 text-blue-700" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inProgressCount}</div>
            <p className="text-xs text-muted-foreground">
              Serviços em execução
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Concluídas</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedCount}</div>
            <p className="text-xs text-muted-foreground">
              Serviços finalizados
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Filtros e tabela */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Manutenções</CardTitle>
          <CardDescription>
            Lista de todas as manutenções atribuídas à sua oficina
          </CardDescription>
          
          <div className="flex space-x-2 pt-2">
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos</SelectItem>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="aguardando_orcamento">Aguardando Orçamento</SelectItem>
                <SelectItem value="em_andamento">Em Andamento</SelectItem>
                <SelectItem value="concluida">Concluída</SelectItem>
                <SelectItem value="cancelada">Cancelada</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2">Carregando manutenções...</span>
            </div>
          ) : filteredMaintenance.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              Nenhuma manutenção encontrada.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableCaption>Lista de manutenções atribuídas à oficina.</TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px]">ID</TableHead>
                    <TableHead className="w-[100px]">Placa</TableHead>
                    <TableHead className="w-[180px]">Tipo</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead className="w-[120px]">Data</TableHead>
                    <TableHead className="w-[150px]">Status</TableHead>
                    <TableHead className="w-[200px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMaintenance.map((maintenance) => (
                    <TableRow key={maintenance.id}>
                      <TableCell className="font-medium">{maintenance.id}</TableCell>
                      <TableCell className="font-medium">{maintenance.vehiclePlate}</TableCell>
                      <TableCell>{maintenance.maintenanceType}</TableCell>
                      <TableCell>{maintenance.description}</TableCell>
                      <TableCell>{formatDate(maintenance.createdAt)}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <StatusIcon status={maintenance.status} />
                          <StatusBadge status={maintenance.status} />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          {maintenance.status !== 'concluida' && maintenance.status !== 'cancelada' && (
                            <Select
                              disabled={updating === maintenance.id}
                              onValueChange={(value) => updateMaintenanceStatus(maintenance.id, value)}
                            >
                              <SelectTrigger className="w-[160px]">
                                <SelectValue placeholder="Atualizar Status" />
                              </SelectTrigger>
                              <SelectContent>
                                {maintenance.status !== 'pendente' && (
                                  <SelectItem value="pendente">Pendente</SelectItem>
                                )}
                                {maintenance.status !== 'aguardando_orcamento' && (
                                  <SelectItem value="aguardando_orcamento">Aguardando Orçamento</SelectItem>
                                )}
                                {maintenance.status !== 'em_andamento' && (
                                  <SelectItem value="em_andamento">Em Andamento</SelectItem>
                                )}
                                <SelectItem value="concluida">Concluída</SelectItem>
                                <SelectItem value="cancelada">Cancelada</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                          
                          {updating === maintenance.id && (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          )}
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
      
      {/* Informações da oficina */}
      <Card>
        <CardHeader>
          <CardTitle>Informações da Oficina</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p><strong>Nome:</strong> {user?.name || "-"}</p>
            <p><strong>Email:</strong> {user?.email || "-"}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}