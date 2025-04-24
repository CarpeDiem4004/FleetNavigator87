import React from 'react';
import { StatusTanquePosto } from './StatusTanquePosto';

interface StatusTanqueWrapperProps {
  postId: string;
}

/**
 * Componente wrapper para o componente de status de tanque
 * Utilizamos este wrapper para facilitar a troca entre implementações do componente
 * sem precisar alterar todos os lugares onde ele é usado.
 */
export const StatusTanqueWrapper: React.FC<StatusTanqueWrapperProps> = ({ postId }) => {
  return <StatusTanquePosto postId={postId} />;
};