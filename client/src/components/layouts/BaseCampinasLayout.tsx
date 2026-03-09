import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { LogOut, User } from 'lucide-react';

interface BaseCampinasLayoutProps {
  children: React.ReactNode;
}

const BaseCampinasLayout: React.FC<BaseCampinasLayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      // Fazer logout direto via API sem usar o contexto (que redireciona para /)
      const response = await fetch('/api/logout', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        // Limpar storage local
        localStorage.removeItem('authToken');
        console.log("Logout realizado com sucesso");
        
        // Redirecionar para a mesma página - o middleware irá interceptar e redirecionar para login
        window.location.href = '/bases/campinas';
      } else {
        console.error("Erro no logout:", response.statusText);
      }
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center text-sm text-gray-600">
              <span>Sistema de Gestão de Frotas</span>
              <span className="mx-2">→</span>
              <span>Base Campinas</span>
            </div>
            {user && (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <User className="w-4 h-4" />
                  <span>{user.name}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-3 py-1 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
                  title="Sair do sistema"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sair</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      {children}
    </div>
  );
};

export default BaseCampinasLayout;