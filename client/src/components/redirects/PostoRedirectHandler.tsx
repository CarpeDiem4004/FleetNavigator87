import React, { useEffect, useState } from 'react';
import { useLocation, useParams } from 'wouter';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type PostoParams = {
  postoCode: string;
};

// Componente para lidar com o redirecionamento para a página de login do posto específico
const PostoRedirectHandler: React.FC = () => {
  const [location, navigate] = useLocation();
  const params = useParams<PostoParams>();
  const { toast } = useToast();
  const [isRedirecting, setIsRedirecting] = useState(true);
  
  useEffect(() => {
    if (params.postoCode) {
      console.log(`Redirecionando para a página de login do posto: ${params.postoCode}`);
      
      // Validação básica do código do posto (apenas verifica se é uma string não vazia)
      if (!params.postoCode.trim()) {
        toast({
          title: "Código de posto inválido",
          description: "O código do posto fornecido é inválido.",
          variant: "destructive"
        });
        navigate('/');
        return;
      }
      
      // Redireciona para a página de login do posto específico
      const redirectTimer = setTimeout(() => {
        navigate(`/posto/${params.postoCode}`);
      }, 500);
      
      return () => clearTimeout(redirectTimer);
    } else {
      setIsRedirecting(false);
      toast({
        title: "Erro de redirecionamento",
        description: "Parâmetros de redirecionamento inválidos.",
        variant: "destructive"
      });
      navigate('/');
    }
  }, [params.postoCode, navigate, toast, location]);
  
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-background to-accent/10">
      <div className="bg-white p-8 rounded-lg shadow-lg text-center space-y-4 w-full max-w-md">
        <Loader2 className="w-12 h-12 mx-auto animate-spin text-primary" />
        <h2 className="text-2xl font-bold text-gray-800">Redirecionando...</h2>
        <p className="text-gray-600">
          {isRedirecting 
            ? `Redirecionando para a página de login do posto ${params.postoCode?.toUpperCase()}` 
            : "Aguarde um momento..."}
        </p>
      </div>
    </div>
  );
};

export default PostoRedirectHandler;