import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft,
  DollarSign,
  FileText,
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
  Download,
  Eye,
  Filter
} from "lucide-react";
import { useLocation } from "wouter";

interface Faturamento {
  id: number;
  numeroNF: string;
  cliente: string;
  veiculo: string;
  servicos: string;
  valor: number;
  dataEmissao: string;
  dataVencimento: string;
  status: 'pago' | 'pendente' | 'vencido';
  formaPagamento?: string;
}

export default function AutofreiFaturamentos() {
  const [, setLocation] = useLocation();
  const [faturamentos, setFaturamentos] = useState<Faturamento[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filtroStatus, setFiltroStatus] = useState<string>('todos');
  const { toast } = useToast();

  useEffect(() => {
    loadFaturamentos();
  }, []);

  const loadFaturamentos = async () => {
    try {
      setIsLoading(true);
      // Simulando dados para demonstração
      setTimeout(() => {
        setFaturamentos([
          {
            id: 1,
            numeroNF: "00001",
            cliente: "Grupo Pereira",
            veiculo: "ABC1234",
            servicos: "Troca de pastilhas de freio e discos",
            valor: 450.00,
            dataEmissao: "2025-08-20",
            dataVencimento: "2025-08-30",
            status: "pago",
            formaPagamento: "PIX"
          },
          {
            id: 2,
            numeroNF: "00002", 
            cliente: "Santa Clara",
            veiculo: "XYZ5678",
            servicos: "Revisão completa e troca de filtros",
            valor: 320.00,
            dataEmissao: "2025-08-21",
            dataVencimento: "2025-08-31",
            status: "pendente"
          },
          {
            id: 3,
            numeroNF: "00003",
            cliente: "Grupo Pereira", 
            veiculo: "DEF9012",
            servicos: "Alinhamento e balanceamento",
            valor: 180.00,
            dataEmissao: "2025-08-15",
            dataVencimento: "2025-08-25",
            status: "vencido"
          },
          {
            id: 4,
            numeroNF: "00004",
            cliente: "Full Meli",
            veiculo: "GHI3456", 
            servicos: "Manutenção do sistema elétrico",
            valor: 680.00,
            dataEmissao: "2025-08-22",
            dataVencimento: "2025-09-01",
            status: "pendente"
          }
        ]);
        setIsLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Erro ao carregar faturamentos:', error);
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      'pago': { label: 'Pago', variant: 'default' as const, icon: CheckCircle },
      'pendente': { label: 'Pendente', variant: 'secondary' as const, icon: Clock },
      'vencido': { label: 'Vencido', variant: 'destructive' as const, icon: AlertCircle }
    };
    
    const statusInfo = statusMap[status as keyof typeof statusMap];
    const Icon = statusInfo.icon;
    
    return (
      <Badge variant={statusInfo.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {statusInfo.label}
      </Badge>
    );
  };

  const faturamentosFiltrados = faturamentos.filter(f => 
    filtroStatus === 'todos' || f.status === filtroStatus
  );

  const totais = {
    pago: faturamentos.filter(f => f.status === 'pago').reduce((sum, f) => sum + f.valor, 0),
    pendente: faturamentos.filter(f => f.status === 'pendente').reduce((sum, f) => sum + f.valor, 0),
    vencido: faturamentos.filter(f => f.status === 'vencido').reduce((sum, f) => sum + f.valor, 0)
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Button 
                variant="ghost" 
                onClick={() => setLocation('/oficina/autofrei/dashboard')}
                className="mr-4"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Faturamentos - AUTOFREI</h1>
                <p className="text-sm text-gray-500">Gestão de faturas e recebimentos</p>
              </div>
            </div>
            <Button className="bg-green-600 hover:bg-green-700">
              <Download className="h-4 w-4 mr-2" />
              Exportar Relatório
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Faturado</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">R$ {(totais.pago + totais.pendente + totais.vencido).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
              <p className="text-xs text-muted-foreground">Este mês</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Recebido</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">R$ {totais.pago.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
              <p className="text-xs text-muted-foreground">Pagamentos confirmados</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pendente</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">R$ {totais.pendente.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
              <p className="text-xs text-muted-foreground">Aguardando pagamento</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Vencido</CardTitle>
              <AlertCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">R$ {totais.vencido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
              <p className="text-xs text-muted-foreground">Em atraso</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters and List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Lista de Faturamentos</CardTitle>
                <CardDescription>Gerencie suas faturas e acompanhe pagamentos</CardDescription>
              </div>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  Filtros
                </Button>
                <select 
                  value={filtroStatus}
                  onChange={(e) => setFiltroStatus(e.target.value)}
                  className="px-3 py-2 border rounded-md text-sm"
                >
                  <option value="todos">Todos</option>
                  <option value="pago">Pagos</option>
                  <option value="pendente">Pendentes</option>
                  <option value="vencido">Vencidos</option>
                </select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <p className="text-gray-500">Carregando faturamentos...</p>
              </div>
            ) : faturamentosFiltrados.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Nenhum faturamento encontrado</p>
              </div>
            ) : (
              <div className="space-y-4">
                {faturamentosFiltrados.map((fatura) => (
                  <div key={fatura.id} className="border rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <div className="bg-blue-100 p-2 rounded-lg">
                          <FileText className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">
                            NF #{fatura.numeroNF}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {fatura.cliente} - {fatura.veiculo}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getStatusBadge(fatura.status)}
                        <span className="text-lg font-bold text-gray-900">
                          R$ {fatura.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                    
                    <p className="text-gray-700 mb-3">{fatura.servicos}</p>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Emissão</p>
                        <p className="font-medium">{new Date(fatura.dataEmissao).toLocaleDateString('pt-BR')}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Vencimento</p>
                        <p className="font-medium">{new Date(fatura.dataVencimento).toLocaleDateString('pt-BR')}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Pagamento</p>
                        <p className="font-medium">{fatura.formaPagamento || 'Não informado'}</p>
                      </div>
                      <div className="flex justify-end space-x-2">
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          Ver
                        </Button>
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4 mr-1" />
                          PDF
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}