import { useContext } from 'react';
import { AuthContext } from '@/context/AuthContext';

// Esta função é apenas um wrapper sobre o hook já exportado em AuthContext
// para manter a compatibilidade com o código que pode estar usando este caminho
export function useAuth() {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  
  return context;
}