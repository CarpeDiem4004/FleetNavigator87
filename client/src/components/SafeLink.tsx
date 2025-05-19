import React from 'react';
import { Link as WouterLink } from 'wouter';

/**
 * Componente SafeLink que normaliza URLs para evitar barras duplicadas
 * Envolve o componente Link do wouter com lógica de normalização
 */
interface SafeLinkProps {
  to: string;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

/**
 * Normaliza o caminho da URL para evitar barras duplicadas
 * @param path Caminho a ser normalizado
 * @returns Caminho normalizado
 */
export const normalizePath = (path: string): string => {
  // Remove barras duplicadas (exceto em "http://" ou "https://")
  return path.replace(/([^:]\/)\/+/g, '$1');
};

/**
 * Componente SafeLink que previne barras duplicadas nas URLs
 */
const SafeLink: React.FC<SafeLinkProps> = ({ to, children, ...rest }) => {
  // Normaliza o caminho
  const normalizedPath = normalizePath(to);
  
  return (
    <WouterLink to={normalizedPath} {...rest}>
      {children}
    </WouterLink>
  );
};

export default SafeLink;