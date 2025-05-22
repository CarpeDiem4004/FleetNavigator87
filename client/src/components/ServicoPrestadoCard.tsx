import { useState } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, Clock, AlertCircle, TruckIcon, FileText, Calendar, MapPin, DollarSign } from "lucide-react";

// Tipo para os serviços prestados
interface ServicoPrestado {
  id: number;
  parceiro: {
    id: number;
    nome: string;
    cidade: string;
    estado: string;
    avaliacao: number;
  };
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

interface ServicoPrestadoCardProps {
  servico: ServicoPrestado;
  onAprovar: (id: number) => void;
  onRejeitar: (id: number) => void;
  onDetalhar: (id: number) => void;
}

const formatarValor = (valor: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(valor);
};

const formatarData = (data: string) => {
  const dataObj = new Date(data);
  return dataObj.toLocaleDateString('pt-BR');
};

const ServicoPrestadoCard: React.FC<ServicoPrestadoCardProps> = ({
  servico,
  onAprovar,
  onRejeitar,
  onDetalhar
}) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleAprovar = async () => {
    setIsLoading(true);
    try {
      await onAprovar(servico.id);
      toast({
        title: "Serviço aprovado",
        description: `O serviço do parceiro ${servico.parceiro.nome} foi aprovado com sucesso.`,
        variant: "default",
        className: "bg-green-50 border-green-200",
      });
    } catch (error) {
      toast({
        title: "Erro ao aprovar",
        description: "Ocorreu um erro ao aprovar este serviço.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRejeitar = async () => {
    setIsLoading(true);
    try {
      await onRejeitar(servico.id);
      toast({
        title: "Serviço rejeitado",
        description: `O serviço do parceiro ${servico.parceiro.nome} foi rejeitado.`,
        variant: "default",
      });
    } catch (error) {
      toast({
        title: "Erro ao rejeitar",
        description: "Ocorreu um erro ao rejeitar este serviço.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = () => {
    switch (servico.status) {
      case "aprovado":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-800 border-green-300">
            <CheckCircle className="w-3 h-3 mr-1" /> Aprovado
          </Badge>
        );
      case "rejeitado":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-800 border-red-300">
            <AlertCircle className="w-3 h-3 mr-1" /> Rejeitado
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-800 border-yellow-300">
            <Clock className="w-3 h-3 mr-1" /> Pendente
          </Badge>
        );
    }
  };

  return (
    <Card className="border shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="pb-2 flex flex-row justify-between items-center">
        <div>
          <CardTitle className="text-lg font-semibold flex items-center">
            <TruckIcon className="w-5 h-5 mr-2 text-blue-600" />
            {servico.placa} - {servico.veiculo}
          </CardTitle>
          <div className="text-sm text-muted-foreground mt-1 flex items-center">
            <Calendar className="w-3.5 h-3.5 mr-1 opacity-70" />
            {formatarData(servico.data_servico)}
            <span className="mx-2">•</span>
            <FileText className="w-3.5 h-3.5 mr-1 opacity-70" />
            {servico.tipo_servico}
          </div>
        </div>
        {getStatusBadge()}
      </CardHeader>

      <CardContent className="py-3">
        <Tabs defaultValue="detalhes" className="w-full">
          <TabsList className="w-full mb-2">
            <TabsTrigger value="detalhes" className="flex-1">Detalhes</TabsTrigger>
            <TabsTrigger value="parceiro" className="flex-1">Parceiro</TabsTrigger>
          </TabsList>
          
          <TabsContent value="detalhes" className="space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="flex items-center text-muted-foreground">
                <MapPin className="w-3.5 h-3.5 mr-1.5 opacity-70" />
                Local:
              </span>
              <span className="font-medium">{servico.local_atendimento || "Não informado"}</span>
            </div>
            
            {servico.km_reboque && (
              <div className="flex justify-between items-center text-sm">
                <span className="flex items-center text-muted-foreground">
                  <TruckIcon className="w-3.5 h-3.5 mr-1.5 opacity-70" />
                  Distância:
                </span>
                <span className="font-medium">{servico.km_reboque} km</span>
              </div>
            )}
            
            <div className="flex justify-between items-center text-sm">
              <span className="flex items-center text-muted-foreground">
                <DollarSign className="w-3.5 h-3.5 mr-1.5 opacity-70" />
                Valor:
              </span>
              <span className="font-medium text-green-700">{formatarValor(servico.valor)}</span>
            </div>
            
            {servico.observacoes && (
              <div className="mt-3 pt-3 border-t text-sm">
                <p className="text-muted-foreground mb-1">Observações:</p>
                <p className="text-sm">{servico.observacoes}</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="parceiro" className="space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="flex items-center text-muted-foreground">Prestador:</span>
              <span className="font-medium">{servico.parceiro.nome}</span>
            </div>
            
            <div className="flex justify-between items-center text-sm">
              <span className="flex items-center text-muted-foreground">Localização:</span>
              <span className="font-medium">{servico.parceiro.cidade}, {servico.parceiro.estado}</span>
            </div>
            
            <div className="flex justify-between items-center text-sm">
              <span className="flex items-center text-muted-foreground">Avaliação:</span>
              <div className="flex items-center">
                {Array.from({ length: 5 }).map((_, i) => (
                  <svg 
                    key={i}
                    className={`w-4 h-4 ${i < servico.parceiro.avaliacao ? "text-yellow-400" : "text-gray-300"}`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
                <span className="ml-1 text-sm font-medium">{servico.parceiro.avaliacao.toFixed(1)}</span>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>

      <CardFooter className="pt-2 pb-3 border-t flex justify-between">
        {servico.status === "pendente" ? (
          <>
            <Button 
              variant="outline" 
              size="sm"
              className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700" 
              onClick={handleRejeitar}
              disabled={isLoading}
            >
              Rejeitar
            </Button>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => onDetalhar(servico.id)}
                disabled={isLoading}
              >
                Detalhes
              </Button>
              <Button 
                variant="default" 
                size="sm"
                className="bg-green-600 hover:bg-green-700"
                onClick={handleAprovar}
                disabled={isLoading}
              >
                Aprovar
              </Button>
            </div>
          </>
        ) : (
          <Button 
            variant="outline" 
            size="sm"
            className="w-full"
            onClick={() => onDetalhar(servico.id)}
          >
            Ver Detalhes
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default ServicoPrestadoCard;