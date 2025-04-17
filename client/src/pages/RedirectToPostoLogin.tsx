import React, { useEffect } from 'react';
import { Route, useLocation, useParams } from 'wouter';
import { Loader2 } from 'lucide-react';

type RedirectParams = {
  postoCode: string;
};

const RedirectToPostoLogin: React.FC = () => {
  const [location, navigate] = useLocation();
  const params = useParams<RedirectParams>();
  const postoCode = params.postoCode;

  useEffect(() => {
    if (postoCode) {
      console.log(`Redirecionando de ${location} para /posto/${postoCode}`);
      
      // Pequeno atraso para garantir que o redirecionamento ocorra
      const redirectTimer = setTimeout(() => {
        navigate(`/posto/${postoCode}`);
      }, 100);
      
      return () => clearTimeout(redirectTimer);
    }
  }, [postoCode, location, navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center space-y-4">
        <Loader2 className="w-12 h-12 mx-auto animate-spin text-primary" />
        <p className="text-lg">Redirecionando para a página de login do posto...</p>
      </div>
    </div>
  );
};

export default RedirectToPostoLogin;