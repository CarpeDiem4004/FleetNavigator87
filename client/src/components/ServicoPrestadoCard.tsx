import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Truck, MapPin, Calendar, DollarSign, FileText, CheckCircle, XCircle, ExternalLink } from "lucide-react";
import { formatDateShortBrasilia } from "@/lib/date-utils";

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

const ServicoPrestadoCard: React.FC<ServicoPrestadoCardProps> = ({ 
  servico, 
  onAprovar, 
  onRejeitar, 
  onDetalhar 
}) => {
  const formattedDate = formatDateShortBrasilia(new Date(servico.data_servico));
  const formattedValue = servico.valor.toLocaleString('pt-BR', { 
    style: 'currency', 
    currency: 'BRL' 
  });

  // Cores diferentes para os diferentes status
  const getStatusBadge = () => {
    if (servico.status === "aprovado") {
      return <Badge className="bg-green-500">Aprovado</Badge>;
    } else if (servico.status === "rejeitado") {
      return <Badge className="bg-red-500">Rejeitado</Badge>;
    } else {
      return <Badge className="bg-yellow-500">Pendente</Badge>;
    }
  };

  return (
    <Card className="overflow-hidden border border-gray-200 shadow-sm">
      <CardHeader className="bg-primary/5 pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">
            {servico.parceiro.nome}
          </CardTitle>
          {getStatusBadge()}
        </div>
        <div className="flex items-center text-sm text-muted-foreground">
          <MapPin size={16} className="mr-1" />
          {servico.parceiro.cidade}, {servico.parceiro.estado}
        </div>
      </CardHeader>
      
      <CardContent className="pt-4">
        <div className="grid gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Truck size={18} className="mr-2 text-primary" />
              <span className="font-medium">Veículo:</span>
            </div>
            <span>{servico.veiculo} ({servico.placa})</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <FileText size={18} className="mr-2 text-primary" />
              <span className="font-medium">Serviço:</span>
            </div>
            <span>{servico.tipo_servico}</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Calendar size={18} className="mr-2 text-primary" />
              <span className="font-medium">Data:</span>
            </div>
            <span>{formattedDate}</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <DollarSign size={18} className="mr-2 text-primary" />
              <span className="font-medium">Valor:</span>
            </div>
            <span className="font-semibold text-primary">{formattedValue}</span>
          </div>
          
          {servico.local_atendimento && (
            <div className="mt-1">
              <div className="flex items-center">
                <MapPin size={18} className="mr-2 text-primary" />
                <span className="font-medium">Local de atendimento:</span>
              </div>
              <p className="text-sm text-muted-foreground ml-6 mt-1">
                {servico.local_atendimento}
              </p>
            </div>
          )}
          
          {servico.km_reboque && (
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Truck size={18} className="mr-2 text-primary" />
                <span className="font-medium">KM rebocado:</span>
              </div>
              <span>{servico.km_reboque} km</span>
            </div>
          )}
          
          {servico.observacoes && (
            <div className="mt-2">
              <Separator className="my-2" />
              <div className="text-sm">
                <p className="font-medium mb-1">Observações:</p>
                <p className="text-muted-foreground">{servico.observacoes}</p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-between bg-muted/10 pt-4">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => onDetalhar(servico.id)}
          className="gap-1"
        >
          <ExternalLink size={16} />
          Detalhes
        </Button>
        
        <div className="flex gap-2">
          {servico.status === "pendente" && (
            <>
              <Button 
                variant="destructive" 
                size="sm" 
                onClick={() => onRejeitar(servico.id)}
                className="gap-1"
              >
                <XCircle size={16} />
                Rejeitar
              </Button>
              <Button 
                variant="default" 
                size="sm" 
                onClick={() => onAprovar(servico.id)}
                className="gap-1"
              >
                <CheckCircle size={16} />
                Aprovar
              </Button>
            </>
          )}
        </div>
      </CardFooter>
    </Card>
  );
};

export default ServicoPrestadoCard;