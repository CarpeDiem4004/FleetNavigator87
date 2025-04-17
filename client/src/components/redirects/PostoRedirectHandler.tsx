import React, { useEffect, useState } from 'react';
import { useParams, useLocation } from 'wouter';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ErrorPage from '@/pages/ErrorPage';

// Mapeamento de códigos para nomes dos postos
const postoNomes: Record<string, string> = {
  osasco: 'Osasco',
  guarulhos: 'Guarulhos',
  saopaulo: 'São Paulo',
  campinas: 'Campinas',
  abc: 'ABC',
  socorro: 'Socorro',
  sorocaba: 'Sorocaba'
};

type PostoParams = {
  postoCode: string;
};

const PostoRedirectHandler: React.FC = () => {
  const [, setLocation] = useLocation();
  const params = useParams<PostoParams>();
  const postoCode = params.postoCode?.toLowerCase() || '';
  const postoNome = postoNomes[postoCode] || postoCode.toUpperCase();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connectionError, setConnectionError] = useState(false);
  
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    const redirectToPosto = () => {
      try {
        if (!postoCode) {
          setError('Código do posto não especificado na URL.');
          setLoading(false);
          return;
        }
        
        if (!Object.keys(postoNomes).includes(postoCode)) {
          setError(`Posto "${postoCode}" não encontrado.`);
          setLoading(false);
          return;
        }
        
        // Realizar verificação básica de conexão antes de redirecionar
        fetch('/api/user')
          .then(response => {
            console.log(`Redirecionando para /posto/${postoCode}`);
            setLocation(`/posto/${postoCode}`);
          })
          .catch(err => {
            console.error('Erro de conexão ao verificar API:', err);
            setConnectionError(true);
            setLoading(false);
          });
        
      } catch (err) {
        console.error('Erro ao redirecionar:', err);
        setError('Ocorreu um erro ao redirecionar. Tente novamente.');
        setLoading(false);
      }
    };
    
    // Atraso pequeno para permitir que a interface seja renderizada
    timeoutId = setTimeout(redirectToPosto, 1000);
    
    // Limite de tempo para exibir um erro caso o redirecionamento não funcione
    const errorTimeoutId = setTimeout(() => {
      setLoading(false);
      setError('Tempo esgotado ao redirecionar. Clique no botão abaixo para tentar novamente.');
    }, 10000);
    
    return () => {
      clearTimeout(timeoutId);
      clearTimeout(errorTimeoutId);
    };
  }, [postoCode, setLocation]);
  
  const handleRedirectClick = () => {
    setLocation(`/posto/${postoCode}`);
  };
  
  // Se houver erro de conexão, exibir página de erro
  if (connectionError) {
    return (
      <ErrorPage 
        title="Erro de Conexão" 
        message="Não foi possível conectar ao servidor da aplicação. Verifique sua conexão e tente novamente."
        code="ERR_CONNECTION_REFUSED"
      />
    );
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center justify-center p-6">
          <h1 className="text-2xl font-bold mb-4 text-center">
            {loading ? 'Redirecionando...' : (error ? 'Erro' : `Posto ${postoNome}`)}
          </h1>
          
          {loading ? (
            <div className="flex flex-col items-center">
              <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">
                Você está sendo redirecionado para o sistema do posto {postoNome}
              </p>
            </div>
          ) : error ? (
            <div className="text-center">
              <div className="bg-red-50 text-red-600 p-4 rounded-md mb-4">
                {error}
              </div>
              <Button onClick={handleRedirectClick}>
                Tentar Novamente
              </Button>
            </div>
          ) : null}
          
          <div className="mt-6 text-center text-sm text-gray-500">
            <p>Se o redirecionamento não funcionar, <a href={`/posto/${postoCode}`} className="text-primary hover:underline">clique aqui</a>.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PostoRedirectHandler;