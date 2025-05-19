import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Home, CreditCard } from "lucide-react";

export default function FuelCardConfirmation() {
  return (
    <div className="container mx-auto py-12">
      <div className="max-w-md mx-auto">
        <Card className="border-green-100 shadow-md">
          <CardHeader className="text-center pb-4">
            <div className="flex justify-center mb-4">
              <div className="rounded-full bg-green-100 p-3">
                <CheckCircle2 className="h-12 w-12 text-green-600" />
              </div>
            </div>
            <CardTitle className="text-2xl">Solicitação Enviada</CardTitle>
            <CardDescription>
              Sua solicitação de cartão combustível foi registrada com sucesso
            </CardDescription>
          </CardHeader>
          
          <CardContent className="text-center">
            <p className="text-muted-foreground mb-4">
              Sua solicitação foi encaminhada para análise. Você será notificado quando ela for processada.
            </p>
            
            <div className="bg-muted p-4 rounded-md mb-4">
              <h3 className="font-medium text-sm text-muted-foreground mb-2">O que acontece agora?</h3>
              <ul className="text-sm text-left space-y-2">
                <li className="flex items-start">
                  <span className="bg-primary/10 text-primary rounded-full h-5 w-5 flex items-center justify-center text-xs mr-2 mt-0.5">1</span>
                  <span>Um operador irá analisar sua solicitação</span>
                </li>
                <li className="flex items-start">
                  <span className="bg-primary/10 text-primary rounded-full h-5 w-5 flex items-center justify-center text-xs mr-2 mt-0.5">2</span>
                  <span>Após aprovada, o cartão será atribuído ao veículo</span>
                </li>
                <li className="flex items-start">
                  <span className="bg-primary/10 text-primary rounded-full h-5 w-5 flex items-center justify-center text-xs mr-2 mt-0.5">3</span>
                  <span>Você será notificado quando o cartão estiver disponível</span>
                </li>
              </ul>
            </div>
          </CardContent>
          
          <CardFooter className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild variant="outline">
              <Link href="/">
                <Home className="mr-2 h-4 w-4" />
                Ir para o Início
              </Link>
            </Button>
            <Button asChild>
              <Link href="/fuel-card/solicitation">
                <CreditCard className="mr-2 h-4 w-4" />
                Nova Solicitação
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}