import React from 'react';
import { StatusTanquePostoNew } from './StatusTanquePostoNew';

interface StatusTanqueWrapperProps {
  postId: string;
}

/**
 * Componente wrapper para o componente de status de tanque
 * Utilizamos este wrapper para facilitar a troca entre implementações do componente
 * sem precisar alterar todos os lugares onde ele é usado.
 */
export const StatusTanqueWrapper: React.FC<StatusTanqueWrapperProps> = ({ postId }) => {
  return <StatusTanquePostoNew postId={postId} />;
};