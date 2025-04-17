import React, { useEffect, useState } from 'react';
import { useParams } from 'wouter';
import { Loader2 } from 'lucide-react';

type PostoParams = {
  postoCode: string;
};

const PostoRedirectHandler: React.FC = () => {
  const params = useParams<PostoParams>();
  const postoCode = params.postoCode?.toLowerCase() || '';
  const [redirectStatus, setRedirectStatus] = useState<'pending' | 'failed' | 'complete'>('pending');
  const [count, setCount] = useState(3);
  
  useEffect(() => {
    if (!postoCode) {
      setRedirectStatus('failed');
      return;
    }
    
    console.log(`Preparando redirecionamento para página do posto ${postoCode}...`);
    
    // Usar setTimeout para garantir que o redirecionamento aconteça após renderização
    const timer = setTimeout(() => {
      try {
        console.log(`Redirecionando para página estática do posto ${postoCode}...`);
        
        // Criar URL com base no domínio atual
        const protocol = window.location.protocol;
        const host = window.location.host;
        const postoUrl = `${protocol}//${host}/posto/${postoCode}.html`;
        
        // Redirecionar usando window.location
        window.location.href = postoUrl;
        setRedirectStatus('complete');
      } catch (error) {
        console.error("Erro ao redirecionar:", error);
        setRedirectStatus('failed');
      }
    }, 1000);
    
    // Countdown timer
    const countdown = setInterval(() => {
      setCount(c => {
        if (c <= 1) {
          clearInterval(countdown);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    
    return () => {
      clearTimeout(timer);
      clearInterval(countdown);
    };
  }, [postoCode]);
  
  if (redirectStatus === 'failed') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center p-8 bg-red-50 border border-red-200 rounded-lg max-w-md">
          <h2 className="text-xl font-bold text-red-700 mb-2">Erro de Redirecionamento</h2>
          <p className="text-gray-700 mb-4">
            Não foi possível redirecionar para a página do posto {postoCode}.
          </p>
          <p className="text-sm text-gray-600">
            Tente acessar diretamente: <br />
            <code className="bg-gray-100 p-1 rounded">/posto/{postoCode}.html</code>
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center p-8 bg-blue-50 border border-blue-200 rounded-lg max-w-md">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
        <h2 className="text-xl font-bold text-blue-700 mb-2">Redirecionando</h2>
        <p className="text-gray-700 mb-2">
          Acessando página do posto {postoCode.toUpperCase()}...
        </p>
        <p className="text-sm text-gray-500">
          Aguarde {count} segundos ou clique <a 
            href={`/posto/${postoCode}.html`} 
            className="text-blue-600 hover:underline"
          >aqui</a> para continuar.
        </p>
      </div>
    </div>
  );
};

export default PostoRedirectHandler;