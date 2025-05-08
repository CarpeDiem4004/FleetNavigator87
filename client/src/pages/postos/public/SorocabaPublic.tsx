import React, { useEffect } from 'react';
import PublicPostoPage from '../PublicPostoPage';
import { POSTO_SOROCABA, NOME_POSTO_SOROCABA } from '@/constants/postos';
import { useLocation } from 'wouter';

/**
 * POSTO DESATIVADO - MAIO/2025
 * Este posto foi removido do sistema a pedido do cliente.
 * A página está mantida apenas para compatibilidade com código existente.
 */
const SorocabaPublic: React.FC = () => {
  // Usar redirecionamento hook do wouter
  const [location, setLocation] = useLocation();
  
  useEffect(() => {
    // Redirecionar para a home
    setLocation('/');
  }, [setLocation]);
  
  // Retorna null enquanto o redirecionamento acontece
  return null;
  // O código abaixo estava usando o componente original
  // return <PublicPostoPage id={POSTO_SOROCABA} nomePosto={NOME_POSTO_SOROCABA} />;
};

export default SorocabaPublic;