import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Filter, Check, X, ArrowDown, ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Link } from "wouter";
import AppLayout from "@/components/AppLayout";
import ServicoPrestadoCard from "@/components/ServicoPrestadoCard";

interface Parceiro {
  id: number;
  nome: string;
  cidade: string;
  estado: string;
  avaliacao: number;
}

interface ServicoPrestado {
  id: number;
  parceiro: Parceiro;
  placa: string;
  veiculo: string;
  tipo_servico: string;
  valor: number;
  data_servico: string;
  status: "pendente" | "aprovado" | "rejeitado";
  observacoes?: string;
  local_atendimento?: string;
  km_reboque?: number;
  fotos_servico?: string[];
}

// Dados simulados para demonstração - Em produção, esses dados viriam da API
const servicosSimulados: ServicoPrestado[] = [
  {
    id: 1,
    parceiro: {
      id: 15,
      nome: "Allan de Souza Vieira",
      cidade: "Barueri",
      estado: "SP",
      avaliacao: 5.0
    },
    placa: "ABC1D23",
    veiculo: "Scania R440",
    tipo_servico: "Reboque",
    valor: 750.00,
    data_servico: "2025-05-20T14:30:00",
    status: "pendente",
    observacoes: "Veículo com problema no sistema de freios. Rebocado da Rod. Castello Branco ao pátio da empresa.",
    local_atendimento: "Rod. Castello Branco, km 23",
    km_reboque: 42
  },
  {
    id: 2,
    parceiro: {
      id: 15,
      nome: "Allan de Souza Vieira",
      cidade: "Barueri",
      estado: "SP",
      avaliacao: 5.0
    },
    placa: "DEF5G67",
    veiculo: "Mercedes-Benz Actros",
    tipo_servico: "Socorro Mecânico",
    valor: 450.00,
    data_servico: "2025-05-21T09:15:00",
    status: "pendente",
    observacoes: "Troca de pneu furado e recalibração da pressão em todos os pneus.",
    local_atendimento: "Av. Marginal Tietê, 1500",
    km_reboque: 0
  },
  {
    id: 3,
    parceiro: {
      id: 16,
      nome: "Roberto Guincho Express",
      cidade: "São Paulo",
      estado: "SP",
      avaliacao: 4.2
    },
    placa: "GHI8J90",
    veiculo: "Volkswagen Delivery",
    tipo_servico: "Reboque",
    valor: 580.00,
    data_servico: "2025-05-19T18:40:00",
    status: "pendente",
    observacoes: "Problema no sistema de injeção eletrônica. Veículo não liga.",
    local_atendimento: "Rod. Anhanguera, km 15",
    km_reboque: 28
  },
  {
    id: 4,
    parceiro: {
      id: 17,
      nome: "SOS Caminhões",
      cidade: "Guarulhos",
      estado: "SP",
      avaliacao: 4.8
    },
    placa: "KLM1N23",
    veiculo: "Ford Cargo 2428",
    tipo_servico: "Reboque",
    valor: 690.00,
    data_servico: "2025-05-18T11:20:00",
    status: "aprovado",
    observacoes: "Quebra do eixo cardan. Necessário guincho especial.",
    local_atendimento: "Rod. Presidente Dutra, km 210",
    km_reboque: 35
  },
  {
    id: 5,
    parceiro: {
      id: 18,
      nome: "Reboque Expresso Paulista",
      cidade: "Campinas",
      estado: "SP",
      avaliacao: 3.9
    },
    placa: "OPQ4R56",
    veiculo: "Iveco Daily",
    tipo_servico: "Socorro Mecânico",
    valor: 320.00,
    data_servico: "2025-05-17T16:05:00",
    status: "rejeitado",
    observacoes: "Problema na bomba de combustível. Resolvido no local.",
    local_atendimento: "Rod. Bandeirantes, km 87",
    km_reboque: 0
  }
];

export default function ServicosPendentesPage() {
  const { toast } = useToast();
  const [servicos, setServicos] = useState<ServicoPrestado[]>(servicosSimulados);
  const [filtroStatus, setFiltroStatus] = useState<string>("pendente");
  const [filtroData, setFiltroData] = useState<string>("recentes");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Em produção, aqui seria feita uma chamada à API para buscar os serviços
    // Simulando um carregamento inicial
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  }, []);

  const handleAprovarServico = async (id: number) => {
    // Em produção, aqui seria feita uma chamada à API para aprovar o serviço
    setIsLoading(true);
    
    try {
      // Simulando uma chamada à API com timeout
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Atualiza o estado local após "aprovação"
      setServicos(prevServicos => 
        prevServicos.map(servico => 
          servico.id === id ? { ...servico, status: "aprovado" } : servico
        )
      );
      
      toast({
        title: "Serviço aprovado",
        description: "O serviço foi aprovado com sucesso.",
        variant: "default",
        className: "bg-green-50 border-green-200",
      });
    } catch (error) {
      toast({
        title: "Erro ao aprovar",
        description: "Ocorreu um erro ao aprovar o serviço.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRejeitarServico = async (id: number) => {
    // Em produção, aqui seria feita uma chamada à API para rejeitar o serviço
    setIsLoading(true);
    
    try {
      // Simulando uma chamada à API com timeout
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Atualiza o estado local após "rejeição"
      setServicos(prevServicos => 
        prevServicos.map(servico => 
          servico.id === id ? { ...servico, status: "rejeitado" } : servico
        )
      );
      
      toast({
        title: "Serviço rejeitado",
        description: "O serviço foi rejeitado.",
        variant: "default",
      });
    } catch (error) {
      toast({
        title: "Erro ao rejeitar",
        description: "Ocorreu um erro ao rejeitar o serviço.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDetalharServico = (id: number) => {
    // Em produção, aqui redirecionaria para a página de detalhes do serviço
    // Por enquanto, apenas mostra um toast
    toast({
      title: "Detalhes do serviço",
      description: `Visualizando detalhes do serviço #${id}`,
    });
  };

  // Função para filtrar serviços por status
  const servicosFiltrados = servicos.filter(servico => {
    if (filtroStatus === "todos") return true;
    return servico.status === filtroStatus;
  });

  // Função para ordenar serviços por data
  const servicosOrdenados = [...servicosFiltrados].sort((a, b) => {
    const dateA = new Date(a.data_servico).getTime();
    const dateB = new Date(b.data_servico).getTime();
    return filtroData === "recentes" ? dateB - dateA : dateA - dateB;
  });

  // Contagem de serviços por status para os badges
  const contarServicosPorStatus = (status: string) => {
    return servicos.filter(servico => servico.status === status).length;
  };

  return (
    <AppLayout>
      <div className="container mx-auto py-6">
        <div className="flex items-center mb-6">
          <Link href="/fleet-management/towing-partners">
            <Button variant="ghost" size="sm" className="mr-2">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Voltar
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Serviços Prestados por Parceiros</h1>
        </div>

        <Tabs defaultValue="todos" className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <TabsList>
              <TabsTrigger value="todos" onClick={() => setFiltroStatus("todos")}>
                Todos 
                <Badge variant="outline" className="ml-2 bg-gray-100">
                  {servicos.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="pendente" onClick={() => setFiltroStatus("pendente")}>
                Pendentes
                <Badge variant="outline" className="ml-2 bg-yellow-50 text-yellow-800 border-yellow-200">
                  {contarServicosPorStatus("pendente")}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="aprovado" onClick={() => setFiltroStatus("aprovado")}>
                Aprovados
                <Badge variant="outline" className="ml-2 bg-green-50 text-green-800 border-green-200">
                  {contarServicosPorStatus("aprovado")}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="rejeitado" onClick={() => setFiltroStatus("rejeitado")}>
                Rejeitados
                <Badge variant="outline" className="ml-2 bg-red-50 text-red-800 border-red-200">
                  {contarServicosPorStatus("rejeitado")}
                </Badge>
              </TabsTrigger>
            </TabsList>

            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select
                value={filtroData}
                onValueChange={setFiltroData}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Ordenar por data" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recentes">
                    <div className="flex items-center">
                      <ArrowDown className="h-4 w-4 mr-2" />
                      Mais recentes primeiro
                    </div>
                  </SelectItem>
                  <SelectItem value="antigos">
                    <div className="flex items-center">
                      <ArrowUp className="h-4 w-4 mr-2" />
                      Mais antigos primeiro
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          <TabsContent value="todos" className="space-y-4">
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
              </div>
            ) : servicosOrdenados.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {servicosOrdenados.map((servico) => (
                  <ServicoPrestadoCard
                    key={servico.id}
                    servico={servico}
                    onAprovar={handleAprovarServico}
                    onRejeitar={handleRejeitarServico}
                    onDetalhar={handleDetalharServico}
                  />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-10">
                  <p className="text-muted-foreground mb-2">Nenhum serviço encontrado.</p>
                  <p className="text-sm text-muted-foreground">Não existem serviços com os filtros selecionados.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="pendente" className="space-y-4">
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
              </div>
            ) : servicosOrdenados.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {servicosOrdenados.map((servico) => (
                  <ServicoPrestadoCard
                    key={servico.id}
                    servico={servico}
                    onAprovar={handleAprovarServico}
                    onRejeitar={handleRejeitarServico}
                    onDetalhar={handleDetalharServico}
                  />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-10">
                  <p className="text-muted-foreground mb-2">Nenhum serviço pendente.</p>
                  <p className="text-sm text-muted-foreground">Todos os serviços já foram analisados.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="aprovado" className="space-y-4">
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
              </div>
            ) : servicosOrdenados.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {servicosOrdenados.map((servico) => (
                  <ServicoPrestadoCard
                    key={servico.id}
                    servico={servico}
                    onAprovar={handleAprovarServico}
                    onRejeitar={handleRejeitarServico}
                    onDetalhar={handleDetalharServico}
                  />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-10">
                  <p className="text-muted-foreground mb-2">Nenhum serviço aprovado.</p>
                  <p className="text-sm text-muted-foreground">Não há serviços aprovados no momento.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="rejeitado" className="space-y-4">
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
              </div>
            ) : servicosOrdenados.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {servicosOrdenados.map((servico) => (
                  <ServicoPrestadoCard
                    key={servico.id}
                    servico={servico}
                    onAprovar={handleAprovarServico}
                    onRejeitar={handleRejeitarServico}
                    onDetalhar={handleDetalharServico}
                  />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-10">
                  <p className="text-muted-foreground mb-2">Nenhum serviço rejeitado.</p>
                  <p className="text-sm text-muted-foreground">Não há serviços rejeitados no momento.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}