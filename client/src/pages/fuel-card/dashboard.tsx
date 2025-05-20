import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
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
  CheckCircle2, 
  Clock, 
  CreditCard, 
  Filter, 
  Loader2,
  RefreshCw,
  XCircle 
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { queryClient } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

type FuelCardSolicitation = {
  id: number;
  placa: string;
  km: number;
  tipo_cartao: string;
  provedor_cartao: string;
  numero_cartao?: string;
  motorista: string;
  observacoes?: string;
  status: 'pendente' | 'atendido' | 'rejeitado';
  data_solicitacao: string;
  data_atendimento?: string;
  atendido_por?: string;
  valor_solicitado?: number;
  base?: string;
  id_rota?: string;
};

export default function FuelCardDashboard() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("all");
  
  const { data: apiResponse, isLoading, isError, error } = useQuery({
    queryKey: ['/api/fuel-card-solicitations'],
    refetchInterval: 30000, // Atualiza a cada 30 segundos
    retry: 3
  });
  
  const solicitations: FuelCardSolicitation[] = apiResponse?.data || [];
  const pendingCount = solicitations.filter(s => s.status === 'pendente').length;
  const attendedCount = solicitations.filter(s => s.status === 'atendido').length;
  
  // Calcular o valor total dos cartões atendidos
  // Verificar os valores antes de somar
  const attendedSolicitations = solicitations.filter(s => s.status === 'atendido');
  console.log("Solicitações atendidas:", attendedSolicitations);
  
  // Garantir que todos os valores são números antes de somar
  const totalValueAttended = attendedSolicitations.reduce((sum, s) => {
    // Converter para número e verificar se é válido
    const valor = s.valor_solicitado ? 
      parseFloat(String(s.valor_solicitado).replace(',', '.')) : 0;
    
    console.log("Valor sendo somado:", s.valor_solicitado, "->", valor);
    return sum + valor;
  }, 0);
  
  const handleStatusChange = async (id: number, newStatus: 'atendido' | 'rejeitado') => {
    try {
      const response = await fetch(`/api/fuel-card-solicitations/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });
      
      if (!response.ok) {
        throw new Error("Falha ao atualizar solicitação");
      }
      
      toast({
        title: newStatus === 'atendido' ? "Solicitação atendida" : "Solicitação rejeitada",
        description: "Status da solicitação atualizado com sucesso.",
      });
      
      // Atualiza a lista
      queryClient.invalidateQueries({ queryKey: ['/api/fuel-card-solicitations'] });
      
    } catch (error) {
      toast({
        title: "Erro ao processar",
        description: "Não foi possível atualizar o status da solicitação.",
        variant: "destructive",
      });
    }
  };
  
  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['/api/fuel-card-solicitations'] });
  };
  
  if (isError) {
    return (
      <div className="container mx-auto py-8">
        <Alert variant="destructive">
          <AlertTitle>Erro ao carregar solicitações</AlertTitle>
          <AlertDescription>
            Não foi possível carregar as solicitações de cartão de combustível. 
            {error instanceof Error ? ` ${error.message}` : ''}
          </AlertDescription>
        </Alert>
        <Button onClick={handleRefresh} className="mt-4">
          <RefreshCw className="mr-2 h-4 w-4" /> Tentar novamente
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold">Solicitações de Cartão Combustível</h1>
          <p className="text-muted-foreground">Gerencie as solicitações dos motoristas</p>
        </div>
        
        <div className="flex gap-2">
          <Button onClick={() => window.location.href = '/fuel-card/solicitation'} variant="default" size="sm">
            <CreditCard className="mr-2 h-4 w-4" /> Nova Solicitação
          </Button>
          <Button onClick={handleRefresh} variant="outline" size="sm">
            <RefreshCw className="mr-2 h-4 w-4" /> Atualizar
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xl">Aguardando</CardTitle>
            <CardDescription>Solicitações pendentes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-amber-500 mr-3" />
              <span className="text-4xl font-bold">
                {isLoading ? (
                  <Skeleton className="h-10 w-16" />
                ) : (
                  pendingCount
                )}
              </span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xl">Atendidas</CardTitle>
            <CardDescription>Solicitações processadas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <CheckCircle2 className="h-8 w-8 text-green-500 mr-3" />
              <span className="text-4xl font-bold">
                {isLoading ? (
                  <Skeleton className="h-10 w-16" />
                ) : (
                  attendedCount
                )}
              </span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xl">Valor Total</CardTitle>
            <CardDescription>Cartões atendidos (R$)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <CreditCard className="h-8 w-8 text-blue-500 mr-3" />
              <span className="text-4xl font-bold">
                {isLoading ? (
                  <Skeleton className="h-10 w-16" />
                ) : (
                  `R$ ${isNaN(totalValueAttended) ? '0,00' : totalValueAttended.toFixed(2).replace('.', ',')}`
                )}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex justify-between items-center mb-4">
          <TabsList>
            <TabsTrigger value="all">Todas</TabsTrigger>
            <TabsTrigger value="pending">Aguardando</TabsTrigger>
            <TabsTrigger value="attended">Atendidas</TabsTrigger>
          </TabsList>
          
          <div className="flex items-center">
            <Filter className="mr-2 h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Filtrar por cartão:</span>
            <Button variant="ghost" size="sm">Ticket</Button>
            <Button variant="ghost" size="sm">Alelo</Button>
          </div>
        </div>
        
        <TabsContent value="all" className="mt-0">
          <Card>
            <CardContent className="p-0">
              <SolicitationsTable 
                solicitations={solicitations} 
                isLoading={isLoading} 
                onStatusChange={handleStatusChange}
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="pending" className="mt-0">
          <Card>
            <CardContent className="p-0">
              <SolicitationsTable 
                solicitations={solicitations.filter(s => s.status === 'pendente')} 
                isLoading={isLoading} 
                onStatusChange={handleStatusChange}
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="attended" className="mt-0">
          <Card>
            <CardContent className="p-0">
              <SolicitationsTable 
                solicitations={solicitations.filter(s => s.status === 'atendido')} 
                isLoading={isLoading} 
                onStatusChange={handleStatusChange}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function SolicitationsTable({ 
  solicitations, 
  isLoading,
  onStatusChange
}: { 
  solicitations: FuelCardSolicitation[];
  isLoading: boolean;
  onStatusChange: (id: number, status: 'atendido' | 'rejeitado') => Promise<void>;
}) {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Carregando solicitações...</span>
      </div>
    );
  }
  
  if (solicitations.length === 0) {
    return (
      <div className="p-8 text-center">
        <CreditCard className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium">Nenhuma solicitação encontrada</h3>
        <p className="text-muted-foreground">
          Não há solicitações de cartão combustível para exibir nesta categoria.
        </p>
      </div>
    );
  }

  return (
    <Table>
      <TableCaption>Lista de solicitações de cartão combustível</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>ID</TableHead>
          <TableHead>Placa</TableHead>
          <TableHead>KM</TableHead>
          <TableHead>Motorista</TableHead>
          <TableHead>Base</TableHead>
          <TableHead>ID Rota</TableHead>
          <TableHead>Valor</TableHead>
          <TableHead>Tipo</TableHead>
          <TableHead>Cartão</TableHead>
          <TableHead>Data</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {solicitations.map((solicitation) => (
          <TableRow key={solicitation.id}>
            <TableCell className="font-medium">{solicitation.id}</TableCell>
            <TableCell>{solicitation.placa}</TableCell>
            <TableCell>{solicitation.km}</TableCell>
            <TableCell>{solicitation.motorista}</TableCell>
            <TableCell>{solicitation.base || '-'}</TableCell>
            <TableCell>{solicitation.id_rota || '-'}</TableCell>
            <TableCell>
              {solicitation.valor_solicitado 
                ? `R$ ${solicitation.valor_solicitado.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                : 'R$ 150,00'}
            </TableCell>
            <TableCell>{solicitation.tipo_cartao === 'placa' ? 'Placa' : 'Número'}</TableCell>
            <TableCell>
              {solicitation.provedor_cartao} 
              {solicitation.numero_cartao && <span className="ml-1 text-xs text-muted-foreground">({solicitation.numero_cartao})</span>}
            </TableCell>
            <TableCell>{format(new Date(solicitation.data_solicitacao), 'dd/MM/yyyy HH:mm')}</TableCell>
            <TableCell>
              <StatusBadge status={solicitation.status} />
            </TableCell>
            <TableCell>
              {solicitation.status === 'pendente' && (
                <div className="flex space-x-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="h-8 px-2 text-green-600"
                    onClick={() => onStatusChange(solicitation.id, 'atendido')}
                  >
                    <CheckCircle2 className="h-4 w-4 mr-1" /> Atender
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="h-8 px-2 text-red-600"
                    onClick={() => onStatusChange(solicitation.id, 'rejeitado')}
                  >
                    <XCircle className="h-4 w-4 mr-1" /> Rejeitar
                  </Button>
                </div>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'pendente':
      return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Pendente</Badge>;
    case 'atendido':
      return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Atendido</Badge>;
    case 'rejeitado':
      return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Rejeitado</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}