import React, { useEffect } from 'react';
import { useLocation } from 'wouter';

// Redirecionamento para a página de visão geral, já que o posto São Paulo foi removido
const PostoSaoPaulo: React.FC = () => {
  const [, setLocation] = useLocation();
  
  useEffect(() => {
    setLocation("/postos/visao-geral");
  }, [setLocation]);
  
  return <div className="text-center p-4">Redirecionando...</div>;
};

export default PostoSaoPaulo;