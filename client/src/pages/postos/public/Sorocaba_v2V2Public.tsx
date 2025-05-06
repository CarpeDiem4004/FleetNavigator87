/**
 * Página pública de redirecionamento para o Posto Sorocaba V2
 * Este posto foi removido em Maio/2025 e redireciona para o Posto Remédios
 */

import React, { useEffect } from 'react';
import { useLocation } from 'wouter';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { InfoIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Sorocaba_v2V2Public: React.FC = () => {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  useEffect(() => {
    toast({
      title: "Posto desativado",
      description: "Este posto foi removido. Redirecionando para o acesso público do Posto Remédios...",
      variant: "default",
    });
    
    // Redirecionar após um pequeno atraso para permitir que o toast seja exibido
    const timer = setTimeout(() => {
      setLocation('/posto-remedios/public');
    }, 3000);
    
    return () => clearTimeout(timer);
  }, [setLocation, toast]);
  
  return (
    <div className="container mx-auto py-6 max-w-md">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl text-center">Posto Sorocaba V2 Desativado</CardTitle>
          <CardDescription className="text-center">
            Este posto não está mais disponível
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="warning" className="mb-4">
            <InfoIcon className="h-5 w-5 mr-2" />
            <AlertTitle>Posto desativado</AlertTitle>
            <AlertDescription>
              O Posto Sorocaba V2 foi desativado em Maio/2025. 
              Você será redirecionado para o acesso público do Posto Remédios automaticamente.
            </AlertDescription>
          </Alert>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button 
            onClick={() => setLocation('/posto-remedios/public')}
            className="w-full"
          >
            Ir para o Posto Remédios agora
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Sorocaba_v2V2Public;
