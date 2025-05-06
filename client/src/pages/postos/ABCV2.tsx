import React, { useEffect } from 'react';
import { useLocation } from 'wouter';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { POSTO_ABC, NOME_POSTO_ABC } from '@/constants/postos';

/**
 * Página de redirecionamento para o posto ABC_V2 (removido)
 * Esta página foi mantida para compatibilidade com links antigos
 * Redireciona para a página do posto ABC
 */
const PostoABCV2: React.FC = () => {
  const [, setLocation] = useLocation();
  
  useEffect(() => {
    // Redirecionar após 5 segundos
    const timer = setTimeout(() => {
      setLocation(`/posto/${POSTO_ABC}`);
    }, 5000);
    
    return () => clearTimeout(timer);
  }, [setLocation]);
  
  return (
    <div className="container mx-auto mt-10 p-6">
      <Alert variant="destructive" className="mb-6">
        <AlertTitle className="text-xl font-bold">Posto ABC V2 foi removido do sistema</AlertTitle>
        <AlertDescription className="text-base mt-2">
          O posto ABC V2 foi removido em Maio/2025 e não está mais disponível.
          Você será redirecionado para o posto ABC em 5 segundos.
        </AlertDescription>
      </Alert>
      
      <div className="flex justify-center mt-6">
        <Button 
          onClick={() => setLocation(`/posto/${POSTO_ABC}`)}
          size="lg"
          className="mr-4"
        >
          Ir para o posto {NOME_POSTO_ABC}
        </Button>
        
        <Button 
          onClick={() => setLocation('/postos')}
          variant="outline"
          size="lg"
        >
          Ver todos os postos
        </Button>
      </div>
    </div>
  );
};

export default PostoABCV2;