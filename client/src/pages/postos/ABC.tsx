import React, { useEffect } from 'react';
import { useLocation } from 'wouter';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { POSTO_OSASCO_V2, NOME_POSTO_OSASCO_V2 } from '@/constants/postos';

/**
 * Página de redirecionamento para o posto ABC (removido)
 * Esta página foi mantida para compatibilidade com links antigos
 * Redireciona para a página do posto Osasco V2
 */
const PostoABC: React.FC = () => {
  const [, setLocation] = useLocation();
  
  useEffect(() => {
    // Redirecionar após 5 segundos
    const timer = setTimeout(() => {
      setLocation(`/posto/${POSTO_OSASCO_V2}`);
    }, 5000);
    
    return () => clearTimeout(timer);
  }, [setLocation]);
  
  return (
    <div className="container mx-auto mt-10 p-6">
      <Alert variant="destructive" className="mb-6">
        <AlertTitle className="text-xl font-bold">Posto ABC foi removido do sistema</AlertTitle>
        <AlertDescription className="text-base mt-2">
          O posto ABC foi removido em Maio/2025 e não está mais disponível.
          Você será redirecionado para o posto Osasco V2 em 5 segundos.
        </AlertDescription>
      </Alert>
      
      <div className="flex justify-center mt-6">
        <Button 
          onClick={() => setLocation(`/posto/${POSTO_OSASCO_V2}`)}
          size="lg"
          className="mr-4"
        >
          Ir para o posto {NOME_POSTO_OSASCO_V2}
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

export default PostoABC;