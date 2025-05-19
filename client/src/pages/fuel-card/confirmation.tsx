import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";
import { useLocation } from "wouter";

export default function FuelCardConfirmation() {
  const navigate = useNavigate();
  
  return (
    <div className="container mx-auto py-12 flex items-center justify-center min-h-[calc(100vh-200px)]">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle2 className="h-16 w-16 text-green-500" />
          </div>
          <CardTitle className="text-2xl">Solicitação Enviada!</CardTitle>
          <CardDescription>
            Sua solicitação de cartão combustível foi enviada com sucesso
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center text-muted-foreground">
          <p>Um operador irá analisar sua solicitação em breve.</p>
          <p className="mt-2">Você receberá uma notificação quando sua solicitação for processada.</p>
        </CardContent>
        <CardFooter className="flex justify-center gap-4">
          <Button 
            variant="outline" 
            onClick={() => navigate("/fuel-card/solicitation")}
          >
            Nova Solicitação
          </Button>
          <Button 
            onClick={() => navigate("/")}
          >
            Voltar ao Início
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}