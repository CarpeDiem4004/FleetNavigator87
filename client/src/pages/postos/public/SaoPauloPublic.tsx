import React, { useEffect } from 'react';
import { useLocation } from 'wouter';

// Redirecionamento para a página inicial, já que o posto São Paulo foi removido
const SaoPauloPublic: React.FC = () => {
  const [, setLocation] = useLocation();
  
  useEffect(() => {
    setLocation("/");
  }, [setLocation]);
  
  return <div className="text-center p-4">Redirecionando...</div>;
};

export default SaoPauloPublic;