import React, { useRef, useCallback } from 'react';
import { StatusTanquePosto, StatusTanqueRef } from './StatusTanquePosto';

interface StatusTanqueWrapperProps {
  postId: string;
  refreshTrigger?: number;
}

/**
 * Componente wrapper para o componente de status de tanque
 * Utilizamos este wrapper para facilitar a troca entre implementações do componente
 * sem precisar alterar todos os lugares onde ele é usado.
 * 
 * Este componente também gerencia a atualização do status quando há um novo abastecimento.
 */
export const StatusTanqueWrapper: React.FC<StatusTanqueWrapperProps> = ({ postId, refreshTrigger }) => {
  // Referência para o componente StatusTanquePosto
  const statusTanqueRef = useRef<StatusTanqueRef>(null);
  
  // Função para atualizar o status do tanque
  const handleRefreshComplete = useCallback(() => {
    console.log('Status do tanque atualizado com sucesso após abastecimento');
  }, []);

  // Efeito para atualizar o status quando refreshTrigger mudar
  React.useEffect(() => {
    if (refreshTrigger && statusTanqueRef.current) {
      console.log('Atualizando status do tanque devido a um novo abastecimento');
      statusTanqueRef.current.refreshData();
    }
  }, [refreshTrigger]);

  return (
    <StatusTanquePosto 
      ref={statusTanqueRef} 
      postId={postId} 
      onRefreshComplete={handleRefreshComplete} 
    />
  );
};