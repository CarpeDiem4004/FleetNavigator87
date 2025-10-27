import { Link, useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Home, CreditCard, AlertTriangle, XCircle } from "lucide-react";
import { useEffect, useState } from "react";

interface LocationState {
  successCount?: number;
  errorCount?: number;
  total?: number;
  errorDetails?: string[];
  data_uso?: string;
}

export default function FuelCardConfirmation() {
  const [location] = useLocation();
  const [confirmationData, setConfirmationData] = useState<LocationState>({});

  useEffect(() => {
    // Recuperar dados do sessionStorage (passados pelo draft.tsx)
    const storedData = sessionStorage.getItem('fuelCardConfirmation');
    if (storedData) {
      try {
        const parsed = JSON.parse(storedData);
        setConfirmationData(parsed);
        // Limpar dados após leitura
        sessionStorage.removeItem('fuelCardConfirmation');
      } catch (error) {
        console.error('Erro ao parsear dados de confirmação:', error);
      }
    }
  }, []);

  const { successCount, errorCount, total, errorDetails, data_uso } = confirmationData;

  // Determinar se é envio em lote ou individual
  const isBatchSend = total !== undefined && total > 1;
  const hasErrors = errorCount !== undefined && errorCount > 0;
  
  // Formatar data de uso para exibição (DD/MM/YYYY)
  const formatDataUso = (dataStr?: string): string => {
    if (!dataStr) return '';
    try {
      const [year, month, day] = dataStr.split('-');
      return `${day}/${month}/${year}`;
    } catch {
      return dataStr;
    }
  };

  return (
    <div className="container mx-auto py-12">
      <div className="max-w-md mx-auto">
        <Card className={hasErrors ? "border-yellow-100 shadow-md" : "border-green-100 shadow-md"}>
          <CardHeader className="text-center pb-4">
            <div className="flex justify-center mb-4">
              <div className={`rounded-full ${hasErrors ? 'bg-yellow-100' : 'bg-green-100'} p-3`}>
                {hasErrors ? (
                  <AlertTriangle className="h-12 w-12 text-yellow-600" />
                ) : (
                  <CheckCircle2 className="h-12 w-12 text-green-600" />
                )}
              </div>
            </div>
            <CardTitle className="text-2xl">
              {isBatchSend ? "Envio em Lote Concluído" : "Solicitação Enviada"}
            </CardTitle>
            <CardDescription>
              {isBatchSend ? (
                hasErrors ? (
                  `${successCount} de ${total} solicitações enviadas com sucesso`
                ) : (
                  `Todas as ${successCount} solicitações foram registradas com sucesso`
                )
              ) : (
                "Sua solicitação de cartão combustível foi registrada com sucesso"
              )}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="text-center">
            {/* Estatísticas de envio em lote */}
            {isBatchSend && (
              <div className="mb-4 space-y-2">
                <div className="flex justify-center gap-4">
                  <Badge variant="default" className="bg-green-600 text-white">
                    ✓ {successCount} Enviadas
                  </Badge>
                  {hasErrors && (
                    <Badge variant="destructive">
                      ✗ {errorCount} Erros
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {/* Lista de erros (se houver) */}
            {hasErrors && errorDetails && errorDetails.length > 0 && (
              <Alert variant="destructive" className="mb-4 text-left">
                <XCircle className="h-4 w-4" />
                <AlertTitle>Placas com erro no envio:</AlertTitle>
                <AlertDescription>
                  <ul className="list-disc list-inside mt-2 text-sm space-y-1">
                    {errorDetails.map((error, index) => (
                      <li key={index} className="text-red-700">{error}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {/* Data de Solicitação do Uso do Saldo */}
            {data_uso && (
              <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg mb-4 border border-blue-200 dark:border-blue-800">
                <div className="flex items-center justify-center gap-2">
                  <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                    📅 Data de Solicitação do Uso do Saldo:
                  </span>
                  <span className="text-lg font-bold text-blue-700 dark:text-blue-300">
                    {formatDataUso(data_uso)}
                  </span>
                </div>
              </div>
            )}

            <p className="text-muted-foreground mb-4">
              {isBatchSend && successCount && successCount > 0 ? (
                `Suas ${successCount} solicitação(ões) foram encaminhadas para análise.`
              ) : (
                "Sua solicitação foi encaminhada para análise."
              )}
              {" "}Você será notificado quando ela{successCount && successCount > 1 ? 's' : ''} for{successCount && successCount > 1 ? 'em' : ''} processada{successCount && successCount > 1 ? 's' : ''}.
            </p>
            
            <div className="bg-muted p-4 rounded-md mb-4">
              <h3 className="font-medium text-sm text-muted-foreground mb-2">O que acontece agora?</h3>
              <ul className="text-sm text-left space-y-2">
                <li className="flex items-start">
                  <span className="bg-primary/10 text-primary rounded-full h-5 w-5 flex items-center justify-center text-xs mr-2 mt-0.5">1</span>
                  <span>Um operador irá analisar sua{successCount && successCount > 1 ? 's' : ''} solicitação{successCount && successCount > 1 ? 'ões' : ''}</span>
                </li>
                <li className="flex items-start">
                  <span className="bg-primary/10 text-primary rounded-full h-5 w-5 flex items-center justify-center text-xs mr-2 mt-0.5">2</span>
                  <span>Após aprovada{successCount && successCount > 1 ? 's' : ''}, o{successCount && successCount > 1 ? 's' : ''} cartão{successCount && successCount > 1 ? 'ões' : ''} será{successCount && successCount > 1 ? 'ão' : ''} atribuído{successCount && successCount > 1 ? 's' : ''} ao{successCount && successCount > 1 ? 's' : ''} veículo{successCount && successCount > 1 ? 's' : ''}</span>
                </li>
                <li className="flex items-start">
                  <span className="bg-primary/10 text-primary rounded-full h-5 w-5 flex items-center justify-center text-xs mr-2 mt-0.5">3</span>
                  <span>Você será notificado quando o{successCount && successCount > 1 ? 's' : ''} cartão{successCount && successCount > 1 ? 'ões' : ''} estiver{successCount && successCount > 1 ? 'em' : ''} disponível{successCount && successCount > 1 ? 'is' : ''}</span>
                </li>
              </ul>
            </div>
          </CardContent>
          
          <CardFooter className="flex justify-center">
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