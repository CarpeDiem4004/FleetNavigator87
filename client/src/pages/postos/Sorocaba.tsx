import React, { useEffect } from 'react';
import PostoPage from './PostoPage';
import { POSTO_SOROCABA, NOME_POSTO_SOROCABA } from '@/constants/postos';
import { useLocation } from 'wouter';

/**
 * POSTO DESATIVADO - MAIO/2025
 * Este posto foi removido do sistema a pedido do cliente.
 * A página está mantida apenas para compatibilidade com código existente.
 */
const PostoSorocaba: React.FC = () => {
  // Usar redirecionamento hook do wouter
  const [location, setLocation] = useLocation();
  
  useEffect(() => {
    // Redirecionar para a home
    setLocation('/');
  }, [setLocation]);
  
  return null;
  // return <PostoPage id={POSTO_SOROCABA} nomePosto={NOME_POSTO_SOROCABA} />;
};

export default PostoSorocaba;